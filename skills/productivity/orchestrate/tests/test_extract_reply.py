"""Fixture suite for extract-reply.py — plan items H1-H3, F1-F13, G1-G9, P1-P4, S1-S3.

Safety contract for this suite (operational cautions C1-C4):
- Fixtures are disposable temp SQLite files; the host database is never opened
  by the suite. The DDL below was exported once, by hand, with a read-only
  connection, and is vendored here.
- The CLI always runs as a real subprocess with ``--db`` pointed at a temp
  fixture and ``HOME``/``USERPROFILE`` redirected into the temp dir.
- Every fixture body embeds CANARY. run_cli() fails any run whose stdout or
  stderr contains the canary, and exit-0 tests additionally check receipt
  bytes (H3).
"""

import hashlib
import json
import os
import re
import shutil
import sqlite3
import stat
import subprocess
import sys
import tempfile
import unittest
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "extract-reply.py"

# --------------------------------------------------------------------------
# H1: vendored schema-only DDL.
#
# Export date: 2026-11-12, from ~/.local/share/opencode/opencode.db
# (schema-only, via a python sqlite3 connection opened with a file: URI in
# mode=ro; fetched, connection closed promptly; no sidecar writes, no copies).
# Statements below are verbatim; they are grouped tables-first so
# executescript() can run the export in one pass.
# --------------------------------------------------------------------------

HOST_DDL = """\
-- Vendored schema-only DDL. Export date: 2026-11-12.
-- Source: ~/.local/share/opencode/opencode.db (v1/v2 session and message tables).
CREATE TABLE `session` (
          `id` text PRIMARY KEY,
          `project_id` text NOT NULL,
          `workspace_id` text,
          `parent_id` text,
          `slug` text NOT NULL,
          `directory` text NOT NULL,
          `path` text,
          `title` text NOT NULL,
          `version` text NOT NULL,
          `share_url` text,
          `summary_additions` integer,
          `summary_deletions` integer,
          `summary_files` integer,
          `summary_diffs` text,
          `metadata` text,
          `cost` real DEFAULT 0 NOT NULL,
          `tokens_input` integer DEFAULT 0 NOT NULL,
          `tokens_output` integer DEFAULT 0 NOT NULL,
          `tokens_reasoning` integer DEFAULT 0 NOT NULL,
          `tokens_cache_read` integer DEFAULT 0 NOT NULL,
          `tokens_cache_write` integer DEFAULT 0 NOT NULL,
          `revert` text,
          `permission` text,
          `agent` text,
          `model` text,
          `time_created` integer NOT NULL,
          `time_updated` integer NOT NULL,
          `time_compacting` integer,
          `time_archived` integer,
          CONSTRAINT `fk_session_project_id_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE
        );
CREATE TABLE `message` (
          `id` text PRIMARY KEY,
          `session_id` text NOT NULL,
          `time_created` integer NOT NULL,
          `time_updated` integer NOT NULL,
          `data` text NOT NULL,
          CONSTRAINT `fk_message_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE
        );
CREATE TABLE `part` (
          `id` text PRIMARY KEY,
          `message_id` text NOT NULL,
          `session_id` text NOT NULL,
          `time_created` integer NOT NULL,
          `time_updated` integer NOT NULL,
          `data` text NOT NULL,
          CONSTRAINT `fk_part_message_id_message_id_fk` FOREIGN KEY (`message_id`) REFERENCES `message`(`id`) ON DELETE CASCADE
        );
CREATE TABLE `session_v2` (
          `id` text PRIMARY KEY,
          `project_id` text NOT NULL,
          `workspace_id` text,
          `parent_id` text,
          `fork_session_id` text,
          `fork_boundary` text,
          `slug` text NOT NULL,
          `directory` text NOT NULL,
          `path` text,
          `title` text,
          `version` text NOT NULL,
          `share_url` text,
          `summary_additions` integer,
          `summary_deletions` integer,
          `summary_files` integer,
          `summary_diffs` text,
          `metadata` text,
          `cost` real DEFAULT 0 NOT NULL,
          `tokens_input` integer DEFAULT 0 NOT NULL,
          `tokens_output` integer DEFAULT 0 NOT NULL,
          `tokens_reasoning` integer DEFAULT 0 NOT NULL,
          `tokens_cache_read` integer DEFAULT 0 NOT NULL,
          `tokens_cache_write` integer DEFAULT 0 NOT NULL,
          `revert` text,
          `permission` text,
          `agent` text,
          `model` text,
          `time_created` integer NOT NULL,
          `time_updated` integer NOT NULL,
          `time_compacting` integer,
          `time_archived` integer,
          `time_suspended` integer, `resume_attempts` integer DEFAULT 0 NOT NULL, `time_idle` integer, `time_viewed` integer, `idle_outcome` text, `time_busy` integer,
          CONSTRAINT `fk_session_v2_project_id_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE
        );
CREATE TABLE "session_message" (
          `id` text PRIMARY KEY,
          `session_id` text NOT NULL,
          `type` text NOT NULL,
          `seq` integer NOT NULL,
          `time_created` integer NOT NULL,
          `time_updated` integer NOT NULL,
          `data` text NOT NULL,
          CONSTRAINT `fk_session_message_session_id_session_v2_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session_v2`(`id`) ON DELETE CASCADE
        );
CREATE TABLE `session_part` (
          `message_id` text NOT NULL,
          `session_id` text NOT NULL,
          `ordinal` integer NOT NULL,
          `type` text NOT NULL,
          `call_id` text,
          `time_created` integer NOT NULL,
          `time_updated` integer NOT NULL,
          `data` text NOT NULL,
          CONSTRAINT `session_part_pk` PRIMARY KEY(`message_id`, `ordinal`),
          CONSTRAINT `fk_session_part_message_id_session_message_id_fk` FOREIGN KEY (`message_id`) REFERENCES `session_message`(`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_session_part_session_id_session_v2_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session_v2`(`id`) ON DELETE CASCADE
        );
CREATE INDEX `message_session_time_created_id_idx` ON `message` (`session_id`,`time_created`,`id`);
CREATE INDEX `part_message_id_id_idx` ON `part` (`message_id`,`id`);
CREATE INDEX `part_session_idx` ON `part` (`session_id`);
CREATE INDEX `session_parent_idx` ON `session` (`parent_id`);
CREATE UNIQUE INDEX `session_message_session_seq_idx` ON `session_message` (`session_id`,`seq`);
CREATE INDEX `session_message_session_time_created_id_idx` ON `session_message` (`session_id`,`time_created`,`id`);
CREATE INDEX `session_message_session_type_seq_idx` ON `session_message` (`session_id`,`type`,`seq`);
CREATE INDEX `session_message_time_created_idx` ON `session_message` (`time_created`);
CREATE INDEX `session_part_session_message_idx` ON `session_part` (`session_id`,`message_id`,`ordinal`);
CREATE INDEX `session_v2_parent_idx` ON `session_v2` (`parent_id`);
"""

# --------------------------------------------------------------------------
# fixture vocabulary


CANARY = "canary-8f3a-keep-hidden"
PHRASE = "orchestrate-batch-1"
PREFLIGHT = "REPLY: orchestrate-batch-1"
TERMINAL = "COMPLETE"
FORBIDDEN = "TRUNCATED-HERE"
STEP = "STEP-1: ok"
T0 = 1_700_000_000_000  # epoch ms fixture base (2023-11-14T22:13:20Z)

_seq = 0


def next_seq():
    global _seq
    _seq += 1
    return _seq


def cbody(text):
    """Fixture body with the canary prepended as its own physical line."""
    return CANARY + "\n" + text


def std_reply():
    return PREFLIGHT + "\n" + STEP + "\n" + TERMINAL


