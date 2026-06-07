import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Submission {
  id: string;
  name: string;
  matricNo: string;
  department: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date | null;
}

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "submissions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() ?? null,
      })) as Submission[];
      setSubmissions(docs);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function addSubmission(name: string, matricNo: string, department: string) {
    await addDoc(collection(db, "submissions"), {
      name: name.trim(),
      matricNo: matricNo.trim(),
      department,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  }

  async function approveSubmission(id: string) {
    await updateDoc(doc(db, "submissions", id), { status: "approved" });
  }

  async function rejectSubmission(id: string) {
    await updateDoc(doc(db, "submissions", id), { status: "rejected" });
  }

  async function deleteSubmission(id: string) {
    await deleteDoc(doc(db, "submissions", id));
  }

  const pending = submissions.filter((s) => s.status === "pending");
  const approved = submissions.filter((s) => s.status === "approved");

  return { submissions, pending, approved, loading, addSubmission, approveSubmission, rejectSubmission, deleteSubmission };
}
