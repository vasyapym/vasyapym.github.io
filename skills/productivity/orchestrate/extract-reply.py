#!/usr/bin/env python3
"""extract-reply — acquire a stored specialist reply from the opencode session database.

Read-only SQLite helper: it opens the session database through a single
``file:`` URI with ``mode=ro``, keeps every read inside one bounded
transaction, and never modifies the database or its sidecars. The only files
it ever writes are the destination reply and its ``.source.json`` receipt.

On-demand reference: ``extract-reply.md`` beside this file.

Exit codes: 0 acquisition succeeded (including capture-only), 1 no unique
fully matching candidate (nothing written), 2 usage, schema, decoding,
database or file failure with a named cause on stderr (nothing written).
"""

import argparse
import datetime
import hashlib
import json
import os
import re
import sqlite3
import stat
import sys
from pathlib import Path

EXIT_OK = 0
EXIT_NO_CANDIDATE = 1
EXIT_FAIL = 2

DEFAULT_DB = "~/.local/share/opencode/opencode.db"
BUSY_TIMEOUT_SECONDS = 5.0
REPORT_CAP = 20

RECEIPT_SCHEMA = 1
SOURCE_FIELD = "session_message.data.text"
STORAGE_GENERATION = "v2-direct-text"

# Validated before any query relies on them (see extract-reply.md).
REQUIRED_TABLES = {
    "session_v2": ["id", "parent_id"],
    "session_message": ["id", "session_id", "type", "time_created", "data"],
    "session_part": ["message_id", "session_id", "ordinal", "type", "data"],
}
LEGACY_TABLES = ("session", "message", "part")

PROFILE_KEYS = {
    "version",
    "required_lines",
    "line_counts",
    "terminal_line",
    "forbidden_lines",
}


class Fail(Exception):
    """Exit 2: a named failure cause."""


class Refused(Exception):
    """Exit 1: no unique fully matching candidate, or a named guard refusal."""

    def __init__(self, reason, report=None):
        super().__init__(reason)
        self.reason = reason
        self.report = report


# ---------------------------------------------------------------------------
# small helpers


def iso_utc(ms):
    if ms is None:
        return "none"
    dt = datetime.datetime.fromtimestamp(ms / 1000.0, tz=datetime.timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_since(raw):
    """Return the --since bound in epoch milliseconds (inclusive)."""
    text = raw.strip()
    if re.fullmatch(r"[+-]?\d+(?:\.\d+)?", text):
        value = float(text)
        if abs(value) >= 1e11:
            return value  # already epoch milliseconds
        return value * 1000.0
    iso = text[:-1] + "+00:00" if text.endswith("Z") else text
    try:
        parsed = datetime.datetime.fromisoformat(iso)
    except ValueError:
        raise Fail(f"unparsable --since: {raw}")
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=datetime.timezone.utc)
    return parsed.timestamp() * 1000.0


def split_physical_lines(text):
    """Physical lines end at LF; one optional CR before LF is the CRLF terminator."""
    lines = []
    for chunk in text.split("\n"):
        if chunk.endswith("\r"):
            chunk = chunk[:-1]
        lines.append(chunk)
    return lines


def terminal_line_matches(lines, sentinel):
    """Final non-whitespace-only physical line equals the sentinel exactly."""
    for line in reversed(lines):
        if line.strip() != "":
            return line == sentinel
    return False


def remove_quiet(path):
    try:
        os.unlink(path)
    except OSError:
        pass


def read_file(path):
    try:
        with open(path, "rb") as handle:
            return handle.read()
    except OSError as exc:
        raise Fail(f"cannot read {path}: {exc}")


# ---------------------------------------------------------------------------
# profile


