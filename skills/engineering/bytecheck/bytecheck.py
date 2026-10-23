#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
bytecheck - byte-exact verification of what an agent changed.
An agent's report is a claim. The filesystem is the evidence.
    python3 bytecheck.py snapshot . -o .bytecheck/before.json --store
    ... agent works ...
    python3 bytecheck.py verify .bytecheck/before.json --json \\
        --allow 'src/payments/**' --expect 'src/payments/refund.py' --deny '**/*.lock'
Single file. Standard library only. Python 3.8+.
Exit code first (0 pass, 1 fail, 2 error), JSON second, prose third.
stdout carries results only; stderr carries diagnostics only.
Never writes to the tree it checks.
"""
import argparse
import difflib
import hashlib
import json
import os
import re
import stat
import sys
import unicodedata
from datetime import datetime, timezone
__version__ = "0.1.0"
# ----------------------------------------------------------------------------
# constants
# ----------------------------------------------------------------------------
TOOL_NAME = "bytecheck"
MANIFEST_FORMAT = 1
RESULT_SCHEMA = 1
ALGO = "sha256"
READ_CHUNK = 1 << 20
BINARY_SNIFF = 8192
HUNK_MAX_BYTES = 8 << 20
SCAN_MAX_BYTES = 64 << 20
SHRUNK_RATIO = 0.5
SHRUNK_MIN_BEFORE = 1024
INDENT_MIN_LINES = 3
SHORT_HASH = 12
DEFAULT_EXCLUDES = (".git/", ".bytecheck/")
DEFAULT_MANIFEST = ".bytecheck/before.json"
EXIT_PASS = 0
EXIT_FAIL = 1
EXIT_ERROR = 2
KIND_LETTER = {"added": "A", "deleted": "D", "modified": "M", "renamed": "R", "attr": "X"}
# slug -> (severity, kind). error fails; warn fails under --strict; info never fails.
RULES = {
    "conflict-marker": ("error", "absolute"),
    "placeholder": ("error", "absolute"),
    "nul-in-text": ("error", "absolute"),
    "bidi-control": ("error", "absolute"),
    "bom-changed": ("error", "delta"),
    "eol-changed": ("error", "delta"),
    "zero-width": ("warn", "absolute"),
    "smart-quote": ("warn", "absolute"),
    "nbsp": ("warn", "absolute"),
    "mixed-eol": ("warn", "absolute"),
    "shrunk": ("warn", "delta"),
    "trailing-newline-lost": ("warn", "delta"),
    "indent-flipped": ("warn", "delta"),
    "bom": ("info", "absolute"),
    "no-trailing-newline": ("info", "absolute"),
    "invalid-utf8": ("info", "absolute"),
}
CODE_EXTS = frozenset("""
py pyi pyx js mjs cjs jsx ts tsx go rs java kt kts scala c h cc cpp cxx hpp hh cs rb php
swift m mm lua pl pm r jl dart vue svelte sh bash zsh fish ps1 psm1 bat cmd sql yaml yml
toml json json5 jsonc ini cfg conf env html htm css scss sass less xml xsl svg graphql gql
proto tf tfvars hcl mk cmake gradle groovy nix zig ex exs erl hs elm clj cljs cljc ml mli
fs fsx vb asm s
""".split())
PROSE_EXTS = frozenset("md markdown mdx txt text rst adoc asciidoc tex org rtf".split())
CODE_NAMES = frozenset("""
makefile dockerfile jenkinsfile vagrantfile gemfile rakefile procfile brewfile justfile
cmakelists.txt
""".split())
class BytecheckError(Exception):
    """Usage or environment error. Always exit 2."""
# ----------------------------------------------------------------------------
# output helpers
# ----------------------------------------------------------------------------
def to_bytes(text):
    try:
        return text.encode("utf-8", "surrogateescape")
    except UnicodeEncodeError:
        return text.encode("utf-8", "backslashreplace")
def emit(text):
    sys.stdout.buffer.write(to_bytes(text))
    sys.stdout.buffer.flush()
def diag(text):
    sys.stderr.buffer.write(to_bytes(text + "\n"))
    sys.stderr.buffer.flush()
def dumps(obj):
    return json.dumps(obj, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
def utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def short(digest):
    return digest[:SHORT_HASH] if digest else "-"
def plural(n, word):
    return "%d %s%s" % (n, word, "" if n == 1 else "s")
def read_file(path):
    with open(path, "rb") as f:
        return f.read()
def write_file(path, data):
    parent = os.path.dirname(os.path.abspath(path))
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)
# ----------------------------------------------------------------------------
# paths and globs
# ----------------------------------------------------------------------------
def to_posix(path):
    if os.sep != "/":
        path = path.replace(os.sep, "/")
    if os.altsep and os.altsep != "/":
        path = path.replace(os.altsep, "/")
    return path
def norm_pattern(pattern):
    p = to_posix(pattern.strip())
    while p.startswith("./"):
        p = p[2:]
    return p.lstrip("/")
def _glob_body(pat):
    out = []
    i, n = 0, len(pat)
    while i < n:
        c = pat[i]
        if c == "*":
            if pat.startswith("**", i):
                i += 2
                if i < n and pat[i] == "/":
                    out.append("(?:.*/)?")
                    i += 1
                else:
                    out.append(".*")
            else:
                out.append("[^/]*")
                i += 1
        elif c == "?":
            out.append("[^/]")
            i += 1
        elif c == "[":
            j = pat.find("]", i + 1)
            if j < 0:
                out.append(re.escape(c))
                i += 1
            else:
                cls = pat[i + 1:j]
                if cls.startswith("!"):
                    cls = "^" + cls[1:]
                out.append("[" + cls.replace("\\", "\\\\") + "]")
                i = j + 1
        else:
            out.append(re.escape(c))
            i += 1
    return "".join(out)
class Glob(object):
    """One dialect: whole-path match, * stays in a segment, ** crosses, ? is one char,
    trailing / means this directory and everything below."""
    __slots__ = ("pattern", "_dir_re", "_file_re")
    def __init__(self, pattern):
        self.pattern = pattern
        pat = norm_pattern(pattern)
        dir_only = pat.endswith("/")
        base = _glob_body(pat.rstrip("/") if dir_only else pat)
        self._dir_re = re.compile("^" + base + "$")
        self._file_re = re.compile("^" + base + ("/.*" if dir_only else "") + "$")
    def matches(self, path):
        return self._file_re.match(path) is not None
    def matches_dir(self, path):
        return self._dir_re.match(path) is not None
_GLOB_CACHE = {}
def compile_glob(pattern):
    g = _GLOB_CACHE.get(pattern)
    if g is None:
        g = _GLOB_CACHE[pattern] = Glob(pattern)
    return g
def first_match(patterns, path):
    for p in patterns:
        if compile_glob(p).matches(path):
            return p
    return None
class Excluder(object):
    def __init__(self, patterns):
        self.patterns = []
        for p in patterns:
            if p not in self.patterns:
                self.patterns.append(p)
        self._globs = [compile_glob(p) for p in self.patterns]
    def dir_excluded(self, rel):
        return any(g.matches_dir(rel) for g in self._globs)
    def excluded(self, rel):
        if any(g.matches(rel) for g in self._globs):
            return True
        parts = rel.split("/")
        for i in range(1, len(parts)):
            if self.dir_excluded("/".join(parts[:i])):
                return True
        return False
# ----------------------------------------------------------------------------
# walker
# ----------------------------------------------------------------------------
def is_exec(st):
    return os.name == "posix" and bool(st.st_mode & 0o111)
def walk(root, excluder, skip=(), errors=None):
    """Yield (relpath, kind, abspath, stat) for every non-directory entry under root.
    Never follows symlinks. Entries sorted bytewise. Paths are POSIX, root-relative."""
    skip_real = set()
    for p in skip:
        if p:
            skip_real.add(os.path.realpath(p))
    def record(rel, exc):
        if errors is not None:
            errors.append({"path": rel, "error": str(exc)})
    def visit(dir_abs, rel_prefix):
        try:
            with os.scandir(dir_abs) as it:
                entries = list(it)
        except OSError as exc:
            record(rel_prefix or ".", exc)
            return
        entries.sort(key=lambda e: os.fsencode(e.name))
        for entry in entries:
            name = to_posix(entry.name)
            rel = rel_prefix + "/" + name if rel_prefix else name
            if skip_real and os.path.realpath(entry.path) in skip_real:
                continue
            try:
                st = entry.stat(follow_symlinks=False)
            except OSError as exc:
                record(rel, exc)
                continue
            mode = st.st_mode
            if stat.S_ISDIR(mode):
                if not excluder.dir_excluded(rel):
                    for item in visit(entry.path, rel):
                        yield item
                continue
            if excluder.excluded(rel):
                continue
            if stat.S_ISLNK(mode):
                kind = "symlink"
            elif stat.S_ISREG(mode):
                kind = "file"
            else:
                kind = "other"
            yield rel, kind, entry.path, st
    for item in visit(root, ""):
        yield item
# ----------------------------------------------------------------------------
# hasher
# ----------------------------------------------------------------------------
def hash_stream(fobj, sink=None):
    h = hashlib.sha256()
    size = 0
    while True:
        chunk = fobj.read(READ_CHUNK)
        if not chunk:
            break
        h.update(chunk)
        size += len(chunk)
        if sink is not None:
            sink.write(chunk)
    return h.hexdigest(), size
def hash_bytes(data):
    return hashlib.sha256(data).hexdigest()
def hash_file(path, store=None):
    if store is None:
        with open(path, "rb") as f:
            return hash_stream(f)
    tmp = os.path.join(store, ".tmp-%d" % os.getpid())
    try:
        with open(path, "rb") as f, open(tmp, "wb") as out:
            digest, size = hash_stream(f, out)
        final = os.path.join(store, digest)
        if os.path.exists(final):
            os.remove(tmp)
        else:
            os.replace(tmp, final)
    except BaseException:
        try:
            os.remove(tmp)
        except OSError:
            pass
        raise
    return digest, size
def entry_for(kind, abs_path, st, store=None):
    if kind == "file":
        digest, size = hash_file(abs_path, store)
        return {"type": "file", "size": size, "sha256": digest, "exec": is_exec(st)}
    if kind == "symlink":
        return {"type": "symlink", "target": os.readlink(abs_path)}
    return {"type": "other"}
def scan_tree(root, excluder, skip=(), store=None, errors=None):
    files = {}
    for rel, kind, abs_path, st in walk(root, excluder, skip, errors):
        try:
            files[rel] = entry_for(kind, abs_path, st, store)
        except OSError as exc:
            if errors is not None:
                errors.append({"path": rel, "error": str(exc)})
    return files
def entry_payload(entry):
    t = entry["type"]
    if t == "file":
        return entry.get("sha256", "")
    if t == "symlink":
        return entry.get("target", "")
    return ""
def tree_hash(files):
    """sha256 over, for each path in code-point order: type NUL path NUL payload NUL exec LF."""
    h = hashlib.sha256()
    for path in sorted(files):
        e = files[path]
        line = "%s\0%s\0%s\0%s\n" % (e["type"], path, entry_payload(e), "x" if e.get("exec") else "-")
        h.update(to_bytes(line))
    return h.hexdigest()
# ----------------------------------------------------------------------------
# manifest I/O
# ----------------------------------------------------------------------------
def build_manifest(root_label, files, excludes, store_rel):
    manifest = {
        "format": MANIFEST_FORMAT,
        "tool_version": __version__,
        "created": utc_now(),
        "algo": ALGO,
        "root": root_label,
        "excludes": list(excludes),
        "tree_hash": tree_hash(files),
        "files": files,
    }
    if store_rel is not None:
        manifest["store"] = store_rel
    return manifest
def load_manifest(path):
    try:
        raw = sys.stdin.buffer.read() if path == "-" else read_file(path)
    except OSError as exc:
        raise BytecheckError("cannot read manifest %s: %s" % (path, exc))
    try:
        data = json.loads(raw.decode("utf-8", "surrogateescape"))
    except ValueError as exc:
        raise BytecheckError("manifest %s is not valid JSON: %s" % (path, exc))
    if not isinstance(data, dict):
        raise BytecheckError("manifest %s: expected a JSON object" % path)
    fmt = data.get("format")
    if not isinstance(fmt, int):
        raise BytecheckError("manifest %s: missing or invalid 'format'" % path)
    if fmt > MANIFEST_FORMAT:
        raise BytecheckError("manifest format %d is newer than this tool supports (%d); upgrade bytecheck"
                             % (fmt, MANIFEST_FORMAT))
    if data.get("algo") != ALGO:
        raise BytecheckError("manifest %s: unsupported algo %r" % (path, data.get("algo")))
    files = data.get("files")
    if not isinstance(files, dict):
        raise BytecheckError("manifest %s: 'files' must be an object" % path)
    for p, e in files.items():
        if not isinstance(e, dict) or e.get("type") not in ("file", "symlink", "other"):
            raise BytecheckError("manifest %s: bad entry for %r" % (path, p))
        if e["type"] == "file" and not isinstance(e.get("sha256"), str):
            raise BytecheckError("manifest %s: entry %r lacks sha256" % (path, p))
    if not isinstance(data.get("tree_hash"), str):
        raise BytecheckError("manifest %s: missing tree_hash" % path)
    if not isinstance(data.get("excludes", []), list):
        raise BytecheckError("manifest %s: 'excludes' must be a list" % path)
    return data
# ----------------------------------------------------------------------------
# text classifiers
# ----------------------------------------------------------------------------
BOM = b"\xef\xbb\xbf"
def has_bom(data):
    return data.startswith(BOM)
def is_binary(data):
    return b"\0" in data[:BINARY_SNIFF]
def eol_style(data):
    crlf = data.count(b"\r\n")
    lf = data.count(b"\n") - crlf
    cr = data.count(b"\r") - crlf
    present = [name for name, n in (("lf", lf), ("crlf", crlf), ("cr", cr)) if n]
    if not present:
        return "none"
    return present[0] if len(present) == 1 else "mixed"
def normalize_eol(data):
    return data.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
def whitespace_only(a, b):
    return re.sub(rb"\s+", b"", a) == re.sub(rb"\s+", b"", b)
def eol_only(a, b):
    return normalize_eol(a) == normalize_eol(b)
def indent_style(data):
    tabs = spaces = 0
    for line in data.splitlines():
        if line.startswith(b"\t"):
            tabs += 1
        elif line.startswith(b" "):
            spaces += 1
    if tabs == 0 and spaces == 0:
        return None, 0
    return ("tab", tabs) if tabs > spaces else ("space", spaces)
def line_of_offset(data, offset):
    return data.count(b"\n", 0, offset) + 1
def file_class(path):
    name = path.rsplit("/", 1)[-1].lower()
    if name in CODE_NAMES:
        return "code"
    if "." in name:
        ext = name.rsplit(".", 1)[-1]
        if ext in CODE_EXTS:
            return "code"
        if ext in PROSE_EXTS:
            return "prose"
        if name.startswith(".") and name.count(".") == 1:
            return "code"
    return "other"
# ----------------------------------------------------------------------------
# differ
# ----------------------------------------------------------------------------
def compute_hunks(before, after):
    """Return (hunks, added, removed, note). Line numbers are 1-based inclusive, old-file
    numbering for old_*; a pure insertion after old line k has old_start = k+1, old_end = k."""
    a = before.splitlines(True)
    b = after.splitlines(True)
    na, nb = len(a), len(b)
    pre = 0
    lim = min(na, nb)
    while pre < lim and a[pre] == b[pre]:
        pre += 1
    suf = 0
    lim = min(na, nb) - pre
    while suf < lim and a[na - 1 - suf] == b[nb - 1 - suf]:
        suf += 1
    mid_a = a[pre:na - suf]
    mid_b = b[pre:nb - suf]
    if not mid_a and not mid_b:
        return [], 0, 0, None
    if len(before) > HUNK_MAX_BYTES or len(after) > HUNK_MAX_BYTES:
        hunk = {"old_start": pre + 1, "old_end": na - suf, "new_start": pre + 1, "new_end": nb - suf,
                "removed": len(mid_a), "added": len(mid_b)}
        return [hunk], len(mid_b), len(mid_a), "file larger than %d bytes; single whole-change hunk" % HUNK_MAX_BYTES
    matcher = difflib.SequenceMatcher(None, mid_a, mid_b, autojunk=False)
    hunks = []
    added = removed = 0
    for tag, a0, a1, b0, b1 in matcher.get_opcodes():
        if tag == "equal":
            continue
        hunks.append({"old_start": pre + a0 + 1, "old_end": pre + a1,
                      "new_start": pre + b0 + 1, "new_end": pre + b1,
                      "removed": a1 - a0, "added": b1 - b0})
        added += b1 - b0
        removed += a1 - a0
    return hunks, added, removed, None
def hunk_within(hunk, ranges):
    if hunk["old_end"] < hunk["old_start"]:
        k = hunk["old_end"]
        return any(s <= k <= e for s, e in ranges)
    return any(s <= hunk["old_start"] and hunk["old_end"] <= e for s, e in ranges)
def format_hunk(h):
    if h["old_end"] < h["old_start"]:
        old = "after %d" % h["old_end"]
    elif h["old_start"] == h["old_end"]:
        old = "%d" % h["old_start"]
    else:
        old = "%d-%d" % (h["old_start"], h["old_end"])
    return "old %s (+%d -%d)" % (old, h["added"], h["removed"])
RANGE_RE = re.compile(r"^(\d+)(?:-(\d+))?$")
def parse_ranges(spec, flag="--within"):
    out = []
    for part in spec.split(","):
        m = RANGE_RE.match(part.strip())
        if not m:
            raise BytecheckError("%s: bad range %r in %r (want N or N-M, 1-based)" % (flag, part, spec))
        s = int(m.group(1))
        e = int(m.group(2)) if m.group(2) else s
        if s < 1 or e < s:
            raise BytecheckError("%s: invalid range %r in %r" % (flag, part, spec))
        out.append((s, e))
    if not out:
        raise BytecheckError("%s: empty ranges in %r" % (flag, spec))
    return out
def parse_within(spec):
    path, sep, ranges = spec.rpartition(":")
    if not sep or not path or not ranges:
        raise BytecheckError("--within expects PATH:RANGES, got %r" % spec)
    return norm_pattern(path), parse_ranges(ranges)
# ----------------------------------------------------------------------------
# rule engine
# ----------------------------------------------------------------------------
COMMENT_LEADER_RE = re.compile(
    r"^\s*(?:#+|//+|/\*+|\*+|--+|;+|%+|<!--|'''|\"\"\"|(?i:rem)\b)\s*(.*?)\s*(?:\*/|-->)?\s*$")
ELLIPSIS_RE = re.compile(r"^(?:\.{3,}|\u2026)$")
ELISION_RE = re.compile(
    r"^[\s.\u2026(\[-]*(?:"
    r"rest of (?:the |this |your )?(?:file|function|method|class|module|code|implementation|logic|component|handler|tests?)\b"
    r"|(?:existing|original|previous|unchanged|remaining) (?:code|implementation|logic|content|imports|methods|functions|tests?)\b"
    r"|(?:same|unchanged) as (?:before|above|original|previous)\b"
    r"|(?:code|implementation|logic) goes here\b"
    r"|your (?:code|implementation|logic) here\b"
    r"|(?:rest|remainder|everything else) (?:remains?|is|stays) (?:the same|unchanged)\b"
    r"|continues? (?:as before|unchanged)\b"
    r")", re.I)
BREVITY_RE = re.compile(
    r"\bfor brevity\b"
    r"|\b(?:omitted|elided|truncated|snipped) (?:here|for|above|below)\b"
    r"|(?:\.{3}|\u2026)\s*\(?\s*(?:omitted|elided|truncated|snipped)\b", re.I)
BRACKET_RE = re.compile(
    r"\[\s*(?:\.{3}|\u2026|truncated|snip(?:ped)?|omitted|elided|unchanged|continues?"
    r"|rest of [^\]]{0,60}|remaining [^\]]{0,60})\s*\]"
    r"|<\s*rest of [^>]{0,60}>"
    r"|<\s*(?:snip|truncated|omitted)\s*>", re.I)
# (rule, regex, class restriction or None)
CHAR_RULES = (
    ("bidi-control", re.compile("[\u202a-\u202e\u2066-\u2069]"), None),
    ("zero-width", re.compile("[\u200b\u2060\ufeff]"), None),
    ("zero-width", re.compile("[\u200c\u200d]"), "code"),
    ("smart-quote", re.compile("[\u2018\u2019\u201c\u201d]"), "code"),
    ("nbsp", re.compile("\u00a0"), "code"),
)
def make_finding(path, rule, line, message):
    return {"path": path, "rule": rule, "severity": RULES[rule][0], "line": line, "message": message}
def placeholder_in(line, cls):
    if BRACKET_RE.search(line):
        return "bracketed elision token"
    if cls != "code":
        return None
    m = COMMENT_LEADER_RE.match(line)
    if not m:
        return None
    body = m.group(1)
    if ELLIPSIS_RE.match(body):
        return "ellipsis-only comment"
    if ELISION_RE.match(body) or BREVITY_RE.search(body):
        return "elision phrase"
    return None
def scan_content(path, data, disabled):
    """Absolute rules. Returns (findings, note)."""
    findings = []
    cls = file_class(path)
    def add(rule, line, message):
        if rule not in disabled:
            findings.append(make_finding(path, rule, line, message))
    if len(data) > SCAN_MAX_BYTES:
        return findings, "content rules skipped: file larger than %d bytes" % SCAN_MAX_BYTES
    if not data:
        return findings, None
    nul = data.find(b"\0")
    if nul >= 0:
        if cls == "other" and nul < BINARY_SNIFF:
            return findings, "binary"
        add("nul-in-text", line_of_offset(data, nul), "NUL byte at offset %d in a text file" % nul)
        return findings, None
    if has_bom(data):
        add("bom", 1, "UTF-8 byte order mark")
    if eol_style(data) == "mixed":
        add("mixed-eol", None, "mixed line endings")
    if not data.endswith((b"\n", b"\r")):
        add("no-trailing-newline", None, "no newline at end of file")
    try:
        data.decode("utf-8")
    except UnicodeDecodeError as exc:
        add("invalid-utf8", line_of_offset(data, exc.start), "invalid UTF-8 at byte offset %d" % exc.start)
    char_hits = {}
    conflict_open = False
    for lineno, raw in enumerate(data.splitlines(True), 1):
        line = raw.decode("utf-8", "replace").rstrip("\r\n")
        if lineno == 1 and line.startswith("\ufeff"):
            line = line[1:]
        if line.startswith("<<<<<<<") and (len(line) == 7 or line[7] == " "):
            conflict_open = True
            add("conflict-marker", lineno, line[:60])
        elif line.startswith(">>>>>>>") and (len(line) == 7 or line[7] == " "):
            add("conflict-marker", lineno, line[:60])
        elif conflict_open and (line == "=======" or line.startswith("|||||||")):
            add("conflict-marker", lineno, line[:60])
        reason = placeholder_in(line, cls)
        if reason:
            add("placeholder", lineno, "%s: %s" % (reason, line.strip()[:80]))
        for rule, rx, only in CHAR_RULES:
            if only and cls != only:
                continue
            m = rx.search(line)
            if m:
                hit = char_hits.get(rule)
                if hit is None:
                    char_hits[rule] = [1, lineno, m.group(0), m.start() + 1]
                else:
                    hit[0] += 1
    for rule, (count, lineno, ch, col) in char_hits.items():
        name = unicodedata.name(ch, "unnamed character")
        more = "" if count == 1 else "; %d lines affected" % count
        add(rule, lineno, "%s (U+%04X) at column %d%s" % (name, ord(ch), col, more))
    return findings, None
def scan_delta(path, before, after, disabled):
    """Delta rules. Both sides required."""
    findings = []
    def add(rule, line, message):
        if rule not in disabled:
            findings.append(make_finding(path, rule, line, message))
    lb, la = len(before), len(after)
    if lb >= SHRUNK_MIN_BEFORE and la < lb * SHRUNK_RATIO:
        add("shrunk", None, "shrank from %d to %d bytes (%d%% smaller)" % (lb, la, round(100 - 100.0 * la / lb)))
    if is_binary(before) or is_binary(after):
        return findings
    if has_bom(before) != has_bom(after):
        add("bom-changed", 1, "BOM added" if has_bom(after) else "BOM removed")
    eb, ea = eol_style(before), eol_style(after)
    if eb in ("lf", "crlf", "cr") and ea not in ("none", eb):
        add("eol-changed", None, "line endings changed from %s to %s" % (eb.upper(), ea.upper()))
    if before.endswith((b"\n", b"\r")) and after and not after.endswith((b"\n", b"\r")):
        add("trailing-newline-lost", None, "trailing newline removed")
    ib, nb_ = indent_style(before)
    ia, na_ = indent_style(after)
    if ib and ia and ib != ia and nb_ >= INDENT_MIN_LINES and na_ >= INDENT_MIN_LINES:
        add("indent-flipped", None, "indentation changed from %ss to %ss" % (ib, ia))
    return findings
def count_findings(findings):
    counts = {"error": 0, "warn": 0, "info": 0}
    for f in findings:
        counts[f["severity"]] += 1
    return counts
def failing_findings(findings, strict):
    return [f for f in findings if f["severity"] == "error" or (strict and f["severity"] == "warn")]
def parse_disabled(slugs):
    bad = [s for s in slugs if s not in RULES]
    if bad:
        raise BytecheckError("unknown rule(s): %s (known: %s)" % (", ".join(bad), ", ".join(sorted(RULES))))
    return set(slugs)
def finding_line(f):
    where = f["path"] if f["line"] is None else "%s:%d" % (f["path"], f["line"])
    return "! %s %s %s" % (where, f["rule"], f["message"])
# ----------------------------------------------------------------------------
# policy
# ----------------------------------------------------------------------------
class Policy(object):
    LIST_KEYS = ("allow", "deny", "expect", "allow_delete", "within", "disable", "exclude")
    def __init__(self):
        for key in self.LIST_KEYS:
            setattr(self, key, [])
        self.strict = False
        self.within_ranges = {}
        self.disabled = set()
    def load_file(self, path):
        try:
            data = json.loads(read_file(path).decode("utf-8"))
        except OSError as exc:
            raise BytecheckError("cannot read policy %s: %s" % (path, exc))
        except (ValueError, UnicodeDecodeError) as exc:
            raise BytecheckError("policy %s is not valid JSON: %s" % (path, exc))
        if not isinstance(data, dict):
            raise BytecheckError("policy %s: expected a JSON object" % path)
        unknown = sorted(set(data) - set(self.LIST_KEYS) - {"strict"})
        if unknown:
            raise BytecheckError("policy %s: unknown key(s): %s" % (path, ", ".join(unknown)))
        for key in self.LIST_KEYS:
            value = data.get(key, [])
            if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
                raise BytecheckError("policy %s: %r must be a list of strings" % (path, key))
            getattr(self, key).extend(value)
        strict = data.get("strict", False)
        if not isinstance(strict, bool):
            raise BytecheckError("policy %s: 'strict' must be a boolean" % path)
        self.strict = self.strict or strict
    def add_args(self, args):
        for key in self.LIST_KEYS:
            getattr(self, key).extend(getattr(args, key, None) or [])
        self.strict = self.strict or bool(getattr(args, "strict", False))
    def finalize(self):
        for spec in self.within:
            path, ranges = parse_within(spec)
            self.within_ranges.setdefault(path, []).extend(ranges)
        self.disabled = parse_disabled(self.disable)
    def edit_patterns(self):
        return self.allow + self.expect + list(self.within_ranges)
    def to_json(self):
        doc = {key: list(getattr(self, key)) for key in self.LIST_KEYS}
        doc["strict"] = self.strict
        return doc
def build_policy(args):
    policy = Policy()
    if getattr(args, "policy", None):
        policy.load_file(args.policy)
    policy.add_args(args)
    policy.finalize()
    return policy
def classify_changes(before, after):
    changes = []
    for path in sorted(set(before) | set(after)):
        b = before.get(path)
        a = after.get(path)
        if b is None:
            kind = "added"
        elif a is None:
            kind = "deleted"
        else:
            same_content = b["type"] == a["type"] and entry_payload(b) == entry_payload(a)
            same_exec = bool(b.get("exec")) == bool(a.get("exec"))
            if same_content and same_exec:
                continue
            kind = "attr" if same_content else "modified"
        changes.append({"path": path, "kind": kind, "before": b, "after": a})
    return detect_renames(changes)
def detect_renames(changes):
    deleted, added = {}, {}
    for c in changes:
        if c["kind"] == "deleted" and c["before"]["type"] == "file":
            deleted.setdefault(c["before"]["sha256"], []).append(c)
        elif c["kind"] == "added" and c["after"]["type"] == "file":
            added.setdefault(c["after"]["sha256"], []).append(c)
    consumed = set()
    renamed = []
    for digest, dels in deleted.items():
        adds = added.get(digest, [])
        if len(dels) == 1 and len(adds) == 1:
            d, a = dels[0], adds[0]
            consumed.add(id(d))
            consumed.add(id(a))
            renamed.append({"path": a["path"], "kind": "renamed", "old_path": d["path"],
                            "before": d["before"], "after": a["after"]})
    out = [c for c in changes if id(c) not in consumed] + renamed
    out.sort(key=lambda c: c["path"])
    return out
def evaluate_change(change, policy):
    kind, path = change["kind"], change["path"]
    edit_pats = policy.edit_patterns()
    def denied(p):
        return first_match(policy.deny, p)
    def may_edit(p):
        return first_match(edit_pats, p) is not None
    def may_delete(p):
        return first_match(policy.allow_delete, p) is not None
    if kind == "deleted":
        d = denied(path)
        if d:
            return False, "denied by %r" % d
        if not may_delete(path):
            return False, "deletion not allowed (needs --allow-delete)"
        return True, None
    if kind == "renamed":
        old = change["old_path"]
        for p in (path, old):
            d = denied(p)
            if d:
                return False, "denied by %r" % d
        if not may_edit(path):
            return False, "rename target not in allowed paths"
        if not (may_edit(old) or may_delete(old)):
            return False, "rename source not allowed"
        return True, None
    d = denied(path)
    if d:
        return False, "denied by %r" % d
    if not may_edit(path):
        return False, "not in allowed paths"
    return True, None
def case_collisions(before, after):
    groups = {}
    for p in before:
        groups.setdefault(p.casefold(), []).append(p)
    out = []
    for group in groups.values():
        if len(group) > 1:
            present = [p for p in group if p in after]
            if present and len(present) < len(group):
                out.append(sorted(group))
    return out
# ----------------------------------------------------------------------------
# result / reporter
# ----------------------------------------------------------------------------
class Result(object):
    def __init__(self, command):
        self.command = command
        self.ok = True
        self.incomplete = False
        self.summary = {}
        self.data = {}
        self.errors = []
        self.lines = []
        self.stdout_override = None
    def exit_code(self):
        if self.incomplete:
            return EXIT_ERROR
        return EXIT_PASS if self.ok else EXIT_FAIL
    def verdict(self):
        if self.incomplete:
            return "ERROR"
        return "PASS" if self.ok else "FAIL"
    def to_json(self):
        doc = {
            "schema": RESULT_SCHEMA,
            "tool_version": __version__,
            "command": self.command,
            "ok": bool(self.ok and not self.incomplete),
            "incomplete": bool(self.incomplete),
        }
        doc.update(self.data)
        summary = dict(self.summary)
        summary["verdict"] = self.verdict()
        doc["summary"] = summary
        doc["errors"] = list(self.errors)
        return doc
# ----------------------------------------------------------------------------
# commands
# ----------------------------------------------------------------------------
def read_exclude_file(path):
    out = []
    try:
        text = read_file(path).decode("utf-8", "surrogateescape")
    except OSError as exc:
        raise BytecheckError("cannot read --exclude-from %s: %s" % (path, exc))
    for line in text.splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            out.append(line)
    return out
def run_snapshot(args, result):
    root = args.root
    if not os.path.isdir(root):
        raise BytecheckError("root %s is not a directory" % root)
    excludes = [] if args.no_default_excludes else list(DEFAULT_EXCLUDES)
    extra = list(args.exclude)
    if args.exclude_from:
        extra += read_exclude_file(args.exclude_from)
    for p in extra:
        if p not in excludes:
            excludes.append(p)
    out = args.output
    store_dir = store_rel = None
    if args.store is not None:
        if args.store is True:
            if out == "-":
                raise BytecheckError("--store needs an explicit DIR when the manifest goes to stdout")
            stem = os.path.splitext(os.path.basename(out))[0]
            store_dir = os.path.join(os.path.dirname(out) or ".", stem + ".objects")
        else:
            store_dir = args.store
        try:
            os.makedirs(store_dir, exist_ok=True)
        except OSError as exc:
            raise BytecheckError("cannot create store %s: %s" % (store_dir, exc))
        if out == "-":
            store_rel = to_posix(store_dir)
        else:
            base = os.path.dirname(os.path.abspath(out))
            try:
                store_rel = to_posix(os.path.relpath(os.path.abspath(store_dir), base))
            except ValueError:
                store_rel = to_posix(os.path.abspath(store_dir))
    skip = [store_dir] if store_dir else []
    if out != "-":
        skip.append(out)
    files = scan_tree(root, Excluder(excludes), skip=skip, store=store_dir, errors=result.errors)
    result.incomplete = bool(result.errors)
    manifest = build_manifest(to_posix(os.path.normpath(root)), files, excludes, store_rel)
    text = dumps(manifest)
    if out == "-":
        result.stdout_override = text
    else:
        try:
            write_file(out, to_bytes(text))
        except OSError as exc:
            raise BytecheckError("cannot write manifest %s: %s" % (out, exc))
    total_bytes = sum(e.get("size", 0) for e in files.values())
    result.data.update({"manifest": None if out == "-" else to_posix(out), "store": store_rel,
                        "root": manifest["root"], "tree_hash": manifest["tree_hash"], "excludes": excludes})
    result.summary.update({"files": len(files), "bytes": total_bytes})
    line = "snapshot %s  tree %s  -> %s" % (plural(len(files), "file"), short(manifest["tree_hash"]),
                                           "stdout" if out == "-" else to_posix(out))
    if store_rel:
        line += "  (store: %s)" % store_rel
    result.lines.append(line)
def baseline_bytes(entry, path, store_dir, baseline_dir, errors):
    digest = entry.get("sha256")
    if store_dir and digest:
        candidate = os.path.join(store_dir, digest)
        if os.path.isfile(candidate):
            try:
                return read_file(candidate)
            except OSError as exc:
                errors.append({"path": path, "error": "cannot read store object: %s" % exc})
                return None
    if baseline_dir:
        candidate = os.path.join(baseline_dir, *path.split("/"))
        if os.path.isfile(candidate) and not os.path.islink(candidate):
            try:
                data = read_file(candidate)
            except OSError as exc:
                errors.append({"path": path, "error": "cannot read baseline copy: %s" % exc})
                return None
            if digest and hash_bytes(data) != digest:
                errors.append({"path": path, "error": "baseline copy does not match manifest sha256"})
                return None
            return data
    return None
def describe_change(c):
    kind = c["kind"]
    label = "%s -> %s" % (c["old_path"], c["path"]) if kind == "renamed" else c["path"]
    extras = []
    if kind == "attr":
        extras.append("exec+" if c["after"].get("exec") else "exec-")
    if kind == "modified":
        bt, at = c["before"]["type"], c["after"]["type"]
        if bt != at:
            extras.append("%s->%s" % (bt, at))
        if "hunks" in c:
            extras.append("+%d -%d" % (c["added"], c["removed"]))
        if c.get("eol_only"):
            extras.append("(eol-only)")
        elif c.get("whitespace_only"):
            extras.append("(whitespace-only)")
    if c.get("note"):
        extras.append("[%s]" % c["note"])
    return label, " ".join(extras)
def run_verify(args, result):
    if args.manifest is None and not args.baseline:
        raise BytecheckError("verify needs a MANIFEST (or - for stdin) or --baseline DIR")
    policy = build_policy(args)
    root = args.root or "."
    if not os.path.isdir(root):
        raise BytecheckError("root %s is not a directory" % root)
    if args.baseline and not os.path.isdir(args.baseline):
        raise BytecheckError("baseline %s is not a directory" % args.baseline)
    manifest = None
    store_dir = None
    recorded_before = None
    if args.manifest is not None:
        manifest = load_manifest(args.manifest)
        excludes = list(manifest.get("excludes", []))
        before_files = dict(manifest["files"])
        recorded_before = manifest["tree_hash"]
        recomputed = tree_hash(before_files)
        if recomputed != recorded_before:
            result.errors.append({"path": None if args.manifest == "-" else args.manifest,
                                  "error": "manifest tree_hash does not match its own entries (corrupt or edited)"})
        if manifest.get("store"):
            base = os.getcwd() if args.manifest == "-" else os.path.dirname(os.path.abspath(args.manifest))
            store_dir = os.path.normpath(os.path.join(base, manifest["store"]))
            if not os.path.isdir(store_dir):
                diag("%s: warning: store %s not found; hunks and --within unavailable" % (TOOL_NAME, store_dir))
                store_dir = None
    else:
        excludes = list(DEFAULT_EXCLUDES)
        before_files = None
    for p in list(args.exclude) + policy.exclude:
        if p not in excludes:
            excludes.append(p)
    excluder = Excluder(excludes)
    skip = []
    if args.manifest not in (None, "-"):
        skip.append(args.manifest)
    if store_dir:
        skip.append(store_dir)
    if args.baseline:
        skip.append(args.baseline)
    if before_files is None:
        before_files = scan_tree(args.baseline, excluder, skip=[root] + skip, errors=result.errors)
        recorded_before = tree_hash(before_files)
    else:
        before_files = {p: e for p, e in before_files.items() if not excluder.excluded(p)}
    after_files = scan_tree(root, excluder, skip=skip, errors=result.errors)
    th_after = tree_hash(after_files)
    for group in case_collisions(before_files, after_files):
        result.errors.append({"path": group[0],
                              "error": "case-only path collision (%s); case-insensitive filesystem?" % ", ".join(group)})
    changes = classify_changes(before_files, after_files)
    violations = []
    all_findings = []
    disabled = policy.disabled
    for change in changes:
        kind, path = change["kind"], change["path"]
        allowed, reason = evaluate_change(change, policy)
        change["allowed"] = allowed
        if not allowed:
            change["reason"] = reason
            violations.append({"kind": "change_not_allowed", "path": path, "change": kind, "reason": reason})
        findings = []
        after_bytes = None
        if kind in ("added", "modified") and change["after"]["type"] == "file":
            try:
                after_bytes = read_file(os.path.join(root, *path.split("/")))
            except OSError as exc:
                result.errors.append({"path": path, "error": str(exc)})
            if after_bytes is not None:
                if kind == "modified" and change["before"]["type"] == "file":
                    before_bytes = baseline_bytes(change["before"], path, store_dir, args.baseline, result.errors)
                    if before_bytes is not None:
                        change["binary"] = is_binary(before_bytes) or is_binary(after_bytes)
                        if not change["binary"]:
                            hunks, added, removed, note = compute_hunks(before_bytes, after_bytes)
                            change.update({"hunks": hunks, "added": added, "removed": removed,
                                           "whitespace_only": whitespace_only(before_bytes, after_bytes),
                                           "eol_only": eol_only(before_bytes, after_bytes)})
                            if note:
                                change["note"] = note
                        if not args.no_scan:
                            findings += scan_delta(path, before_bytes, after_bytes, disabled)
                if not args.no_scan:
                    content_findings, note = scan_content(path, after_bytes, disabled)
                    findings += content_findings
                    if note and note != "binary":
                        change["note"] = note
        if path in policy.within_ranges:
            ranges = policy.within_ranges[path]
            if kind in ("added", "deleted", "renamed"):
                change["within_ok"] = False
                violations.append({"kind": "outside_within", "path": path,
                                   "reason": "%s file cannot satisfy --within" % kind})
            elif kind == "modified":
                if change.get("binary"):
                    change["within_ok"] = False
                    violations.append({"kind": "outside_within", "path": path, "reason": "binary content"})
                elif "hunks" not in change:
                    result.errors.append({"path": path,
                                          "error": "--within needs before-content: snapshot with --store or pass --baseline DIR"})
                else:
                    bad = [h for h in change["hunks"] if not hunk_within(h, ranges)]
                    change["within_ok"] = not bad
                    if bad:
                        violations.append({"kind": "outside_within", "path": path, "hunks": bad,
                                           "reason": "hunks outside allowed lines: " + "; ".join(format_hunk(h) for h in bad)})
            else:
                change["within_ok"] = True
        change["findings"] = findings
        all_findings += findings
    for pattern in policy.expect:
        hit = any(compile_glob(pattern).matches(c["path"]) or
                  (c.get("old_path") and compile_glob(pattern).matches(c["old_path"])) for c in changes)
        if not hit:
            violations.append({"kind": "expect_missing", "pattern": pattern})
    failing = failing_findings(all_findings, policy.strict)
    result.ok = not violations and not failing
    result.incomplete = bool(result.errors)
    counts = count_findings(all_findings)
    result.data.update({
        "root": to_posix(os.path.normpath(root)),
        "tree_hash_before": recorded_before,
        "tree_hash_after": th_after,
        "policy": policy.to_json(),
        "excludes": excludes,
        "baseline": {"store": None if not store_dir else to_posix(store_dir),
                     "dir": None if not args.baseline else to_posix(args.baseline)},
        "changes": changes,
        "violations": violations,
        "findings": all_findings,
    })
    result.summary.update({
        "changes": len(changes),
        "allowed": sum(1 for c in changes if c["allowed"]),
        "violations": len(violations),
        "expect_missing": sum(1 for v in violations if v["kind"] == "expect_missing"),
        "findings": counts,
        "untouched": recorded_before == th_after,
    })
    within_viol = {v["path"]: v["reason"] for v in violations if v["kind"] == "outside_within"}
    for c in changes:
        label, extras = describe_change(c)
        if not c["allowed"]:
            status = "VIOLATION " + c["reason"]
        elif c["path"] in within_viol:
            status = "VIOLATION " + within_viol[c["path"]]
        else:
            status = "allowed"
        result.lines.append("%s %s%s %s" % (KIND_LETTER[c["kind"]], label, (" " + extras) if extras else "", status))
    for f in all_findings:
        result.lines.append(finding_line(f))
    for v in violations:
        if v["kind"] == "expect_missing":
            result.lines.append("expected change missing: %s" % v["pattern"])
    parts = [plural(len(changes), "change"), plural(len(violations), "violation")]
    if counts["error"]:
        parts.append(plural(counts["error"], "error finding"))
    if counts["warn"]:
        parts.append(plural(counts["warn"], "warning"))
    if counts["info"]:
        parts.append(plural(counts["info"], "info"))
    if result.incomplete:
        parts.append(plural(len(result.errors), "error") + " (see stderr)")
    result.lines.append("%s %s  %s -> %s" % (result.verdict(), ", ".join(parts), short(recorded_before), short(th_after)))
def run_hash(args, result):
    if args.expect and len(args.paths) != 1:
        raise BytecheckError("--expect needs exactly one PATH")
    excluder = Excluder(list(DEFAULT_EXCLUDES) + list(args.exclude))
    items = []
    for p in args.paths:
        if p == "-":
            digest, size = hash_stream(sys.stdin.buffer)
            items.append({"path": "-", "type": "file", "sha256": digest, "size": size})
        elif os.path.isdir(p):
            files = scan_tree(p, excluder, errors=result.errors)
            items.append({"path": to_posix(p), "type": "tree", "sha256": tree_hash(files), "files": len(files)})
        elif os.path.isfile(p):
            try:
                digest, size = hash_file(p)
            except OSError as exc:
                raise BytecheckError("cannot read %s: %s" % (p, exc))
            items.append({"path": to_posix(p), "type": "file", "sha256": digest, "size": size})
        else:
            raise BytecheckError("no such file or directory: %s" % p)
    result.incomplete = bool(result.errors)
    result.data["items"] = items
    for item in items:
        detail = "tree(%d files)" % item["files"] if item["type"] == "tree" else "%d" % item["size"]
        result.lines.append("%s  %s  %s" % (item["sha256"], detail, item["path"]))
    if args.expect:
        expected = args.expect.strip().lower()
        matched = expected == items[0]["sha256"]
        result.ok = matched
        result.summary.update({"expected": expected, "matched": matched})
        result.lines.append("MATCH" if matched else "MISMATCH expected %s got %s" % (expected, items[0]["sha256"]))
    result.summary["items"] = len(items)
def compare_files(a, b):
    offset = 0
    first = None
    with open(a, "rb") as fa, open(b, "rb") as fb:
        while True:
            ca = fa.read(READ_CHUNK)
            cb = fb.read(READ_CHUNK)
            if ca != cb:
                n = min(len(ca), len(cb))
                i = 0
                while i < n and ca[i] == cb[i]:
                    i += 1
                first = offset + i
                break
            if not ca:
                break
            offset += len(ca)
    return first
def entry_diff_reason(x, y):
    if x["type"] != y["type"]:
        return "type %s -> %s" % (x["type"], y["type"])
    if x["type"] == "file" and x["sha256"] != y["sha256"]:
        return "content"
    if x["type"] == "symlink" and x.get("target") != y.get("target"):
        return "symlink target"
    if bool(x.get("exec")) != bool(y.get("exec")):
        return "exec bit"
    return None
def run_same(args, result):
    a, b = args.a, args.b
    if os.path.isfile(a) and os.path.isfile(b):
        try:
            first = compare_files(a, b)
            sa, sb = os.path.getsize(a), os.path.getsize(b)
        except OSError as exc:
            raise BytecheckError(str(exc))
        identical = first is None
        result.ok = identical
        result.data.update({"mode": "files", "a": {"path": to_posix(a), "size": sa},
                            "b": {"path": to_posix(b), "size": sb},
                            "identical": identical, "first_diff_offset": first, "size_delta": sb - sa})
        result.summary["identical"] = identical
        if identical:
            result.lines.append("identical  %d bytes" % sa)
        else:
            result.lines.append("differ at byte %d  a=%d bytes  b=%d bytes (%+d)" % (first, sa, sb, sb - sa))
        return
    if os.path.isdir(a) and os.path.isdir(b):
        excluder = Excluder(list(DEFAULT_EXCLUDES) + list(args.exclude))
        fa = scan_tree(a, excluder, skip=[b], errors=result.errors)
        fb = scan_tree(b, excluder, skip=[a], errors=result.errors)
        only_a = sorted(set(fa) - set(fb))
        only_b = sorted(set(fb) - set(fa))
        differing = []
        for p in sorted(set(fa) & set(fb)):
            reason = entry_diff_reason(fa[p], fb[p])
            if reason:
                differing.append({"path": p, "reason": reason})
        identical = not only_a and not only_b and not differing
        result.incomplete = bool(result.errors)
        result.ok = identical
        result.data.update({"mode": "trees", "a": {"path": to_posix(a), "tree_hash": tree_hash(fa), "files": len(fa)},
                            "b": {"path": to_posix(b), "tree_hash": tree_hash(fb), "files": len(fb)},
                            "identical": identical, "only_in_a": only_a, "only_in_b": only_b, "differing": differing})
        result.summary.update({"identical": identical, "only_in_a": len(only_a), "only_in_b": len(only_b),
                               "differing": len(differing)})
        for p in only_a:
            result.lines.append("only in A: %s" % p)
        for p in only_b:
            result.lines.append("only in B: %s" % p)
        for d in differing:
            result.lines.append("differ: %s (%s)" % (d["path"], d["reason"]))
        if identical:
            result.lines.append("identical  %s  tree %s" % (plural(len(fa), "file"), short(tree_hash(fa))))
        else:
            result.lines.append("different  %d only in A, %d only in B, %d differ" % (len(only_a), len(only_b), len(differing)))
        return
    raise BytecheckError("same needs two files or two directories")
def side_info(data):
    return {"size": len(data), "sha256": hash_bytes(data), "eol": eol_style(data), "bom": has_bom(data),
            "trailing_newline": data.endswith((b"\n", b"\r"))}
def run_delta(args, result):
    try:
        old = read_file(args.old)
        new = read_file(args.new)
    except OSError as exc:
        raise BytecheckError(str(exc))
    disabled = parse_disabled(args.disable)
    ranges = parse_ranges(args.within) if args.within else None
    binary = is_binary(old) or is_binary(new)
    identical = old == new
    data = {"old": dict(side_info(old), path=to_posix(args.old)),
            "new": dict(side_info(new), path=to_posix(args.new)),
            "identical": identical, "binary": binary}
    violations = []
    if not binary:
        hunks, added, removed, note = compute_hunks(old, new)
        data.update({"hunks": hunks, "added": added, "removed": removed,
                     "whitespace_only": whitespace_only(old, new), "eol_only": eol_only(old, new)})
        if note:
            data["note"] = note
        if ranges:
            bad = [h for h in hunks if not hunk_within(h, ranges)]
            data["within_ok"] = not bad
            for h in bad:
                violations.append({"kind": "outside_within", "hunk": h, "reason": format_hunk(h)})
    elif ranges:
        data["within_ok"] = False
        violations.append({"kind": "outside_within", "reason": "binary content"})
    label = to_posix(args.new)
    findings = scan_delta(label, old, new, disabled)
    content_findings, note = scan_content(label, new, disabled)
    findings += content_findings
    failing = failing_findings(findings, args.strict)
    result.ok = not violations and not failing
    data.update({"findings": findings, "violations": violations})
    result.data.update(data)
    counts = count_findings(findings)
    result.summary.update({"identical": identical, "binary": binary, "hunks": len(data.get("hunks", [])),
                           "added": data.get("added", 0), "removed": data.get("removed", 0),
                           "violations": len(violations), "findings": counts})
    head = "delta %s -> %s" % (to_posix(args.old), to_posix(args.new))
    if identical:
        head += "  identical"
    elif binary:
        head += "  binary  %d -> %d bytes" % (len(old), len(new))
    else:
        head += "  +%d -%d  %s" % (data["added"], data["removed"], plural(len(data["hunks"]), "hunk"))
        if data["eol_only"]:
            head += "  (eol-only)"
        elif data["whitespace_only"]:
            head += "  (whitespace-only)"
    head += "  eol %s->%s  bom %s->%s" % (data["old"]["eol"], data["new"]["eol"],
                                         "+" if data["old"]["bom"] else "-", "+" if data["new"]["bom"] else "-")
    result.lines.append(head)
    for h in data.get("hunks", []):
        new_range = "%d-%d" % (h["new_start"], h["new_end"]) if h["new_end"] >= h["new_start"] else "after %d" % h["new_end"]
        outside = ""
        if ranges and not hunk_within(h, ranges):
            outside = "  OUTSIDE --within"
        result.lines.append("@@ %s -> new %s%s" % (format_hunk(h), new_range, outside))
    for f in findings:
        result.lines.append(finding_line(f))
    parts = [plural(len(violations), "violation")]
    if counts["error"]:
        parts.append(plural(counts["error"], "error finding"))
    if counts["warn"]:
        parts.append(plural(counts["warn"], "warning"))
    if counts["info"]:
        parts.append(plural(counts["info"], "info"))
    result.lines.append("%s %s" % (result.verdict(), ", ".join(parts)))
def run_scan(args, result):
    disabled = parse_disabled(args.disable)
    excluder = Excluder(list(DEFAULT_EXCLUDES) + list(args.exclude))
    findings = []
    scanned = 0
    skipped = 0
    def scan_one(label, abs_path):
        nonlocal scanned, skipped
        try:
            data = read_file(abs_path)
        except OSError as exc:
            result.errors.append({"path": label, "error": str(exc)})
            return
        found, note = scan_content(label, data, disabled)
        if note:
            skipped += 1
        scanned += 1
        findings.extend(found)
    for p in args.paths:
        if os.path.isdir(p):
            for rel, kind, abs_path, st in walk(p, excluder, errors=result.errors):
                if kind == "file":
                    scan_one(to_posix(os.path.normpath(os.path.join(p, rel))), abs_path)
        elif os.path.isfile(p):
            scan_one(to_posix(p), p)
        else:
            raise BytecheckError("no such file or directory: %s" % p)
    failing = failing_findings(findings, args.strict)
    result.ok = not failing
    result.incomplete = bool(result.errors)
    counts = count_findings(findings)
    result.data["findings"] = findings
    result.summary.update({"files": scanned, "skipped": skipped, "findings": counts})
    for f in findings:
        result.lines.append(finding_line(f))
    parts = [plural(scanned, "file") + " scanned"]
    if counts["error"]:
        parts.append(plural(counts["error"], "error finding"))
    if counts["warn"]:
        parts.append(plural(counts["warn"], "warning"))
    if counts["info"]:
        parts.append(plural(counts["info"], "info"))
    if not any(counts.values()):
        parts.append("0 findings")
    result.lines.append("%s %s" % (result.verdict(), ", ".join(parts)))
COMMANDS = {
    "snapshot": run_snapshot,
    "verify": run_verify,
    "hash": run_hash,
    "same": run_same,
    "delta": run_delta,
    "scan": run_scan,
}
# ----------------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------------
EPILOG = """\
exit codes:
  0  verdict pass
  1  verdict fail (policy violation, error-severity finding, or warning under --strict)
  2  usage or environment error; whatever was computed is still printed with incomplete: true
