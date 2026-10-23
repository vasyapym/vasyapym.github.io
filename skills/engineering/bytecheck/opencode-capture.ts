// bytecheck capture — paste-to-file for opencode.
//
// Every message the human types or pastes into the chat is written to disk
// byte-exactly: one UTF-8 file per text part, plus a .sha256 sidecar, into
// <project>/.bytecheck/inbox/ (or $BYTECHECK_INBOX when set). The chat
// transcript is a claim; the inbox file is the evidence.
//
// Ships with the bytecheck skill: https://github.com/vasyapym/bytecheck
// Install: copy this file into ~/.config/opencode/plugins/ and restart
// opencode — plugins load at startup only. Protocol: SKILL.md, "Capture"
// and "Harvest".
//
// Capture-first design:
// - The hook never throws into opencode; on any failure it appends to
//   capture.log and moves on.
// - A doubtful capture beats a lost paste: subagent sessions are skipped
//   only when the session record says so (parentID); anything that cannot
//   be determined is captured.
// - Assistant messages are not captured. The inbox is for human bytes only;
//   model-generated text has a different trust level and a different job.
// - Zero runtime dependencies: the plugin import is type-only, the rest are
//   node builtins, so the file works wherever opencode runs.

import type { Plugin } from "@opencode-ai/plugin";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";

const LOG = "capture.log";

/** A text part worth capturing: plain text, present, not machine-injected. */
type CaptureText = { type: "text"; text: string; synthetic?: boolean };

function isCaptureText(p: unknown): p is CaptureText {
  const t = p as CaptureText | null | undefined;
  return (
    !!t &&
    t.type === "text" &&
    typeof t.text === "string" &&
    t.text.length > 0 &&
    t.synthetic !== true
  );
}

/** Local timestamp for the file name, `YYYYMMDD-HHMMSS`. */
function stamp(ms: number): string {
  const d = new Date(ms);
  const p = (n: number): string => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

/** Filename-safe tail of a message id. */
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

export const bytecheckCapture: Plugin = async ({ client, directory }) => {
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

  // Optional feedback in the TUI; the inbox file is the real record.
  const toast = (name: string): void => {
    if (!client?.tui?.showToast) return;
    void (async () => {
      try {
        await client.tui.showToast({
          body: { message: `bytecheck capture: ${name}`, variant: "info", duration: 2500 },
        });
      } catch {
        /* TUI absent or busy — the file already landed */
      }
    })();
  };

  // Write one capture: the bytes, the sidecar digest, the log line.
  const write = (
    dir: string,
    base: string,
    text: string,
    sessionID: string,
    messageID: string,
    part: number,
  ): void => {
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
      `captured ${basename(path)} sha=${sha.slice(0, 16)} bytes=${bytes.length} ` +
        `session=${sessionID} msg=${messageID} part=${part}`,
    );
    toast(basename(path));
  };

  // True when the session is a subagent session (its prompts are generated
  // briefs, not human pastes). Null when unknown — capture anyway.
  const isSubagent = async (sessionID: string): Promise<boolean | null> => {
    if (!client?.session?.get) return null;
    try {
      const res = await client.session.get({ path: { id: sessionID } });
      const s = (res as { data?: { parentID?: string } })?.data;
      return s == null ? null : s.parentID != null;
    } catch {
      return null;
    }
  };

  return {
    "chat.message": async (input, output) => {
      try {
        const message = output?.message as
          | { id?: string; role?: string; time?: { created?: number } }
          | undefined;
        if (!message || message.role !== "user") return;
        const parts = ((Array.isArray(output?.parts) ? output.parts : []) as unknown[]).filter(
          isCaptureText,
        );
        if (parts.length === 0) return;
        const sessionID = String(input?.sessionID ?? "unknown");
        if ((await isSubagent(sessionID)) === true) return;
        const dir = ensure(resolveInbox(directory));
        if (!dir) return;
        const t = message.time?.created ?? Date.now();
        const mid = tailId(String(message.id ?? input?.messageID ?? "msg"), 12);
        parts.forEach((p, i) => {
          write(
            dir,
            `${stamp(t)}-${mid}-p${i + 1}.txt`,
            p.text,
            sessionID,
            String(message.id ?? "msg"),
            i + 1,
          );
        });
      } catch (e) {
        log(null, `error ${(e as Error)?.message ?? String(e)}`);
      }
    },
  };
};