def load_profile(path):
    """Parse and strictly validate the marker profile (version 1)."""
    try:
        raw = Path(path).read_bytes()
    except OSError as exc:
        raise Fail(f"profile not readable: {exc}")
    digest = hashlib.sha256(raw).hexdigest()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise Fail("profile is not valid UTF-8")
    try:
        parsed = json.loads(text)
    except ValueError as exc:
        raise Fail(f"profile is not JSON: {exc}")
    if not isinstance(parsed, dict):
        raise Fail("profile must be a JSON object")
    unknown = sorted(set(parsed) - PROFILE_KEYS)
    if unknown:
        raise Fail("profile: unknown keys: " + ", ".join(unknown))
    version = parsed.get("version")
    if isinstance(version, bool) or not isinstance(version, int) or version != 1:
        raise Fail(f"profile: unsupported version: {version!r}")
    required = parsed.get("required_lines", [])
    if not isinstance(required, list) or any(not isinstance(x, str) for x in required):
        raise Fail("profile: required_lines must be a list of strings")
    raw_counts = parsed.get("line_counts", [])
    if not isinstance(raw_counts, list):
        raise Fail("profile: line_counts must be a list")
    counts = []
    for index, entry in enumerate(raw_counts):
        if not isinstance(entry, dict) or set(entry) != {"pattern", "exact"}:
            raise Fail(f"profile: line_counts[{index}] must have exactly 'pattern' and 'exact'")
        pattern = entry["pattern"]
        exact = entry["exact"]
        if (
            not isinstance(pattern, str)
            or isinstance(exact, bool)
            or not isinstance(exact, int)
            or exact < 0
        ):
            raise Fail(
                f"profile: line_counts[{index}] needs a string pattern and a non-negative integer exact"
            )
        try:
            rx = re.compile(pattern)
        except re.error as exc:
            raise Fail(f"profile: invalid regex in line_counts[{index}]: {exc}")
        counts.append((rx, exact, pattern))
    terminal = parsed.get("terminal_line")
    if terminal is not None and not isinstance(terminal, str):
        raise Fail("profile: terminal_line must be a string")
    if terminal == "":
        terminal = None  # an empty sentinel is no check
    forbidden = parsed.get("forbidden_lines", [])
    if not isinstance(forbidden, list) or any(not isinstance(x, str) for x in forbidden):
        raise Fail("profile: forbidden_lines must be a list of strings")
    if not (required or counts or terminal is not None or forbidden):
        raise Fail("profile has no check beyond the phrase")
    return {
        "required": required,
        "counts": counts,
        "terminal": terminal,
        "forbidden": forbidden,
        "sha256": digest,
    }


# ---------------------------------------------------------------------------
# scoring


def score(text, phrase, profile):
    """Score every check; a candidate passes only when all of them pass."""
    lines = split_physical_lines(text)
    checks = {"phrase": phrase in text}
    failed = []
    if not checks["phrase"]:
        failed.append("phrase")
    required = []
    for index, want in enumerate(profile["required"]):
        matches = sum(1 for line in lines if line == want)
        required.append({"index": index, "matches": matches, "pass": matches >= 1})
        if matches < 1:
            failed.append(f"required_lines[{index}]")
    counts = []
    for index, (rx, exact, _raw) in enumerate(profile["counts"]):
        observed = sum(1 for line in lines if rx.fullmatch(line) is not None)
        counts.append({"index": index, "exact": exact, "observed": observed, "pass": observed == exact})
        if observed != exact:
            failed.append(f"line_counts[{index}]")
    checks["required_lines"] = required
    checks["line_counts"] = counts
    if profile["terminal"] is not None:
        ok = terminal_line_matches(lines, profile["terminal"])
        checks["terminal_line"] = {"pass": ok}
        if not ok:
            failed.append("terminal_line")
    forbidden = []
    for index, bad in enumerate(profile["forbidden"]):
        present = any(line == bad for line in lines)
        forbidden.append({"index": index, "pass": not present})
        if present:
            failed.append(f"forbidden_lines[{index}]")
    checks["forbidden_lines"] = forbidden
    return (not failed), checks, failed


