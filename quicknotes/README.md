# notes

Static, no-build, local-first markdown notes with Google sign-in and Firestore sync.

## Setup (one-time)

1. Firebase console → **Authentication → Sign-in method → Google**: enable it.
2. `js/config.js` is already filled with the `vasyapym-85a64` project config.
3. **Firestore**: create the database (production mode).
4. **Firestore → Rules**: paste `firestore.rules` and publish.
5. **Authentication → Settings → Authorized domains**: add the final hosting domain (localhost works out of the box).
6. Serve the folder over http(s): `npx serve .` / `python -m http.server` / Firebase Hosting / any static host (GitHub Pages works — paths are relative).

Without a config the app runs fully local (localStorage). Signing in later migrates local notes into the account.

## Keys
| Key | Action |
|---|---|
| Ctrl+N | new note |
| Ctrl+P / Ctrl+Shift+P | open note / command palette |
| Ctrl+K or `/` | search |
| Ctrl+E | cycle edit / split / preview |
| Ctrl+Shift+E | export zip (all or folder) |
| Ctrl+S | sync now |
| Ctrl+D | delete note (no confirmation) |
| Esc | back to search |
| ↑↓ / j k | move in list |
| ←→ / h l | fold / unfold folder |

## Notes
- Folders are virtual: the **path** field (`work/ideas`) groups notes; export preserves it as directories. The sidebar renders them as a nested tree; folders start collapsed and their open state is remembered.
- Folder actions: `+` on a folder row creates a note inside it; `⋯` (or right-click / long-press) opens the menu — rename, move, "Remove folder (keep notes)" moves contents one level up. `+ Folder` in the sidebar header creates a folder (typed inline, `a/b` creates both levels) by placing its first note.
- Dragging a note moves only that note; dragging a folder moves everything under it. Dropping onto a note targets that note's folder; mouse-only.
- `[[Title]]` links open (or create) a note by title; red dashed = missing.
- Rendering escapes all HTML first, so raw HTML/script in notes is inert; only `http(s):`/`mailto:` URLs are linkified.
- Sync is last-write-wins by `updatedAt`; deletes are soft (`deleted: true`) so they propagate across devices.
- Firestore runs on the persistent IndexedDB cache with a multi-tab manager: offline edits queue in the SDK and flush on reconnect.
