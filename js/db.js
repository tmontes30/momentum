import {
  doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc, query, orderBy, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";

const userRef = (uid) => doc(db, "users", uid);
const sessionsRef = (uid) => collection(db, "users", uid, "sessions");
const bodyweightRef = (uid) => collection(db, "users", uid, "bodyweight");

export async function getProfile(uid) {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveProfile(uid, data) {
  await setDoc(userRef(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function listSessions(uid) {
  const snap = await getDocs(query(sessionsRef(uid), orderBy("date", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addSession(uid, session) {
  const ref = await addDoc(sessionsRef(uid), { ...session, createdAt: serverTimestamp() });
  return { id: ref.id, ...session };
}

export function deleteSession(uid, id) {
  return deleteDoc(doc(db, "users", uid, "sessions", id));
}

export async function listBodyweight(uid) {
  const snap = await getDocs(query(bodyweightRef(uid), orderBy("date", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addBodyweight(uid, entry) {
  const ref = await addDoc(bodyweightRef(uid), { ...entry, createdAt: serverTimestamp() });
  return { id: ref.id, ...entry };
}

export function deleteBodyweight(uid, id) {
  return deleteDoc(doc(db, "users", uid, "bodyweight", id));
}