def std_profile():
    return {
        "version": 1,
        "required_lines": [PREFLIGHT],
        "line_counts": [{"pattern": "^STEP-[0-9]+: ok$", "exact": 1}],
        "terminal_line": TERMINAL,
        "forbidden_lines": [FORBIDDEN],
    }


def mini_profile(required=None, counts=None, terminal=None, forbidden=None, **kw):
    profile = {"version": 1}
    profile["required_lines"] = [PREFLIGHT] if required is None else required
    if counts is not None:
        profile["line_counts"] = counts
    if terminal is not None:
        profile["terminal_line"] = terminal
    if forbidden is not None:
        profile["forbidden_lines"] = forbidden
    profile.update(kw)
    return profile


def build_fixture(path, ddl=HOST_DDL):
    """Build a disposable fixture by executing the vendored DDL verbatim."""
    if not ddl or not ddl.strip():
        raise ValueError("fixture DDL is absent: the vendored schema export is required")
    conn = sqlite3.connect(str(path))
    try:
        conn.executescript(ddl)
    finally:
        conn.close()
    return path


def add_session(conn, sid, parent=None):
    conn.execute(
        "INSERT INTO session_v2 (id, project_id, parent_id, slug, directory, version,"
        " time_created, time_updated) VALUES (?,?,?,?,?,?,?,?)",
        (sid, "proj-fixture", parent, "slug-" + sid, "/fixture", "test", T0, T0),
    )


def add_message(conn, sid, mid, role, text, created_ms=None, raw=False):
    """Insert a session_message row; returns the stored text (canary-guarded)."""
    if CANARY not in text:
        text = cbody(text)
    created_ms = T0 if created_ms is None else created_ms
    data = json.dumps({"time": {"created": created_ms}, "text": text}, ensure_ascii=not raw)
    conn.execute(
        "INSERT INTO session_message (id, session_id, type, seq, time_created, time_updated, data)"
        " VALUES (?,?,?,?,?,?,?)",
        (mid, sid, role, next_seq(), created_ms, T0, data),
    )
    return text


def add_part(conn, sid, mid, ordinal, text):
    if CANARY not in text:
        text = cbody(text)
    conn.execute(
        "INSERT INTO session_part (message_id, session_id, ordinal, type, call_id,"
        " time_created, time_updated, data) VALUES (?,?,?,?,?,?,?,?)",
        (mid, sid, ordinal, "text", None, T0, T0, json.dumps({"type": "text", "text": text})),
    )


def add_legacy_session(conn, sid):
    conn.execute(
        "INSERT INTO session (id, project_id, parent_id, slug, directory, title, version,"
        " time_created, time_updated) VALUES (?,?,?,?,?,?,?,?,?)",
        (sid, "proj-fixture", None, "slug-" + sid, "/fixture", "t", "test", T0, T0),
    )


def add_legacy_message(conn, sid, mid, text, created_ms=None):
    if CANARY not in text:
        text = cbody(text)
    created_ms = T0 if created_ms is None else created_ms
    conn.execute(
        "INSERT INTO message (id, session_id, time_created, time_updated, data)"
        " VALUES (?,?,?,?,?)",
        (mid, sid, created_ms, T0, json.dumps({"role": "user", "text": text})),
    )
    return text


def add_legacy_part(conn, sid, mid, pid, text):
    if CANARY not in text:
        text = cbody(text)
    conn.execute(
        "INSERT INTO part (id, message_id, session_id, time_created, time_updated, data)"
        " VALUES (?,?,?,?,?,?)",
        (pid, mid, sid, T0, T0, json.dumps({"type": "text", "text": text})),
    )


# --------------------------------------------------------------------------


class ExtractorTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory(prefix="extract-reply-tests-")
        self._tmp = tmp
        self.addCleanup(tmp.cleanup)
        self.base = Path(tmp.name)
        self.home = self.base / "home"
        self.home.mkdir()
        self.outdir = self.base / "out"
        self.outdir.mkdir()

    # -- plumbing ----------------------------------------------------------

    def run_cli(self, args, db, umask=False):
        """Real subprocess; always a temp --db (except H2) and a redirected HOME."""
        env = dict(os.environ)
        env["HOME"] = str(self.home)
        env["USERPROFILE"] = str(self.home)
        pre = None
        if umask and os.name == "posix":
            pre = lambda: os.umask(0o000)  # noqa: E731
        cmd = [sys.executable, str(SCRIPT)]
        if db is not None:
            cmd += ["--db", str(db)]
        cmd += [str(a) for a in args]
        proc = subprocess.run(cmd, capture_output=True, env=env, preexec_fn=pre, timeout=180)
        blob = (proc.stdout or b"") + (proc.stderr or b"")
        self.assertNotIn(
            CANARY.encode(), blob, "canary leaked into CLI output (H3)"
        )
        return proc

    def cli(self, db, session, out, profile_path=None, phrase=PHRASE, extra=None, umask=False):
        args = [phrase, str(profile_path or self.write_profile(std_profile())),
                "--session", session, "--out", str(out)]
        if extra:
            args += extra
        return self.run_cli(args, db=db, umask=umask)

    def assert_receipt_clean(self, out):
        receipt = Path(str(out) + ".source.json")
        if receipt.exists():
            self.assertNotIn(CANARY.encode(), receipt.read_bytes(), "canary leaked into receipt (H3)")
        return receipt

    def fresh_db(self, name="fx.db", ddl=HOST_DDL):
        path = self.base / name
        build_fixture(str(path), ddl=ddl)
        return path

    def open(self, path):
        return sqlite3.connect(str(path))

    def write_profile(self, obj, name="profile.json"):
        path = self.base / name
        path.write_bytes(json.dumps(obj).encode("utf-8"))
        return path

    def success_db(self, name="ok.db", sid="sess-1", mid="m-ok", text=None, created_ms=None, raw=False):
        db = self.fresh_db(name)
        conn = self.open(db)
        try:
            add_session(conn, sid)
            stored = add_message(
                conn, sid, mid, "user",
                cbody(std_reply()) if text is None else text,
                created_ms=created_ms, raw=raw,
            )
            conn.commit()
        finally:
            conn.close()
        return db, stored

    def assert_no_files(self, out):
        self.assertFalse(os.path.exists(str(out)), "output written on a failing run")
        self.assertFalse(os.path.exists(str(out) + ".source.json"), "receipt written on a failing run")

    def out_list(self, directory):
        return sorted(os.listdir(str(directory)))


# --------------------------------------------------------------------------
# Harness H1-H3


