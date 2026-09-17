import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

export const configured = !/YOUR_/.test(JSON.stringify(firebaseConfig));

let auth = null, db = null;
if (configured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Persistent IndexedDB cache: reads serve from disk when offline, writes queue
  // until connectivity returns; multi-tab manager keeps all tabs on one cache.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
  // Session survives reload/tab close.
  setPersistence(auth, browserLocalPersistence).catch(console.warn);
  // Surface redirect sign-in errors once (the result itself resolves the
  // session via watchAuth); a failed redirect must not stay silent.
  getRedirectResult(auth).catch(e => {
    console.error("redirect sign-in failed:", e);
    if (e?.code === "auth/unauthorized-domain") {
      alert("Sign-in redirect was rejected for this domain.\nFirebase console → Authentication → Settings → Authorized domains → add this domain.");
    } else if (e?.code) {
      alert(`Sign-in redirect failed: ${e.code}`);
    }
  });
}

export function watchAuth(cb) {
  if (!auth) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

// Codes that mean "popup could not happen or died before returning a verdict"
// — the redirect flow is the working path in every one of these browsers.
const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/popup-failed-to-open",
  "auth/operation-not-supported-in-this-environment",
  "auth/cancelled-popup-request",
  "auth/web-storage-unsupported",
]);

export async function login() {
  if (!auth) { alert("Firebase not configured — edit js/config.js"); return; }
  // Embedded in the catalogue iframe, browsers (notably Safari) suppress
  // popups from cross-context frames and the redirect would navigate the
  // frame to Google, which refuses framing. Hand the whole sign-in to a
  // top-level tab instead; same origin, so the session is shared.
  if (window.self !== window.top) {
    alert("Sign-in opens the app in a new tab (popups are restricted inside embedded frames). Sign in there, then reload this page — the session is shared.");
    window.open(location.origin + "/quicknotes/", "_blank", "noopener");
    return;
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    const code = e?.code ?? "";
    if (POPUP_FALLBACK_CODES.has(code)) {
      await signInWithRedirect(auth, provider);
      return; // page navigates away; watchAuth resolves the session on return
    }
    if (code === "auth/popup-closed-by-user") return; // user closed it on purpose
    if (code === "auth/unauthorized-domain") {
      alert("This domain is not authorized for sign-in.\nFirebase console → Authentication → Settings → Authorized domains → add this domain.");
      return;
    }
    throw e;
  }
}

export function logout() { return auth ? signOut(auth) : Promise.resolve(); }

const notesCol = uid => collection(db, "users", uid, "notes");

/** Subscribe to remote notes; cb receives array of note objects. */
export function watchNotes(uid, cb, onErr) {
  if (!db) return () => {};
  return onSnapshot(notesCol(uid), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, onErr);
}

/** Upsert a note (soft deletes are notes with deleted:true). */
export function pushNote(uid, note) {
  if (!db) return Promise.resolve();
  const { _dirty, ...clean } = note;
  return setDoc(doc(notesCol(uid), note.id), clean);
}
