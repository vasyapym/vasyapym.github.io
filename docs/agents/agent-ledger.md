# Agent ledger

`.agents/agent-ledger.json` is an append-only mailbox for AI agents working
in this repo in parallel. Several agents may hold uncommitted work in the
same working tree at once; the ledger is how they talk about the one accident
that arrangement invites: **one agent committing another agent's changes.**

## The ritual (read before every commit)

1. `git status` — anything modified or untracked that you did not write?
   Leave it alone. Stage only your own paths, by name.
2. Commit, push.
3. **If foreign changes slipped into your commit anyway** (a stray `git add
   .`, a hook, a misread status): do not revert, do not rewrite. Append a
   `sweep-report` entry to the ledger naming the commit and every swept file,
   commit the ledger, push immediately. The owner then finds a one-screen
   explanation instead of doing archaeology on `git log`.
4. **If your own work was committed by someone else**: `git log --oneline --
   <your files>`, read the ledger for a report about it, and append an `ack`
   entry. Decide together (via the ledger or the human) whether to keep,
   revert, or hand off — never unilaterally revert another agent's commit.

## Entry kinds

| kind           | written by            | means                                                        |
| -------------- | --------------------- | ------------------------------------------------------------ |
| `sweep-report` | the sweeping agent    | "I committed files that were probably yours — here they are" |
| `ack`          | the swept agent       | "I saw the report about my files; here is the resolution"    |
| `note`         | any agent             | anything else the next agent touching those files should know |

## Schema

```jsonc
{
  "version": 1,
  "about": "…one-line protocol reminder…",
  "entries": [
    {
      "id": "kebab-case-unique-id",        // any unique string
      "ts": "2026-08-24T05:40:00Z",        // ISO 8601
      "kind": "sweep-report | ack | note",
      "agent": "model + session/task",      // e.g. "ox-alpha (opencode, evening-forest mobile pass)"
      "commit": "f9d42fb",                  // commit the event is about (omit for pure notes)
      "files": ["path/or/glob"],            // files involved
      "message": "what happened, what the owner should do (if anything)",
      "ackBy": "who acknowledged",          // optional; set on ack, leave null otherwise
      "ackAt": "ISO 8601"                   // optional
    }
  ]
}
```

## Etiquette

- **Append-only.** Never rewrite, reorder, or delete another agent's entry.
  An `ack` closes a thread; history stays for the record.
- **Keep it valid JSON.** `node -e "JSON.parse(require('fs').readFileSync('.agents/agent-ledger.json'))"`
  after editing.
- **Ship it immediately.** A ledger entry that sits uncommitted protects
  nobody. Commit it right after the event, in the same push.
- **Write to the point.** One screen per entry: what happened, which files,
  what the owner should do. The ledger is a notice board, not a diary.
- The project graph (`.project-history/graph.jsonl`) records *project*
  history; the ledger records *inter-agent* incidents and courtesies. They
  answer different questions and do not replace each other.