class HarnessTests(ExtractorTest):
    def test_h1_builder_executes_ddl_verbatim(self):
        self.assertRegex(HOST_DDL, r"Export date: \d{4}-\d{2}-\d{2}")
        db = self.fresh_db()
        conn = self.open(db)
        try:
            tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            indexes = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='index'")}
        finally:
            conn.close()
        for table in ("session", "message", "part", "session_v2", "session_message", "session_part"):
            self.assertIn(table, tables)
        for index in ("session_message_session_seq_idx", "session_part_session_message_idx"):
            self.assertIn(index, indexes)

    def test_h1_builder_fails_if_ddl_absent(self):
        for empty in ("", "   \n  "):
            with self.subTest(ddl=empty[:10]):
                target = self.base / "never-created.db"
                with self.assertRaises(ValueError):
                    build_fixture(str(target), ddl=empty)
                self.assertFalse(target.exists())

    def test_h2_real_cli_uses_db_override(self):
        db, _ = self.success_db(name="h2.db", sid="s-h2", mid="m-h2")
        out = self.outdir / "h2.md"
        proc = self.cli(db, "s-h2", out)
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertTrue(out.exists())
        self.assert_receipt_clean(out)

    def test_h2_omitting_db_gives_exit2_database_not_found(self):
        out = self.outdir / "h2b.md"
        proc = self.run_cli(
            [PHRASE, str(self.write_profile(std_profile())), "--session", "s", "--out", str(out)],
            db=None,
        )
        self.assertEqual(proc.returncode, 2)
        err = proc.stderr.decode("utf-8", "replace")
        self.assertIn("database not found", err)
        self.assertIn(str(self.home), err, "default db path must resolve under the redirected HOME")
        real_db = os.path.join("~", ".local/share/opencode/opencode.db")
        self.assertNotIn(os.path.expanduser(real_db), err, "the host file must not be reachable")

    def test_h3_canary_never_leaks(self):
        db, _ = self.success_db(name="h3.db", sid="s-h3", mid="m-h3")
        out = self.outdir / "h3.md"
        # success path
        proc = self.cli(db, "s-h3", out)
        self.assertEqual(proc.returncode, 0)
        receipt = self.assert_receipt_clean(out)
        self.assertNotIn(CANARY.encode(), receipt.read_bytes())
        # error paths
        out2 = self.outdir / "h3-bad.md"
        proc = self.run_cli(
            [PHRASE, str(self.write_profile(std_profile(), "p-bad.json")), "--session", "ghost",
             "--out", str(out2)],
            db=db,
        )
        self.assertEqual(proc.returncode, 2)
        self.assert_no_files(out2)
        out3 = self.outdir / "h3-miss.md"
        proc = self.run_cli(
            ["no-such-phrase-in-any-body", str(self.write_profile(std_profile(), "p-miss.json")),
             "--session", "s-h3", "--out", str(out3)],
            db=db,
        )
        self.assertEqual(proc.returncode, 1)
        self.assert_no_files(out3)


# --------------------------------------------------------------------------
# Supported v2 direct text F1-F6


class DirectTextTests(ExtractorTest):
    def test_f1_full_pass_receipt_and_permissions(self):
        db, stored = self.success_db(name="f1.db", sid="sess-1", mid="m-1")
        out = self.outdir / "reply.md"
        prof_path = self.write_profile(std_profile())
        proc = self.cli(db, "sess-1", out, prof_path, umask=(os.name == "posix"))
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        data = stored.encode("utf-8")
        self.assertEqual(out.read_bytes(), data)
        receipt_path = self.assert_receipt_clean(out)
        receipt = json.loads(receipt_path.read_bytes().decode("utf-8"))
        self.assertEqual(receipt["schema"], 1)
        self.assertEqual(receipt["mode"], "profile")
        self.assertIn("data.text", receipt["source"])
        self.assertEqual(receipt["session_id"], "sess-1")
        self.assertEqual(receipt["message_id"], "m-1")
        self.assertEqual(receipt["byte_length"], len(data))
        self.assertEqual(receipt["sha256"], hashlib.sha256(data).hexdigest())
        self.assertEqual(receipt["profile_sha256"], hashlib.sha256(prof_path.read_bytes()).hexdigest())
        self.assertRegex(receipt["message_time"], r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z")
        self.assertRegex(receipt["extracted_at"], r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z")
        self.assertEqual(receipt["failed_checks"], [])
        self.assertTrue(receipt["checks"]["phrase"])
        self.assertTrue(all(item["pass"] for item in receipt["checks"]["required_lines"]))
        self.assertTrue(receipt["checks"]["terminal_line"]["pass"])
        if os.name == "posix":
            self.assertEqual(stat.S_IMODE(os.stat(str(out)).st_mode), 0o600)
            self.assertEqual(stat.S_IMODE(os.stat(str(receipt_path)).st_mode), 0o600)

    def test_f2_fidelity_matrix(self):
        minimal = mini_profile()
        matrix = [
            ("crlf", "line one\r\nline two\r\n" + TERMINAL),
            ("lone-cr", "REPLY: orchestrate-batch-1\rmid dle\r" + TERMINAL),
            ("tabs", "tabbed\there"),
            ("trailing-spaces", "padded   "),
            ("literal-backslash-n", "esc\\nseq"),
            ("double-backslash", "esc\\\\seq"),
            ("escape-spelling-u0041", "esc\\u0041seq"),
            ("json-body", '{"k":"v","n":[1,2]}'),
            ("nfc", "caf\u00e9"),
            ("nfd", "cafe\u0301"),
            ("astral", "\U0001d11e\U0001d11e"),
        ]
        for name, feature in matrix:
            if name == "lone-cr":
                text = feature
                profile = mini_profile(required=[text])
            else:
                text = PREFLIGHT + "\n" + feature + "\n" + TERMINAL
                profile = minimal
            expected = cbody(text).encode("utf-8")
            outputs = []
            for mode_label, raw in (("escaped", False), ("raw-utf8", True)):
                with self.subTest(matrix=name, storage=mode_label):
                    db, stored = self.success_db(
                        name=f"f2-{name}-{mode_label}.db", sid="s-f2", mid="m-f2",
                        text=cbody(text), raw=raw,
                    )
                    self.assertEqual(stored, cbody(text))
                    out = self.outdir / f"f2-{name}-{mode_label}.md"
                    proc = self.cli(db, "s-f2", out, self.write_profile(profile, f"f2-{name}-{mode_label}.json"))
                    self.assertEqual(proc.returncode, 0, proc.stderr.decode())
                    self.assertEqual(out.read_bytes(), expected)
                    receipt = json.loads(Path(str(out) + ".source.json").read_bytes().decode("utf-8"))
                    self.assertEqual(receipt["byte_length"], len(expected))
                    self.assert_receipt_clean(out)
                    outputs.append(out.read_bytes())
            self.assertEqual(outputs[0], outputs[1], f"{name}: escaped and raw storage must agree")

    def test_f3_endings_preserved(self):
        cases = [
            ("no-newline", std_reply()),
            ("one-lf", std_reply() + "\n"),
            ("crlf-blank-lines", std_reply() + "\r\n\r\n"),
            ("ws-only-trailing", std_reply() + "\n   \n\t\n"),
        ]
        for name, text in cases:
            with self.subTest(end=name):
                db, stored = self.success_db(name=f"f3-{name}.db", sid="s-f3", mid="m-f3", text=cbody(text))
                out = self.outdir / f"f3-{name}.md"
                proc = self.cli(db, "s-f3", out)
                self.assertEqual(proc.returncode, 0, proc.stderr.decode())
                self.assertEqual(out.read_bytes(), stored.encode("utf-8"))
                self.assert_receipt_clean(out)
        # a real line after the sentinel still fails the terminal check
        db, stored = self.success_db(
            name="f3-after.db", sid="s-f3b", mid="m-f3b", text=cbody(std_reply() + "\nextra line")
        )
        out = self.outdir / "f3-after.md"
        proc = self.cli(db, "s-f3b", out)
        self.assertEqual(proc.returncode, 1)
        self.assert_no_files(out)

    def test_f4_phrase_matching_rules(self):
        preflight = 'REPLY: orchestrate-batch-1 "quote-\u00fc"'
        text = preflight + "\n" + STEP + "\n" + TERMINAL
        prof = mini_profile(required=[preflight], terminal=TERMINAL)
        prof_path = self.write_profile(prof)
        db, stored = self.success_db(name="f4.db", sid="s-f4", mid="m-f4", text=cbody(text))
        out = self.outdir / "f4-hit.md"
        phrase = 'orchestrate-batch-1 "quote-\u00fc"'
        proc = self.cli(db, "s-f4", out, prof_path, phrase=phrase)
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), stored.encode("utf-8"))
        # phrase spelled in its escaped-JSON form: no hit
        out = self.outdir / "f4-esc.md"
        escaped_phrase = "\\" + '"quote-\u00fc"' + "\\"
        proc = self.cli(db, "s-f4", out, prof_path, phrase=escaped_phrase)
        self.assertEqual(proc.returncode, 1)
        self.assert_no_files(out)
        # case variant: no hit
        out = self.outdir / "f4-case.md"
        proc = self.cli(db, "s-f4", out, prof_path, phrase=phrase.upper())
        self.assertEqual(proc.returncode, 1)
        self.assert_no_files(out)
        # NFD variant: no hit
        out = self.outdir / "f4-nfd.md"
        proc = self.cli(db, "s-f4", out, prof_path, phrase=unicodedata.normalize("NFD", phrase))
        self.assertEqual(proc.returncode, 1)
        self.assert_no_files(out)
        # empty phrase: exit 2
        out = self.outdir / "f4-empty.md"
        proc = self.cli(db, "s-f4", out, prof_path, phrase="")
        self.assertEqual(proc.returncode, 2)
        self.assert_no_files(out)

    def test_f5_parts_ignored_when_direct_text_exists(self):
        direct = cbody(std_reply())
        for label, part_texts in (
            ("equal", [direct, direct]),
            ("different", [CANARY + "\nPART-A", CANARY + "\nPART-B"]),
        ):
            with self.subTest(parts=label):
                db = self.fresh_db(name=f"f5-{label}.db")
                conn = self.open(db)
                try:
                    add_session(conn, "s-f5")
                    stored = add_message(conn, "s-f5", f"m-f5-{label}", "user", direct)
                    for ordinal, part_text in enumerate(part_texts):
                        add_part(conn, "s-f5", f"m-f5-{label}", ordinal, part_text)
                    conn.commit()
                finally:
                    conn.close()
                out = self.outdir / f"f5-{label}.md"
                proc = self.cli(db, "s-f5", out)
                self.assertEqual(proc.returncode, 0, proc.stderr.decode())
                self.assertEqual(out.read_bytes(), direct.encode("utf-8"))
                receipt = json.loads(Path(str(out) + ".source.json").read_bytes().decode("utf-8"))
                self.assertIn("data.text", receipt["source"])
                self.assertEqual(receipt["byte_length"], len(direct.encode("utf-8")))
                self.assert_receipt_clean(out)

    def test_f6_unicode_separators_do_not_split_lines(self):
        feature = "a\u2028b\u0085c\u000cd\u000be"
        text = PREFLIGHT + "\n" + feature + "\n" + TERMINAL
        db, stored = self.success_db(name="f6.db", sid="s-f6", mid="m-f6", text=cbody(text))
        out = self.outdir / "f6.md"
        proc = self.cli(db, "s-f6", out, self.write_profile(mini_profile()))
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        data = out.read_bytes()
        self.assertEqual(data, stored.encode("utf-8"))
        decoded = data.decode("utf-8")
        for ch in ("\u2028", "\u0085", "\u000c", "\u000b"):
            self.assertIn(ch, decoded)
        self.assert_receipt_clean(out)

    def test_f6_lone_cr_body_fails_profile_unnormalised(self):
        text = PREFLIGHT + "\rmid\r" + TERMINAL  # one physical line under the line model
        db, _ = self.success_db(name="f6cr.db", sid="s-f6b", mid="m-f6b", text=cbody(text))
        out = self.outdir / "f6cr.md"
        proc = self.cli(db, "s-f6b", out, self.write_profile(std_profile(), "f6cr.json"))
        self.assertEqual(proc.returncode, 1)
        self.assert_no_files(out)


