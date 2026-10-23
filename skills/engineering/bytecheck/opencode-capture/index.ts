// bytecheck capture — paste-to-file for opencode (V2 plugin API).
//
// Every message the human types or pastes into the chat is written to disk
// byte-exactly: one UTF-8 file per admitted prompt text, plus a .sha256
// sidecar, into <project>/.bytecheck/inbox/ (or $BYTECHECK_INBOX when set).
// The chat transcript is a claim; the inbox file is the evidence.
//
// Ships with the bytecheck skill.
// Install (OpenCode V2): copy this DIRECTORY into
// ~/.config/opencode/plugins/bytecheck-capture/ and declare that directory in
// the global opencode.json(c) "plugins" array (a configured local path must
// name a directory — a .ts file is skipped with a log warning), then restart
// opencode — plugins load at startup only. Protocol: SKILL.md, "Capture"
// and "Harvest".
//
// Capture-first design:
// - The hook NEVER throws: a throwing prompt hook can block prompt admission
//   and eat the human's message, so every failure is logged to capture.log
//   and swallowed; the write itself runs after the hook returns.
// - A doubtful capture beats a lost paste: subagent sessions are skipped only
//   when the session record says so; anything that cannot be determined is
//   captured.
// - Assistant messages are not captured: this hook fires on prompt admission
//   only, which synthetic messages, shell messages, compaction controls and
//   move controls never reach.
// - Zero runtime dependencies: the plugin import is the published API, the
//   rest are node builtins, so the file works wherever opencode runs.

import { Plugin } from "@opencode/plugin";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";

const LOG = "capture.log";

/** Local timestamp for the file name, `YYYYMMDD-HHMMSS`. */
function stamp(ms: number): string {
  const d = new Date(ms);
  const p = (n: number): string => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

/** Filename-safe tail of an id. */
function tailId(s: string, max: number): string {
  const clean = s.replace(/[^A-Za-z0-9_-]/g, "");
  return clean.slice(-max) || "msg";
}

function resolveInbox(directory: string | undefined): string {
  const env = process.env.BYTECHECK_INBOX?.trim();
  if (env) return env;
  if (directory) return join(directory, ".bytecheck", "inbox");
  return join(homedir(), ".bytecheck", "inbox");
}

export default Plugin.define({
  id: "bytecheck-capture",
  async setup(ctx) {
    // Append a line to the capture log; never fail because of a log failure.
    const log = (dir: string | null, line: string): void => {
      try {
        const target = dir ?? join(homedir(), ".bytecheck");
        mkdirSync(target, { recursive: true });
        appendFileSync(join(target, LOG), `${new Date().toISOString()} ${line}\n`);
      } catch {
        /* nowhere left to report to */
      }
    };

    // Create the inbox on first use; on failure fall back to the home inbox.
    const ensure = (want: string): string | null => {
      try {
        mkdirSync(want, { recursive: true });
        return want;
      } catch {
        const fallback = join(homedir(), ".bytecheck", "inbox");
        if (fallback !== want) {
          try {
            mkdirSync(fallback, { recursive: true });
            log(fallback, `fallback ${fallback} (could not create ${want})`);
            return fallback;
          } catch {
            /* fall through */
          }
        }
        log(null, `error could not create inbox ${want}`);
        return null;
      }
    };

    // True when the session is a subagent session (its prompts are generated
    // briefs, not human pastes). Null when unknown — capture anyway.
    const isSubagent = async (sessionID: string): Promise<boolean | null> => {
      try {
        const res = await ctx.session.get({ sessionID });
        const s = res as { parentID?: string } | undefined;
        return s == null ? null : s.parentID != null;
      } catch {
        return null;
      }
    };

    const capture = async (sessionID: string, text: string): Promise<void> => {
      if (typeof text !== "string" || text.length === 0) return;
      if ((await isSubagent(sessionID)) === true) return;
      const dir = ensure(resolveInbox(ctx.location?.directory));
      if (!dir) return;
      const t = Date.now();
      const mid = tailId(sessionID, 12);
      const base = `${stamp(t)}-${mid}-p1.txt`;
      let path = join(dir, base);
      let n = 2;
      while (existsSync(path)) {
        path = join(dir, `${base.slice(0, -4)}.${n}${base.slice(-4)}`);
        n += 1;
      }
      const bytes = Buffer.from(text, "utf8");
      writeFileSync(path, bytes);
      const sha = createHash("sha256").update(bytes).digest("hex");
      writeFileSync(`${path}.sha256`, `${sha}\n`);
      log(
        dir,
        `captured ${basename(path)} sha=${sha.slice(0, 16)} bytes=${bytes.length} session=${sessionID}`,
      );
    };

    await ctx.session.hook("prompt", (event) => {
      // Never throw from inside the hook: a failed preparation does not admit
      // the prompt. Read defensively, run the write after the hook returns,
      // and swallow every failure into the log.
      try {
        const e = event as { sessionID?: string; prompt?: { text?: string } };
        const sessionID = String(e?.sessionID ?? "unknown");
        const text = e?.prompt?.text;
        if (typeof text !== "string" || text.length === 0) return;
        void capture(sessionID, text).catch((err) =>
          log(null, `error ${(err as Error)?.message ?? String(err)}`),
        );
      } catch (err) {
        log(null, `error ${(err as Error)?.message ?? String(err)}`);
      }
    });
  },
});
