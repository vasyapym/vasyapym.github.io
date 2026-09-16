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
  // Surface redirect sign-in errors; the session itself resolves via watchAuth.
  getRedirectResult(auth).catch(console.warn);
}

export function watchAuth(cb) {
  if (!auth) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

export async function login() {
  if (!auth) { alert("Firebase not configured — edit js/config.js"); return; }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    // Popup blocked or unsupported environment (iOS Safari etc.) → full-page redirect.
    if (e?.code === "auth/popup-blocked" || e?.code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, provider);
      return; // page navigates away; watchAuth resolves the session on return
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