# --------------------------------------------------------------------------
# Rejected layouts F7-F13


class LayoutTests(ExtractorTest):
    def test_f7_v1_only_is_rejected(self):
        db = self.fresh_db(name="f7.db")
        conn = self.open(db)
        try:
            conn.execute("DROP TABLE session_message")
            conn.execute("DROP TABLE session_part")
            conn.execute("DROP TABLE session_v2")
            add_legacy_session(conn, "s-legacy")
            add_legacy_message(conn, "s-legacy", "m-legacy", cbody(std_reply()))
            add_legacy_part(conn, "s-legacy", "m-legacy", "p-legacy", cbody(std_reply()))
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "f7.md"
        proc = self.cli(db, "s-legacy", out)
        self.assertEqual(proc.returncode, 2)
        self.assertIn("v1-only", proc.stderr.decode())
        self.assert_no_files(out)

    def test_f8_v1_copy_ignored_when_v2_exists(self):
        db = self.fresh_db(name="f8.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-f8")
            add_legacy_session(conn, "s-f8")
            v1_text = add_legacy_message(conn, "s-f8", "m-v1", cbody(std_reply()))
            add_legacy_part(conn, "s-f8", "m-v1", "p-v1", v1_text)
            v2_stored = add_message(conn, "s-f8", "m-v2", "user", cbody(std_reply()))
            conn.commit()
        finally:
            conn.close()
        self.assertEqual(v1_text, v2_stored)  # byte-identical copy in the legacy tables
        out = self.outdir / "f8.md"
        proc = self.cli(db, "s-f8", out)
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), v2_stored.encode("utf-8"))
        receipt = json.loads(Path(str(out) + ".source.json").read_bytes().decode("utf-8"))
        self.assertEqual(receipt["message_id"], "m-v2")
        self.assert_receipt_clean(out)

    def test_f9_legacy_or_unknown_session_is_exit2(self):
        db = self.fresh_db(name="f9.db")
        conn = self.open(db)
        try:
            add_legacy_session(conn, "s-legacy")
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "f9a.md"
        proc = self.cli(db, "s-legacy", out)
        self.assertEqual(proc.returncode, 2, "must never exit 1 for an unresolvable session (pin)")
        self.assertIn("legacy session unsupported", proc.stderr.decode())
        self.assert_no_files(out)
        out = self.outdir / "f9b.md"
        proc = self.cli(db, "s-nowhere", out)
        self.assertEqual(proc.returncode, 2, "must never exit 1 for an unresolvable session (pin)")
        self.assertIn("unknown session", proc.stderr.decode())
        self.assert_no_files(out)

    def test_f10_parts_only_row_is_rejected(self):
        db = self.fresh_db(name="f10.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-f10")
            conn.execute(
                "INSERT INTO session_message (id, session_id, type, seq, time_created, time_updated, data)"
                " VALUES (?,?,?,?,?,?,?)",
                ("m-po", "s-f10", "user", next_seq(), T0, T0,
                 json.dumps({"time": {"created": T0}})),  # no string data.text
            )
            add_part(conn, "s-f10", "m-po", 0, CANARY + "\ntext parts mentioning " + PHRASE)
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "f10.md"
        proc = self.cli(db, "s-f10", out)
        self.assertEqual(proc.returncode, 2)
        err = proc.stderr.decode()
        self.assertIn("parts-only", err)
        self.assertIn("m-po", err)
        self.assert_no_files(out)

    def test_f11_unevaluable_row_fails_closed(self):
        db = self.fresh_db(name="f11.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-f11")
            conn.execute(
                "INSERT INTO session_message (id, session_id, type, seq, time_created, time_updated, data)"
                " VALUES (?,?,?,?,?,?,?)",
                ("m-po", "s-f11", "user", next_seq(), T0, T0,
                 json.dumps({"time": {"created": T0}})),
            )
            add_part(conn, "s-f11", "m-po", 0, CANARY + "\nparts carrying " + PHRASE)
            stored = add_message(
                conn, "s-f11", "m-ok", "user", cbody(std_reply()), created_ms=T0 + 60_000
            )
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "f11.md"
        proc = self.cli(db, "s-f11", out)
        self.assertNotEqual(proc.returncode, 0, "uniqueness is unprovable while m-po is in scope")
        self.assertEqual(proc.returncode, 2, "fail closed (pin)")
        self.assertIn("m-po", proc.stderr.decode())
        self.assert_no_files(out)
        # excluding the row restores a unique full pass
        out = self.outdir / "f11b.md"
        proc = self.cli(db, "s-f11", out, extra=["--exclude-message", "m-po"])
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), stored.encode("utf-8"))
        self.assert_receipt_clean(out)
        # ... as does a bound that leaves it outside the scope
        out = self.outdir / "f11c.md"
        proc = self.cli(db, "s-f11", out, extra=["--since", str(T0 // 1000 + 30)])
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), stored.encode("utf-8"))
        # --message narrows the enumeration to the healthy row
        out = self.outdir / "f11d.md"
        proc = self.cli(db, "s-f11", out, extra=["--message", "m-ok"])
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), stored.encode("utf-8"))

    def test_f12_schema_defects_name_the_gap(self):
        for column in ("data", "session_id"):
            with self.subTest(column=column):
                start = HOST_DDL.index('CREATE TABLE "session_message"')
                end = HOST_DDL.index(";", start)
                block = HOST_DDL[start:end]
                line = f"          `{column}` text NOT NULL,\n"
                self.assertIn(line, block)
                patched = block.replace(line, "", 1)
                if column == "session_id":
                    # dropping the linkage column must drop its constraint too,
                    # and the block then needs its trailing comma removed
                    constraint = ("          CONSTRAINT `fk_session_message_session_id_session_v2_id_fk`"
                                  " FOREIGN KEY (`session_id`) REFERENCES `session_v2`(`id`)"
                                  " ON DELETE CASCADE\n")
                    self.assertIn(constraint, patched)
                    patched = patched.replace(constraint, "", 1)
                    patched = patched.replace(
                        "          `data` text NOT NULL,\n        )",
                        "          `data` text NOT NULL\n        )",
                    )
                ddl = HOST_DDL[:start] + patched + HOST_DDL[end:]
                if column == "session_id":
                    # also drop the indexes that reference the removed column
                    keep = []
                    for ddl_line in ddl.splitlines(keepends=True):
                        if re.match(r"CREATE (?:UNIQUE )?INDEX .* ON `session_message` \(`session_id`", ddl_line):
                            continue
                        keep.append(ddl_line)
                    ddl = "".join(keep)
                db = self.fresh_db(name=f"f12-{column}.db", ddl=ddl)
                out = self.outdir / f"f12-{column}.md"
                proc = self.cli(db, "any-session", out)
                self.assertEqual(proc.returncode, 2)
                err = proc.stderr.decode()
                self.assertIn("session_message", err)
                self.assertIn(column, err)
                self.assert_no_files(out)

    def test_f12_bad_row_shapes(self):
        cases = [
            ("invalid-json", "{oops"),
            ("non-string-text", json.dumps({"time": {"created": T0}, "text": 42})),
            ("non-utf8-bytes", sqlite3.Binary(b"\xff\xfe{\xff}")),
        ]
        for name, data in cases:
            with self.subTest(shape=name):
                db = self.fresh_db(name=f"f12r-{name}.db")
                conn = self.open(db)
                try:
                    add_session(conn, "s-f12")
                    conn.execute(
                        "INSERT INTO session_message (id, session_id, type, seq, time_created,"
                        " time_updated, data) VALUES (?,?,?,?,?,?,?)",
                        ("m-bad", "s-f12", "user", next_seq(), T0, T0, data),
                    )
                    conn.commit()
                finally:
                    conn.close()
                out = self.outdir / f"f12r-{name}.md"
                proc = self.cli(db, "s-f12", out)
                self.assertEqual(proc.returncode, 2)
                err = proc.stderr.decode()
                self.assertIn("m-bad", err)
                self.assertNotIn("Traceback", err)
                self.assert_no_files(out)

    def test_f13_lone_surrogate_in_phrase_hit(self):
        surrogate_text = PREFLIGHT + " \ud800 tail"
        db = self.fresh_db(name="f13a.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-f13")
            add_message(conn, "s-f13", "m-sur", "user", CANARY + "\n" + surrogate_text)
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "f13a.md"
        proc = self.cli(db, "s-f13", out)
        self.assertEqual(proc.returncode, 2)
        err = proc.stderr.decode("utf-8", "replace")
        self.assertIn("m-sur", err)
        self.assertNotIn("\ufffd", err)
        self.assert_no_files(out)

    def test_f13_non_hit_surrogate_row_does_not_block(self):
        db = self.fresh_db(name="f13b.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-f13b")
            add_message(conn, "s-f13b", "m-sur", "user", CANARY + "\nunrelated \ud800 row")
            stored = add_message(conn, "s-f13b", "m-ok", "user", cbody(std_reply()))
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "f13b.md"
        proc = self.cli(db, "s-f13b", out)
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), stored.encode("utf-8"))
        self.assert_receipt_clean(out)