def format_checks(checks):
    parts = ["phrase=" + ("pass" if checks["phrase"] else "fail")]
    for item in checks.get("required_lines", []):
        state = "pass" if item["pass"] else f"fail(matches={item['matches']})"
        parts.append(f"required_lines[{item['index']}]=" + state)
    for item in checks.get("line_counts", []):
        state = "pass" if item["pass"] else f"fail(observed={item['observed']} exact={item['exact']})"
        parts.append(f"line_counts[{item['index']}]=" + state)
    terminal = checks.get("terminal_line")
    if terminal is not None:
        parts.append("terminal_line=" + ("pass" if terminal["pass"] else "fail"))
    for item in checks.get("forbidden_lines", []):
        state = "pass" if item["pass"] else "fail"
        parts.append(f"forbidden_lines[{item['index']}]=" + state)
    return " ".join(parts)


# ---------------------------------------------------------------------------
# database phase (single read-only connection)


def open_db(db_path):
    """The only connect site: a read-only ``file:`` URI with a bounded timeout."""
    uri = "file:" + db_path + "?mode=ro"
    return sqlite3.connect(uri, uri=True, timeout=BUSY_TIMEOUT_SECONDS, isolation_level=None)


def classify_db_error(exc):
    message = str(exc)
    low = message.lower()
    if "locked" in low or "busy" in low:
        return Fail(f"database busy ({message})")
    return Fail(f"database error: {message}")


def decode_row(conn, message_id, data):
    """Structurally decode one enumerated row; any defect is exit 2."""
    if isinstance(data, bytes):
        try:
            data = data.decode("utf-8")
        except UnicodeDecodeError:
            raise Fail(f"message {message_id}: data is not valid UTF-8")
    elif not isinstance(data, str):
        raise Fail(f"message {message_id}: data column has unsupported type {type(data).__name__}")
    try:
        parsed = json.loads(data)
    except ValueError:
        raise Fail(f"message {message_id}: data is not valid JSON")
    text = parsed.get("text") if isinstance(parsed, dict) else None
    if not isinstance(text, str):
        has_parts = conn.execute(
            "SELECT 1 FROM session_part WHERE message_id = ? AND type = 'text' LIMIT 1",
            (message_id,),
        ).fetchone()
        if has_parts is not None:
            raise Fail(
                f"message {message_id}: parts-only storage (no direct data.text); "
                "reconstruction is not supported"
            )
        raise Fail(f"message {message_id}: no direct text (data.text missing or not a string)")
    return text


def encodable_bytes(candidate):
    """Strict UTF-8 bytes of a row's text; unencodable text is exit 2."""
    try:
        return candidate["text"].encode("utf-8")
    except UnicodeEncodeError:
        raise Fail(f"message {candidate['id']}: text is not encodable as strict UTF-8")


def probe_guard(conn, session, message_id, since_ms, exclude_messages):
    """Explain why a --message named row is out of the scoped enumeration (exit 1)."""
    row = conn.execute(
        "SELECT type, session_id, time_created FROM session_message WHERE id = ?",
        (message_id,),
    ).fetchone()
    if row is None:
        raise Refused(f"guard message-not-found: message {message_id} does not exist")
    role, row_session, row_time = row
    if row_session != session:
        raise Refused(f"guard session-scope: message {message_id} belongs to session {row_session}")
    if role != "user":
        raise Refused(f"guard role: message {message_id} has type {role}, not user")
    if message_id in exclude_messages:
        raise Refused(f"guard excluded: message {message_id} matches --exclude-message")
    if since_ms is not None and row_time is not None and row_time < since_ms:
        raise Refused(f"guard bounds: message {message_id} predates --since")
    raise Refused(
        f"guard message-not-found: message {message_id} does not exist in the scoped enumeration"
    )