rules (error / warn / info):
  error  conflict-marker placeholder nul-in-text bidi-control bom-changed eol-changed
  warn   zero-width smart-quote nbsp mixed-eol shrunk trailing-newline-lost indent-flipped
  info   bom no-trailing-newline invalid-utf8
glob dialect: patterns match the whole root-relative POSIX path; * stays within a path
segment, ** crosses segments, ? is one character, a trailing / means the directory and
everything below it. Default excludes: .git/ and .bytecheck/ (bytecheck's own artifacts).
"""
def build_parser():
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--json", action="store_true", default=argparse.SUPPRESS,
                        help="emit exactly one JSON document on stdout")
    common.add_argument("--quiet", action="store_true", default=argparse.SUPPRESS,
                        help="print nothing; exit code only")
    parser = argparse.ArgumentParser(
        prog=TOOL_NAME, parents=[common],
        description="Byte-exact verification of what an agent changed. "
                    "An agent's report is a claim; the filesystem is the evidence.",
        epilog=EPILOG, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--version", action="version", version="%(prog)s " + __version__)
    sub = parser.add_subparsers(dest="command", metavar="COMMAND")
    sub.required = True
    sp = sub.add_parser("snapshot", parents=[common], help="record a manifest of every file under ROOT",
                        description="Walk ROOT, hash every regular file, record symlink targets and exec bits, "
                                    "write the manifest. Run this before the agent touches anything.")
    sp.add_argument("root", nargs="?", default=".", help="tree to snapshot (default: .)")
    sp.add_argument("-o", "--output", default=DEFAULT_MANIFEST, metavar="FILE",
                    help="manifest path, or - for stdout (default: %(default)s). With -, the manifest is the only stdout output.")
    sp.add_argument("--store", nargs="?", const=True, default=None, metavar="DIR",
                    help="also copy file bytes into a content-addressed store so verify can show hunks and "
                         "enforce --within (default DIR: <manifest stem>.objects/ beside the manifest)")
    sp.add_argument("--exclude", action="append", default=[], metavar="GLOB", help="exclude matching paths (repeatable)")
    sp.add_argument("--exclude-from", metavar="FILE", help="read exclude globs from FILE, one per line")
    sp.add_argument("--no-default-excludes", action="store_true", help="do not exclude .git/ and .bytecheck/")
    vp = sub.add_parser("verify", parents=[common], help="compare the tree to a manifest and apply a policy",
                        description="Re-walk the tree, compare to MANIFEST (or --baseline DIR), classify every change, "
                                    "apply the policy, scan changed files, emit the verdict. With no policy flags, "
                                    "verify asserts the tree is untouched.")
    vp.add_argument("manifest", nargs="?", help="manifest written by snapshot, or - for stdin")
    vp.add_argument("--root", metavar="DIR", help="tree to verify (default: .)")
    vp.add_argument("--baseline", metavar="DIR",
                    help="copy of the original tree; supplies before-content for hunks and --within, "
                         "and stands in for the manifest when none is given")
    vp.add_argument("--policy", metavar="FILE",
                    help="JSON policy with keys allow, deny, expect, allow_delete, within, disable, exclude, "
                         "strict; flags add to it and cannot remove from it")
    vp.add_argument("--allow", action="append", default=[], metavar="GLOB",
                    help="permit added, modified and attr changes on matching paths (repeatable)")
    vp.add_argument("--deny", action="append", default=[], metavar="GLOB",
                    help="forbid any change on matching paths; wins over every allow (repeatable)")
    vp.add_argument("--expect", action="append", default=[], metavar="GLOB",
                    help="require at least one change matching GLOB; implies --allow for it (repeatable)")
    vp.add_argument("--allow-delete", dest="allow_delete", action="append", default=[], metavar="GLOB",
                    help="permit deletion of matching paths; never implied by --allow (repeatable)")
    vp.add_argument("--within", action="append", default=[], metavar="PATH:RANGES",
                    help="every hunk in PATH must sit inside RANGES, e.g. src/a.py:120-180,210-215 "
                         "(1-based, inclusive, old-file lines; needs --store or --baseline)")
    vp.add_argument("--no-scan", dest="no_scan", action="store_true",
                    help="skip content rules on changed files")
    vp.add_argument("--disable", action="append", default=[], metavar="RULE",
                    help="disable a content rule (repeatable)")
    vp.add_argument("--strict", action="store_true", help="warnings fail the run")
    vp.add_argument("--exclude", action="append", default=[], metavar="GLOB",
                    help="exclude more paths on top of the manifest's excludes (repeatable)")
    hp = sub.add_parser("hash", parents=[common], help="sha256 and size of files, stdin, or a tree",
                        description="SHA-256 and size per file; - reads stdin; a directory yields its tree_hash "
                                    "(same definition and default excludes as the manifest). "
                                    "--expect turns it into an assertion.")
    hp.add_argument("paths", nargs="+", metavar="PATH", help="file, directory, or - for stdin")
    hp.add_argument("--expect", metavar="HEX",
                    help="assert the digest of the single PATH equals HEX (exit 1 otherwise)")
    hp.add_argument("--exclude", action="append", default=[], metavar="GLOB",
                    help="exclude matching paths when hashing a tree (repeatable)")
    mp = sub.add_parser("same", parents=[common], help="are two files or two trees byte-identical",
                        description="Byte-identical or not. Files: first differing byte offset and size delta. "
                                    "Trees: only-in-A, only-in-B, differing paths. No normalisation. "
                                    "Exit 1 when different.")
    mp.add_argument("a", metavar="A")
    mp.add_argument("b", metavar="B")
    mp.add_argument("--exclude", action="append", default=[], metavar="GLOB",
                    help="exclude matching paths when comparing trees (repeatable)")
    dp = sub.add_parser("delta", parents=[common], help="describe how two files differ",
                        description="Hunks as old/new line ranges, added/removed counts, EOL and BOM before and "
                                    "after, whitespace_only and eol_only flags, delta-aware rule findings. "
                                    "Differences alone do not fail; --within and error-severity findings do.")
    dp.add_argument("old", metavar="OLD")
    dp.add_argument("new", metavar="NEW")
    dp.add_argument("--within", metavar="RANGES",
                    help="every hunk must sit inside RANGES, e.g. 120-180,210-215 (1-based, inclusive, OLD lines)")
    dp.add_argument("--disable", action="append", default=[], metavar="RULE",
                    help="disable a content rule (repeatable)")
    dp.add_argument("--strict", action="store_true", help="warnings fail the run")
    cp = sub.add_parser("scan", parents=[common], help="content-hygiene rules on files or trees, no baseline needed",
                        description="Absolute content rules (conflict markers, placeholders, NUL, bidi controls, "
                                    "zero-width, smart quotes, NBSP, mixed EOL, BOM, trailing newline, UTF-8) "
                                    "on files or trees.")
    cp.add_argument("paths", nargs="+", metavar="PATH")
    cp.add_argument("--disable", action="append", default=[], metavar="RULE",
                    help="disable a content rule (repeatable)")
    cp.add_argument("--strict", action="store_true", help="warnings fail the run")
    cp.add_argument("--exclude", action="append", default=[], metavar="GLOB",
                    help="exclude matching paths when scanning a tree (repeatable)")
    return parser


def report(result, as_json, quiet):
    if quiet:
        return
    for err in result.errors:
        where = ("%s: " % err["path"]) if err.get("path") else ""
        diag("%s: error: %s%s" % (TOOL_NAME, where, err["error"]))
    if result.stdout_override is not None:
        emit(result.stdout_override)
    elif as_json:
        emit(dumps(result.to_json()))
    elif result.lines:
        emit("\n".join(result.lines) + "\n")


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    as_json = getattr(args, "json", False)
    quiet = getattr(args, "quiet", False)
    result = Result(args.command)
    try:
        if args.command == "snapshot" and args.output == "-" and quiet:
            raise BytecheckError("snapshot -o - and --quiet are mutually exclusive")
        COMMANDS[args.command](args, result)
    except BytecheckError as exc:
        result.incomplete = True
        result.errors.append({"path": None, "error": str(exc)})
    except KeyboardInterrupt:
        result.incomplete = True
        result.errors.append({"path": None, "error": "interrupted"})
    except Exception as exc:  # fail closed: exit 2, never a traceback on stdout
        result.incomplete = True
        result.errors.append({"path": None, "error": "internal error: %s: %s" % (type(exc).__name__, exc)})
    try:
        report(result, as_json, quiet)
    except BrokenPipeError:
        devnull = os.open(os.devnull, os.O_WRONLY)
        os.dup2(devnull, sys.stdout.fileno())
    return result.exit_code()


if __name__ == "__main__":
    sys.exit(main())