# --------------------------------------------------------------------------
# Guards G1-G9


class GuardTests(ExtractorTest):
    def test_g1_assistant_rows_are_never_candidates(self):
        db = self.fresh_db(name="g1.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-g1")
            asst_stored = add_message(conn, "s-g1", "m-asst", "assistant", cbody(std_reply()))
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "g1a.md"
        proc = self.cli(db, "s-g1", out)
        self.assertEqual(proc.returncode, 1)
        self.assert_no_files(out)
        # a named assistant id is refused, with or without --capture-only (pin)
        for extra in (["--message", "m-asst"], ["--message", "m-asst", "--capture-only"]):
            with self.subTest(extra=extra):
                out = self.outdir / ("g1b.md")
                proc = self.cli(db, "s-g1", out, extra=extra)
                self.assertEqual(proc.returncode, 1)
                combined = proc.stdout + proc.stderr
                self.assertIn(b"guard role", combined)
                self.assert_no_files(out)
        # alongside a real user reply the assistant row is simply invisible
        conn = self.open(db)
        try:
            user_stored = add_message(conn, "s-g1", "m-user", "user", asst_stored)
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "g1c.md"
        proc = self.cli(db, "s-g1", out)
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), user_stored.encode("utf-8"))
        receipt = json.loads(Path(str(out) + ".source.json").read_bytes().decode("utf-8"))
        self.assertEqual(receipt["message_id"], "m-user")
        self.assert_receipt_clean(out)

    def test_g2_child_and_unrelated_sessions_not_searched(self):
        db = self.fresh_db(name="g2.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-g2")
            add_session(conn, "s-child", parent="s-g2")
            add_session(conn, "s-other")
            add_message(conn, "s-child", "m-child", "user", cbody(std_reply()) + "\nchild copy")
            add_message(conn, "s-other", "m-other", "user", cbody(std_reply()) + "\nother copy")
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "g2a.md"
        proc = self.cli(db, "s-g2", out)
        self.assertEqual(proc.returncode, 1)
        self.assert_no_files(out)
        # with the real reply in scope, the child and unrelated copies stay out
        conn = self.open(db)
        try:
            real = add_message(conn, "s-g2", "m-real", "user", cbody(std_reply()))
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "g2b.md"
        proc = self.cli(db, "s-g2", out)
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), real.encode("utf-8"))
        receipt = json.loads(Path(str(out) + ".source.json").read_bytes().decode("utf-8"))
        self.assertEqual(receipt["message_id"], "m-real")
        self.assert_receipt_clean(out)

    def test_g3_message_guards_and_scope_contradiction(self):
        db = self.fresh_db(name="g3.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-g3")
            add_session(conn, "s-far")
            add_message(conn, "s-far", "m-far", "user", cbody(std_reply()))
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "g3a.md"
        proc = self.cli(db, "s-g3", out, extra=["--message", "m-far"])
        self.assertEqual(proc.returncode, 1)
        self.assertIn("guard session-scope", (proc.stdout + proc.stderr).decode("utf-8", "replace"))
        self.assert_no_files(out)
        out = self.outdir / "g3b.md"
        proc = self.cli(db, "s-g3", out, extra=["--message", "m-absent"])
        self.assertEqual(proc.returncode, 1)
        self.assertIn("guard message-not-found", (proc.stdout + proc.stderr).decode("utf-8", "replace"))
        self.assert_no_files(out)
        out = self.outdir / "g3c.md"
        proc = self.cli(db, "s-g3", out, extra=["--exclude-session", "s-g3"])
        self.assertEqual(proc.returncode, 2)
        self.assertIn("scope contradiction", proc.stderr.decode())
        self.assert_no_files(out)

    def test_g3_exclude_session_of_another_scope_is_a_noop(self):
        db, stored = self.success_db(name="g3d.db", sid="s-g3d", mid="m-ok")
        conn = self.open(db)
        try:
            add_session(conn, "s-unrelated")
            add_message(conn, "s-unrelated", "m-unrel", "user", cbody(std_reply()) + "\nunrelated")
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "g3d.md"
        proc = self.cli(db, "s-g3d", out, extra=["--exclude-session", "s-unrelated"])
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), stored.encode("utf-8"))
        self.assert_receipt_clean(out)

    def test_g4_brief_row_fails_reply_is_selected(self):
        db = self.fresh_db(name="g4.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-g4")
            brief = (
                CANARY + "\n"
                + "user note quoting " + PHRASE + "\n"
                + "```\n" + PREFLIGHT + "\n```\n"
                + "closing thought " + TERMINAL + " inline\n"
                + "further prose\n"
            )
            add_message(conn, "s-g4", "m-brief", "user", brief)
            stored = add_message(conn, "s-g4", "m-reply", "user", cbody(std_reply()))
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "g4.md"
        proc = self.cli(db, "s-g4", out)
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), stored.encode("utf-8"))
        stdout = proc.stdout.decode()
        self.assertIn("m-brief", stdout)  # listed as a failing candidate
        self.assertIn("m-reply", stdout)
        receipt = json.loads(Path(str(out) + ".source.json").read_bytes().decode("utf-8"))
        self.assertEqual(receipt["message_id"], "m-reply")
        self.assert_receipt_clean(out)

    def test_g5_ambiguity_refused_and_resolved(self):
        db = self.fresh_db(name="g5.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-g5")
            text_a = add_message(conn, "s-g5", "m-a", "user", cbody(std_reply()))
            text_b = add_message(
                conn, "s-g5", "m-b", "user",
                cbody(PREFLIGHT + "\nextra note\n" + STEP + "\n" + TERMINAL),
            )
            conn.commit()
        finally:
            conn.close()
        self.assertNotEqual(text_a, text_b)
        out = self.outdir / "g5a.md"
        proc = self.cli(db, "s-g5", out)
        self.assertEqual(proc.returncode, 1)
        stdout = proc.stdout.decode()
        self.assertIn("m-a", stdout)
        self.assertIn("m-b", stdout)
        self.assert_no_files(out)
        # byte-identical pastes are still ambiguous
        db2 = self.fresh_db(name="g5b.db")
        conn = self.open(db2)
        try:
            add_session(conn, "s-g5b")
            add_message(conn, "s-g5b", "m-d1", "user", cbody(std_reply()))
            add_message(conn, "s-g5b", "m-d2", "user", cbody(std_reply()))
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "g5b.md"
        proc = self.cli(db2, "s-g5b", out)
        self.assertEqual(proc.returncode, 1)
        stdout = proc.stdout.decode()
        self.assertIn("m-d1", stdout)
        self.assertIn("m-d2", stdout)
        self.assert_no_files(out)
        # exclusion or a named message resolves the ambiguity
        out = self.outdir / "g5c.md"
        proc = self.cli(db, "s-g5", out, extra=["--exclude-message", "m-a"])
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), text_b.encode("utf-8"))
        self.assert_receipt_clean(out)
        out = self.outdir / "g5d.md"
        proc = self.cli(db, "s-g5", out, extra=["--message", "m-b"])
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), text_b.encode("utf-8"))
        self.assert_receipt_clean(out)

    def test_g6_since_bound(self):
        db, stored = self.success_db(
            name="g6.db", sid="s-g6", mid="m-old", created_ms=T0
        )
        since_seconds = T0 // 1000 + 30
        out = self.outdir / "g6a.md"
        proc = self.cli(db, "s-g6", out, extra=["--since", str(since_seconds)])
        self.assertEqual(proc.returncode, 1)
        stdout = proc.stdout.decode()
        self.assertIn("out_of_bounds=1", stdout)
        expected_iso = datetime.fromtimestamp(since_seconds, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        self.assertIn(f"since={expected_iso}", stdout)
        self.assert_no_files(out)
        # a bound before the row selects it
        out = self.outdir / "g6b.md"
        proc = self.cli(db, "s-g6", out, extra=["--since", str(T0 // 1000 - 30)])
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), stored.encode("utf-8"))
        self.assert_receipt_clean(out)
        # unparsable bound
        out = self.outdir / "g6c.md"
        proc = self.cli(db, "s-g6", out, extra=["--since", "day before yesterday"])
        self.assertEqual(proc.returncode, 2)
        self.assertIn("unparsable --since", proc.stderr.decode())
        self.assert_no_files(out)

    def test_g7_single_defects(self):
        counts3 = [{"pattern": "^STEP-[0-9]+: ok$", "exact": 3}]
        cases = [
            ("required-missing", "no preflight here, only " + PHRASE + "\n" + STEP + "\n" + TERMINAL, std_profile(), ["required_lines[0]=fail"]),
            ("required-substring", "see " + PREFLIGHT + " below\n" + STEP + "\n" + TERMINAL, std_profile(), ["required_lines[0]=fail"]),
            ("counts-low", PREFLIGHT + "\n" + STEP + "\nSTEP-2: ok\n" + TERMINAL,
             mini_profile(counts=counts3), ["line_counts[0]=fail(observed=2 exact=3)"]),
            ("counts-high", PREFLIGHT + "\n" + STEP + "\nSTEP-2: ok\nSTEP-3: ok\nSTEP-4: ok\n" + TERMINAL,
             mini_profile(counts=counts3), ["line_counts[0]=fail(observed=4 exact=3)"]),
            ("sentinel-prose", PREFLIGHT + "\n" + STEP + "\nCOMPLETE and more prose", std_profile(), ["terminal_line=fail"]),
            ("sentinel-period", PREFLIGHT + "\n" + STEP + "\nCOMPLETE.", std_profile(), ["terminal_line=fail"]),
            ("sentinel-bold", PREFLIGHT + "\n" + STEP + "\n**COMPLETE**", std_profile(), ["terminal_line=fail"]),
            ("forbidden-whole-line", PREFLIGHT + "\n" + FORBIDDEN + "\n" + STEP + "\n" + TERMINAL, std_profile(), ["forbidden_lines[0]=fail"]),
        ]
        for name, text, profile, tokens in cases:
            with self.subTest(defect=name):
                db, _ = self.success_db(name=f"g7-{name}.db", sid="s-g7", mid="m-g7", text=cbody(text))
                out = self.outdir / f"g7-{name}.md"
                proc = self.cli(db, "s-g7", out, self.write_profile(profile, f"g7-{name}.json"))
                self.assertEqual(proc.returncode, 1, proc.stdout.decode() + proc.stderr.decode())
                stdout = proc.stdout.decode()
                for token in tokens:
                    self.assertIn(token, stdout)
                self.assert_no_files(out)
        # positives: the anchored pattern matches CRLF lines, and an inline
        # forbidden marker inside a longer line passes
        crlf_text = PREFLIGHT + "\r\n" + STEP + "\r\nSTEP-2: ok\r\nSTEP-3: ok\r\n" + TERMINAL
        db, stored = self.success_db(name="g7-crlf.db", sid="s-g7b", mid="m-g7b", text=cbody(crlf_text))
        out = self.outdir / "g7-crlf.md"
        proc = self.cli(db, "s-g7b", out, self.write_profile(mini_profile(counts=counts3), "g7crlf.json"))
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), stored.encode("utf-8"))
        self.assert_receipt_clean(out)
        inline_text = PREFLIGHT + "\nmid " + FORBIDDEN + " end\n" + STEP + "\n" + TERMINAL
        db, stored = self.success_db(name="g7-inline.db", sid="s-g7c", mid="m-g7c", text=cbody(inline_text))
        out = self.outdir / "g7-inline.md"
        proc = self.cli(db, "s-g7c", out)
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), stored.encode("utf-8"))
        self.assert_receipt_clean(out)

    def test_g8_profile_rejections(self):
        good = std_profile()
        cases = [
            ("unknown-version", {**good, "version": 2}),
            ("misspelt-key", {"version": 1, "requird_lines": [PREFLIGHT], "terminal_line": TERMINAL}),
            ("invalid-regex", {**good, "line_counts": [{"pattern": "[unclosed", "exact": 1}]}),
        ]
        db, _ = self.success_db(name="g8.db", sid="s-g8", mid="m-g8")
        for name, profile in cases:
            with self.subTest(profile=name):
                out = self.outdir / f"g8-{name}.md"
                proc = self.cli(db, "s-g8", out, self.write_profile(profile, f"g8-{name}.json"))
                self.assertEqual(proc.returncode, 2)
                self.assertIn("profile", proc.stderr.decode())
                self.assert_no_files(out)
        # not JSON at all
        bad = self.base / "g8-notjson.json"
        bad.write_bytes(b"nonsense{")
        out = self.outdir / "g8-notjson.md"
        proc = self.cli(db, "s-g8", out, bad)
        self.assertEqual(proc.returncode, 2)
        self.assert_no_files(out)

    def test_g8_phrase_only_profile_rejected(self):
        db, _ = self.success_db(name="g8b.db", sid="s-g8b", mid="m-g8b")
        out = self.outdir / "g8b.md"
        proc = self.cli(db, "s-g8b", out, self.write_profile({"version": 1}, "g8b.json"))
        self.assertEqual(proc.returncode, 2)
        self.assertIn("no check beyond the phrase", proc.stderr.decode())
        self.assert_no_files(out)

    def test_g9_report_cap_and_truncation(self):
        db = self.fresh_db(name="g9.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-g9")
            for index in range(25):
                add_message(conn, "s-g9", f"m-g9-{index:02d}", "user",
                            cbody(PREFLIGHT + f"\nfailing body {index}"))
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "g9.md"
        proc = self.cli(db, "s-g9", out)
        self.assertEqual(proc.returncode, 1)
        stdout = proc.stdout.decode()
        self.assertIn("total=25", stdout)
        self.assertIn("shown=20", stdout)
        self.assertIn("report truncated: 5 not shown", stdout)
        self.assert_no_files(out)