def db_phase(db_path, session, message_id, since_ms, exclude_messages):
    """Open, validate, enumerate and structurally decode; close before scoring."""
    if not os.path.isfile(db_path):
        raise Fail(f"database not found: {db_path}")
    scope = {
        "db": db_path,
        "session": session,
        "parent_id": None,
        "message": message_id,
        "since": since_ms,
        "out_of_bounds": 0,
        "excluded": 0,
    }
    candidates = []
    try:
        conn = open_db(db_path)
    except sqlite3.Error as exc:
        raise classify_db_error(exc)
    try:
        # One bounded read transaction; rolled back and closed below.
        conn.execute("BEGIN DEFERRED")
        tables = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
        missing = [name for name in sorted(REQUIRED_TABLES) if name not in tables]
        legacy_present = any(name in tables for name in LEGACY_TABLES)
        if missing:
            if legacy_present and not (set(REQUIRED_TABLES) & tables):
                raise Fail("unsupported storage: v1-only (the v2 tables are absent)")
            raise Fail(f"schema: missing table {missing[0]}")
        for table_name in sorted(REQUIRED_TABLES):
            actual = {row[1] for row in conn.execute('PRAGMA table_info("%s")' % table_name)}
            for column in REQUIRED_TABLES[table_name]:
                if column not in actual:
                    raise Fail(f"schema: table {table_name} lacks column {column}")
        session_row = conn.execute(
            "SELECT parent_id FROM session_v2 WHERE id = ?", (session,)
        ).fetchone()
        if session_row is None:
            legacy_hit = None
            if "session" in tables:
                legacy_hit = conn.execute("SELECT 1 FROM session WHERE id = ?", (session,)).fetchone()
            if legacy_hit is not None:
                raise Fail(f"legacy session unsupported: {session}")
            raise Fail(f"unknown session: {session}")
        scope["parent_id"] = session_row[0]

        sql = "SELECT id, time_created, data FROM session_message WHERE session_id = ? AND type = 'user'"
        params = [session]
        if message_id is not None:
            sql += " AND id = ?"
            params.append(message_id)
        if since_ms is not None:
            sql += " AND time_created >= ?"
            params.append(since_ms)
        sql += " ORDER BY time_created, id"
        rows = conn.execute(sql, params).fetchall()
        if since_ms is not None:
            count_sql = (
                "SELECT count(*) FROM session_message WHERE session_id = ? AND type = 'user'"
            )
            count_params = [session]
            if message_id is not None:
                count_sql += " AND id = ?"
                count_params.append(message_id)
            count_sql += " AND time_created < ?"
            count_params.append(since_ms)
            scope["out_of_bounds"] = conn.execute(count_sql, count_params).fetchone()[0]
        for message_id_value, time_ms, data in rows:
            if message_id_value in exclude_messages:
                scope["excluded"] += 1
                continue
            text = decode_row(conn, message_id_value, data)
            candidates.append({"id": message_id_value, "time_ms": time_ms, "text": text})
        if not candidates and message_id is not None:
            probe_guard(conn, session, message_id, since_ms, exclude_messages)
    except sqlite3.Error as exc:
        raise classify_db_error(exc)
    finally:
        try:
            conn.rollback()
        except sqlite3.Error:
            pass
        conn.close()
    return scope, candidates


# ---------------------------------------------------------------------------
# reporting, receipt, publication


def render_report(scope, hits, phrase_used=True):
    lines = []
    lines.append(
        "scope: session=%s parent=%s db=%s message=%s"
        % (scope["session"], scope["parent_id"] or "none", scope["db"], scope["message"] or "none")
    )
    lines.append(
        "bounds: since=%s out_of_bounds=%d excluded=%d"
        % (iso_utc(scope["since"]), scope["out_of_bounds"], scope["excluded"])
    )
    total = len(hits)
    shown = hits[:REPORT_CAP]
    hidden = total - len(shown)
    suffix = f" (report truncated: {hidden} not shown)" if hidden else ""
    lines.append(f"phrase hits: total={total} shown={len(shown)}{suffix}")
    for candidate in shown:
        lines.append(
            "candidate message=%s time=%s bytes=%d result=%s"
            % (
                candidate["id"],
                iso_utc(candidate["time_ms"]),
                len(candidate["bytes"]),
                "pass" if candidate["pass"] else "fail",
            )
        )
        lines.append("  checks: " + format_checks(candidate["checks"]))
    return "\n".join(lines)


