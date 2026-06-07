import { useState } from "react";
import type { Submission } from "../hooks/useSubmissions";

interface Props {
  pending: Submission[];
  approved: Submission[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export function AdminPanel({ pending, approved, onApprove, onReject, onDelete, onClose }: Props) {
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [loading, setLoading] = useState<string | null>(null);

  async function handle(fn: () => Promise<void>, id: string) {
    setLoading(id);
    try { await fn(); } finally { setLoading(null); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Admin Panel</h2>
            <p className="text-xs text-slate-500 mt-0.5">Review and manage attendance requests</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 shrink-0">
          <button
            onClick={() => setTab("pending")}
            className={`pb-3 pt-3 mr-6 text-sm font-semibold border-b-2 transition-colors ${
              tab === "pending"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Pending
            {pending.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("approved")}
            className={`pb-3 pt-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === "approved"
                ? "border-green-500 text-green-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Approved
            {approved.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                {approved.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {tab === "pending" && (
            pending.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{s.matricNo}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        {s.department}
                      </span>
                      {s.createdAt && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {s.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handle(() => onApprove(s.id), s.id + "-approve")}
                        disabled={loading !== null}
                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {loading === s.id + "-approve" ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => handle(() => onReject(s.id), s.id + "-reject")}
                        disabled={loading !== null}
                        className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 disabled:opacity-50 transition-colors"
                      >
                        {loading === s.id + "-reject" ? "…" : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "approved" && (
            approved.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p className="text-sm font-medium">No approved additions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {approved.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{s.matricNo}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        {s.department}
                      </span>
                    </div>
                    <button
                      onClick={() => handle(() => onDelete(s.id), s.id + "-delete")}
                      disabled={loading !== null}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium hover:bg-red-100 hover:text-red-600 disabled:opacity-50 transition-colors"
                    >
                      {loading === s.id + "-delete" ? "…" : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