# --------------------------------------------------------------------------
# Capture-only and publication P1-P4


class PublicationTests(ExtractorTest):
    def test_p1_capture_only(self):
        cut_text = cbody(PREFLIGHT + "\nSTEP-1: o")  # cut off mid-line, no sentinel
        db = self.fresh_db(name="p1.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-p1")
            stored = add_message(conn, "s-p1", "m-cut", "user", cut_text)
            conn.commit()
        finally:
            conn.close()
        out = self.outdir / "p1.md"
        proc = self.cli(db, "s-p1", out, extra=["--capture-only", "--message", "m-cut"])
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out.read_bytes(), stored.encode("utf-8"))
        receipt_path = self.assert_receipt_clean(out)
        receipt = json.loads(receipt_path.read_bytes().decode("utf-8"))
        self.assertEqual(receipt["mode"], "capture-only")
        self.assertIn("terminal_line", receipt["failed_checks"])
        self.assertIn("line_counts[0]", receipt["failed_checks"])
        self.assertNotIn(b"accept", receipt_path.read_bytes().lower())
        # without --message: exit 2
        out2 = self.outdir / "p1b.md"
        proc = self.cli(db, "s-p1", out2, extra=["--capture-only"])
        self.assertEqual(proc.returncode, 2)
        self.assert_no_files(out2)
        # a passing row captured on purpose is still labelled capture-only
        db, pass_stored = self.success_db(name="p1c.db", sid="s-p1c", mid="m-ok")
        out3 = self.outdir / "p1c.md"
        proc = self.cli(db, "s-p1c", out3, extra=["--capture-only", "--message", "m-ok"])
        self.assertEqual(proc.returncode, 0, proc.stderr.decode())
        self.assertEqual(out3.read_bytes(), pass_stored.encode("utf-8"))
        receipt = json.loads(Path(str(out3) + ".source.json").read_bytes().decode("utf-8"))
        self.assertEqual(receipt["mode"], "capture-only")
        self.assertEqual(receipt["failed_checks"], [])
        self.assert_receipt_clean(out3)

    def test_p2_rerun_is_noop(self):
        db, stored = self.success_db(name="p2.db", sid="s-p2", mid="m-p2")
        out = self.outdir / "p2.md"
        proc = self.cli(db, "s-p2", out)
        self.assertEqual(proc.returncode, 0)
        first_out = out.read_bytes()
        receipt_path = Path(str(out) + ".source.json")
        first_receipt = receipt_path.read_bytes()
        before = (os.stat(str(out)).st_mtime_ns, os.stat(str(receipt_path)).st_mtime_ns,
                  os.stat(str(out)).st_ino)
        proc = self.cli(db, "s-p2", out)
        self.assertEqual(proc.returncode, 0)
        self.assertIn(b"result=noop", proc.stdout)
        self.assertEqual(out.read_bytes(), first_out)
        self.assertEqual(receipt_path.read_bytes(), first_receipt)
        after = (os.stat(str(out)).st_mtime_ns, os.stat(str(receipt_path)).st_mtime_ns,
                 os.stat(str(out)).st_ino)
        self.assertEqual(before, after, "a no-op must not touch the published files")

    def test_p3_publication_conflicts(self):
        db, stored = self.success_db(name="p3.db", sid="s-p3", mid="m-p3")
        out = self.outdir / "p3.md"
        receipt_path = Path(str(out) + ".source.json")

        def snapshot():
            return (out.read_bytes(), receipt_path.read_bytes(),
                    os.stat(str(out)).st_mtime_ns, os.stat(str(receipt_path)).st_mtime_ns)

        self.assertEqual(self.cli(db, "s-p3", out).returncode, 0)
        baseline = snapshot()
        receipt = json.loads(baseline[1].decode("utf-8"))

        # a) existing output with different bytes
        out.write_bytes(stored.encode("utf-8") + b"\ndrift")
        proc = self.cli(db, "s-p3", out)
        self.assertEqual(proc.returncode, 2)
        self.assertEqual(snapshot()[0], out.read_bytes())
        self.assertEqual(out.read_bytes(), stored.encode("utf-8") + b"\ndrift")
        self.assertEqual(receipt_path.read_bytes(), baseline[1])
        # restore: this modified out, so rebuild the baseline pair from scratch
        os.unlink(str(out))
        os.unlink(str(receipt_path))
        self.assertEqual(self.cli(db, "s-p3", out).returncode, 0)

        # b) receipt naming a different message id
        mutated = dict(receipt, message_id="m-other")
        receipt_path.write_bytes((json.dumps(mutated, indent=2, sort_keys=True) + "\n").encode("utf-8"))
        proc = self.cli(db, "s-p3", out)
        self.assertEqual(proc.returncode, 2)
        self.assertEqual(snapshot()[1], receipt_path.read_bytes())

        # c) receipt with a different profile hash
        mutated = dict(receipt, profile_sha256="0" * 64)
        receipt_path.write_bytes((json.dumps(mutated, indent=2, sort_keys=True) + "\n").encode("utf-8"))
        proc = self.cli(db, "s-p3", out)
        self.assertEqual(proc.returncode, 2)

        # d) receipt with a different mode
        mutated = dict(receipt, mode="capture-only")
        receipt_path.write_bytes((json.dumps(mutated, indent=2, sort_keys=True) + "\n").encode("utf-8"))
        proc = self.cli(db, "s-p3", out)
        self.assertEqual(proc.returncode, 2)

        # e) output without its receipt
        os.unlink(str(receipt_path))
        before_out = out.read_bytes()
        proc = self.cli(db, "s-p3", out)
        self.assertEqual(proc.returncode, 2)
        self.assertEqual(out.read_bytes(), before_out)
        self.assertFalse(receipt_path.exists())

        # f) receipt without its output
        receipt_path.write_bytes(baseline[1])
        os.unlink(str(out))
        before_receipt = receipt_path.read_bytes()
        proc = self.cli(db, "s-p3", out)
        self.assertEqual(proc.returncode, 2)
        self.assertEqual(receipt_path.read_bytes(), before_receipt)
        self.assertFalse(out.exists())

    def test_p4_output_dir_missing_or_unwritable(self):
        db, _ = self.success_db(name="p4.db", sid="s-p4", mid="m-p4")
        out = self.base / "nope" / "p4.md"
        proc = self.cli(db, "s-p4", out)
        self.assertEqual(proc.returncode, 2)
        self.assertFalse((self.base / "nope").exists())
        if os.name == "posix":
            locked = self.base / "locked"
            locked.mkdir()
            os.chmod(str(locked), 0o500)
            try:
                out = locked / "p4.md"
                proc = self.cli(db, "s-p4", out)
                self.assertEqual(proc.returncode, 2)
                self.assertEqual(self.out_list(locked), [])
            finally:
                os.chmod(str(locked), 0o700)

    def test_p4_listing_unchanged_after_failures(self):
        db = self.fresh_db(name="p4b.db")
        conn = self.open(db)
        try:
            add_session(conn, "s-p4b")
            add_message(conn, "s-p4b", "m-a", "user", cbody(std_reply()))
            add_message(conn, "s-p4b", "m-b", "user",
                        cbody(PREFLIGHT + "\nextra note\n" + STEP + "\n" + TERMINAL))
            conn.commit()
        finally:
            conn.close()
        before = self.out_list(self.outdir)
        out = self.outdir / "p4b.md"
        # exit 1: two passing candidates
        proc = self.cli(db, "s-p4b", out)
        self.assertEqual(proc.returncode, 1)
        self.assertEqual(self.out_list(self.outdir), before)
        # exit 2: unknown session
        proc = self.cli(db, "ghost", out)
        self.assertEqual(proc.returncode, 2)
        self.assertEqual(self.out_list(self.outdir), before)
        # exit 2: bad profile
        proc = self.cli(db, "s-p4b", out, self.write_profile({"version": 1}, "p4b.json"))
        self.assertEqual(proc.returncode, 2)
        self.assertEqual(self.out_list(self.outdir), before)


