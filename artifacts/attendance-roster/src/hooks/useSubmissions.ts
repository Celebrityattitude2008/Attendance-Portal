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
  const [loading, setLoading] = useState(true);

  // Everyone can read approved submissions — filtered query passes security rules
  useEffect(() => {
    const q = query(
      collection(db, "submissions"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() ?? null,
        })) as Submission[];
        setApproved(docs);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // Only admins fetch all submissions (to see pending/rejected)
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
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() ?? null,
        })) as Submission[];
        setPending(docs.filter((s) => s.status === "pending"));
      },
      () => {}
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

  return { approved, pending, loading, addSubmission, approveSubmission, rejectSubmission, deleteSubmission };
}