def build_receipt(scope, selected, mode, profile, extracted_at):
    return {
        "schema": RECEIPT_SCHEMA,
        "mode": mode,
        "source": SOURCE_FIELD,
        "storage": STORAGE_GENERATION,
        "db": scope["db"],
        "session_id": scope["session"],
        "session_parent_id": scope["parent_id"],
        "message_id": selected["id"],
        "message_time": iso_utc(selected["time_ms"]),
        "extracted_at": extracted_at,
        "byte_length": len(selected["bytes"]),
        "sha256": hashlib.sha256(selected["bytes"]).hexdigest(),
        "profile_sha256": profile["sha256"],
        "checks": selected["checks"],
        "failed_checks": selected["failed"],
    }


def provenance(receipt):
    return {key: value for key, value in receipt.items() if key != "extracted_at"}


def create_file(path, data):
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except OSError as exc:
        raise Fail(f"cannot write {path}: {exc}")
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
    except OSError as exc:
        remove_quiet(path)
        raise Fail(f"cannot write {path}: {exc}")


def publish(out_path, out_bytes, receipt_path, receipt_obj, receipt_bytes):
    """No-clobber publication: identical pair + matching provenance is a no-op."""
    out_exists = os.path.exists(out_path)
    receipt_exists = os.path.exists(receipt_path)
    if out_exists != receipt_exists:
        missing = receipt_path if out_exists else out_path
        raise Fail(f"incomplete output/receipt pair: {missing} is missing")
    if out_exists:
        try:
            out_stat = os.stat(out_path)
            receipt_stat = os.stat(receipt_path)
        except OSError as exc:
            raise Fail(f"cannot read existing pair: {exc}")
        if not stat.S_ISREG(out_stat.st_mode) or not stat.S_ISREG(receipt_stat.st_mode):
            raise Fail(f"existing pair is not a pair of regular files: {out_path}")
        if read_file(out_path) != out_bytes:
            raise Fail(f"conflict: existing output differs: {out_path}")
        try:
            existing = json.loads(read_file(receipt_path).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            raise Fail(f"conflict: existing receipt is unreadable: {receipt_path}")
        if not isinstance(existing, dict) or provenance(existing) != provenance(receipt_obj):
            raise Fail(f"conflict: provenance differs (message id, profile hash or mode): {receipt_path}")
        return "noop"
    create_file(out_path, out_bytes)
    try:
        create_file(receipt_path, receipt_bytes)
    except Fail:
        remove_quiet(out_path)
        raise
    return "written"


# ---------------------------------------------------------------------------
# main flow


def build_parser():
    parser = argparse.ArgumentParser(
        prog="extract-reply.py",
        description="Acquire a stored specialist reply from the opencode session database (read-only).",
    )
    parser.add_argument("phrase", help="identifying phrase searched in the decoded message text")
    parser.add_argument("profile", help="path to the marker profile JSON (version 1)")
    parser.add_argument("--session", required=True, help="receiving session id (the only session searched)")
    parser.add_argument(
        "--out", required=True, help="destination reply file; receipt is written as <out>.source.json"
    )
    parser.add_argument("--db", help=f"session database path (default: {DEFAULT_DB})")
    parser.add_argument(
        "--message", help="candidate message id (still checked for role, session and profile)"
    )
    parser.add_argument(
        "--since",
        help="only messages at or after this bound: epoch seconds, epoch milliseconds (>=1e11) or ISO-8601",
    )
    parser.add_argument(
        "--exclude-session",
        action="append",
        default=[],
        metavar="ID",
        help="session id to exclude; repeatable (no effect beyond the receiving session)",
    )
    parser.add_argument(
        "--exclude-message",
        action="append",
        default=[],
        metavar="ID",
        help="message id to exclude; repeatable",
    )
    parser.add_argument(
        "--capture-only",
        action="store_true",
        help="preserve the named message with failed checks recorded (requires --message)",
    )
    return parser


def run(args):
    """Return (exit_code, stdout_text, stderr_text) or raise Fail/Refused."""
    if args.phrase == "":
        raise Fail("empty phrase: an identifying phrase is required")
    if args.capture_only and not args.message:
        raise Fail("--capture-only requires --message <id>")
    profile = load_profile(args.profile)
    since_ms = parse_since(args.since) if args.since is not None else None
    if args.session in (args.exclude_session or []):
        raise Fail("scope contradiction: --exclude-session repeats --session")
    exclude_messages = set(args.exclude_message or [])
    db_path = os.path.abspath(os.path.expanduser(args.db if args.db else DEFAULT_DB))

    scope, candidates = db_phase(db_path, args.session, args.message, since_ms, exclude_messages)

    if args.capture_only:
        # The enumeration is already narrowed to the named row; marker checks
        # are scored and recorded but cannot block the capture.
        selected = candidates[0]
        selected["bytes"] = encodable_bytes(selected)
        selected["pass"], selected["checks"], selected["failed"] = score(
            selected["text"], args.phrase, profile
        )
        hits = candidates
    else:
        hits = []
        for candidate in candidates:
            if args.phrase in candidate["text"]:
                candidate["bytes"] = encodable_bytes(candidate)
                candidate["pass"], candidate["checks"], candidate["failed"] = score(
                    candidate["text"], args.phrase, profile
                )
                hits.append(candidate)

    report = render_report(scope, hits)
    if args.capture_only:
        mode = "capture-only"
    elif args.message is not None:
        passing = [candidate for candidate in hits if candidate["pass"]]
        if not passing:
            raise Refused(
                f"named message {args.message} does not fully pass the profile; "
                "a named id earns no waiver",
                report,
            )
        selected = passing[0]
        mode = "profile"
    else:
        passing = [candidate for candidate in hits if candidate["pass"]]
        if not passing:
            if not hits:
                raise Refused("no phrase hits in scope", report)
            raise Refused(f"{len(hits)} phrase hits, none fully passed the profile", report)
        if len(passing) > 1:
            raise Refused(
                f"{len(passing)} candidates fully passed the profile; no tie-break is applied",
                report,
            )
        selected = passing[0]
        mode = "profile"

    extracted_at = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    receipt = build_receipt(scope, selected, mode, profile, extracted_at)
    receipt_bytes = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode("utf-8")
    out_path = args.out
    receipt_path = out_path + ".source.json"
    status = publish(out_path, selected["bytes"], receipt_path, receipt, receipt_bytes)
    tail = (
        f"extract-reply: exit 0 mode={mode} message={selected['id']} "
        f"bytes={len(selected['bytes'])} out={out_path} receipt={receipt_path} result={status}"
    )
    return EXIT_OK, report + "\n" + tail, ""


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        code, out_text, err_text = run(args)
    except Fail as exc:
        sys.stderr.write(f"extract-reply: error: {exc}\n")
        return EXIT_FAIL
    except Refused as exc:
        if exc.report:
            sys.stdout.write(exc.report + "\n")
        sys.stderr.write(f"extract-reply: exit 1: {exc.reason}\n")
        return EXIT_NO_CANDIDATE
    except KeyboardInterrupt:
        raise
    except Exception as exc:  # named cause only; never a traceback
        sys.stderr.write(f"extract-reply: error: unexpected {type(exc).__name__}: {exc}\n")
        return EXIT_FAIL
    if out_text:
        sys.stdout.write(out_text + "\n")
    if err_text:
        sys.stderr.write(err_text + "\n")
    return code


if __name__ == "__main__":
    sys.exit(main())