# --------------------------------------------------------------------------
# Database safety S1-S3


class DatabaseSafetyTests(ExtractorTest):
    def test_s1_wal_reads(self):
        for variant in ("writer-open", "copied-trio"):
            with self.subTest(variant=variant):
                workdir = self.base / f"s1-{variant}"
                workdir.mkdir()
                db = workdir / "f.db"
                build_fixture(str(db))
                conn = sqlite3.connect(str(db))
                try:
                    self.assertEqual(conn.execute("PRAGMA journal_mode=wal").fetchone()[0], "wal")
                    conn.execute("PRAGMA wal_autocheckpoint=0")
                    add_session(conn, "s-s1")
                    stored = add_message(conn, "s-s1", "m-wal", "user", cbody(std_reply()))
                    conn.commit()
                    # the candidate row now lives only in the -wal sidecar
                    main_before = hashlib.sha256(db.read_bytes()).hexdigest()
                    wal = Path(str(db) + "-wal")
                    wal_before = os.path.getsize(str(wal))
                    target = db
                    if variant == "copied-trio":
                        copydir = workdir / "copy"
                        copydir.mkdir()
                        for suffix in ("", "-wal", "-shm"):
                            shutil.copy2(str(db) + suffix, str(copydir / ("f.db" + suffix)))
                        target = copydir / "f.db"
                        main_before = hashlib.sha256(target.read_bytes()).hexdigest()
                        wal_before = os.path.getsize(str(copydir / "f.db-wal"))
                    out = workdir / "s1.md"
                    proc = self.cli(target, "s-s1", out)
                    self.assertEqual(proc.returncode, 0, proc.stderr.decode())
                    self.assertEqual(out.read_bytes(), stored.encode("utf-8"))
                    self.assert_receipt_clean(out)
                    main_after = hashlib.sha256(target.read_bytes()).hexdigest()
                    wal_after = os.path.getsize(str(target) + "-wal")
                    self.assertEqual(main_before, main_after, "the main fixture file must stay untouched")
                    self.assertEqual(wal_before, wal_after, "the -wal must not be checkpointed away")
                    ro = sqlite3.connect("file:" + str(target) + "?mode=ro", uri=True)
                    try:
                        self.assertEqual(ro.execute("PRAGMA journal_mode").fetchone()[0], "wal")
                    finally:
                        ro.close()
                finally:
                    conn.close()

    def test_s2_exclusive_lock_times_out_busy(self):
        db = self.fresh_db(name="s2.db")
        writer = sqlite3.connect(str(db))
        try:
            writer.execute("PRAGMA locking_mode=EXCLUSIVE")
            writer.execute("BEGIN EXCLUSIVE")
            writer.execute("SELECT count(*) FROM session_message").fetchone()
            out = self.outdir / "s2.md"
            started = datetime.now()
            proc = self.cli(db, "s-s2", out)
            elapsed = (datetime.now() - started).total_seconds()
            self.assertEqual(proc.returncode, 2)
            self.assertIn("database busy", proc.stderr.decode())
            self.assertLess(elapsed, 60, "the busy timeout must be bounded; no retry loop")
            self.assert_no_files(out)
        finally:
            writer.rollback()
            writer.close()

    def test_s3_source_scan(self):
        src = SCRIPT.read_text(encoding="utf-8")
        self.assertEqual(src.count("sqlite3.connect"), 1, "exactly one connect site")
        self.assertIn('"file:"', src)
        self.assertIn("mode=ro", src)
        self.assertIn("BEGIN DEFERRED", src)
        self.assertIn("timeout=", src)
        for token in ("immutable", "wal_checkpoint", "journal_mode=", "VACUUM", "ATTACH"):
            self.assertNotIn(token, src, token)
            self.assertNotIn(token, src.lower(), token.lower())
        self.assertNotIn("executescript", src)
        write_rx = re.compile(
            r"(?i)\b(INSERT\s+INTO|REPLACE\s+INTO|UPDATE\s+\S+\s+SET|DELETE\s+FROM|"
            r"CREATE\s+(?:TABLE|UNIQUE|INDEX|VIEW|TRIGGER)|DROP\s+(?:TABLE|INDEX|VIEW|TRIGGER)|"
            r"ALTER\s+TABLE|ATTACH\s+(?:DATABASE|))\b"
        )
        self.assertIsNone(write_rx.search(src), "no write statements in extract-reply.py")


if __name__ == "__main__":
    unittest.main()
