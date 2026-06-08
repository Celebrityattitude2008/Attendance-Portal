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
  where,
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

export function useSubmissions(isAdmin: boolean) {
  const [approved, setApproved] = useState<Submission[]>([]);
  const [pending, setPending] = useState<Submission[]>([]);
  const [approvedError, setApprovedError] = useState<string | null>(null);

  // Public query — only approved docs, no orderBy so no composite index needed
  useEffect(() => {
    const q = query(
      collection(db, "submissions"),
      where("status", "==", "approved")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setApprovedError(null);
        setApproved(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Submission, "id" | "createdAt">),
            createdAt: (d.data().createdAt as { toDate?: () => Date } | null)?.toDate?.() ?? null,
          }))
        );
      },
      (err) => {
        console.error("[useSubmissions] approved query failed:", err.code, err.message);
        setApprovedError(err.code);
      }
    );
    return unsub;
  }, []);

  // Admin-only query — all docs for managing pending requests
  useEffect(() => {
    if (!isAdmin) {
      setPending([]);
      return;
    }
    const q = query(collection(db, "submissions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Submission, "id" | "createdAt">),
          createdAt: (d.data().createdAt as { toDate?: () => Date } | null)?.toDate?.() ?? null,
        }));
        setPending(docs.filter((s) => s.status === "pending"));
      },
      (err) => {
        console.error("[useSubmissions] admin query failed:", err.code, err.message);
      }
    );
    return unsub;
  }, [isAdmin]);

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

  return { approved, pending, approvedError, addSubmission, approveSubmission, rejectSubmission, deleteSubmission };
}
