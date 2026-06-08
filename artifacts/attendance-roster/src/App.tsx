import { useState, useMemo } from "react";
import { attendanceData, DEPARTMENT_ORDER } from "./data/attendance";
import { useAuth } from "./hooks/useAuth";
import { useSubmissions } from "./hooks/useSubmissions";
import { AddNameModal } from "./components/AddNameModal";
import { AdminPanel } from "./components/AdminPanel";
import { exportToExcel } from "./utils/exportExcel";

const DEPT_COLORS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  "Agric":               { bg: "bg-emerald-50",  border: "border-emerald-200",  badge: "bg-emerald-100 text-emerald-800",  text: "text-emerald-700" },
  "Anatomy":             { bg: "bg-purple-50",   border: "border-purple-200",   badge: "bg-purple-100 text-purple-800",    text: "text-purple-700" },
  "Bio Chemistry":       { bg: "bg-amber-50",    border: "border-amber-200",    badge: "bg-amber-100 text-amber-800",      text: "text-amber-700" },
  "Computer Science":    { bg: "bg-blue-50",     border: "border-blue-200",     badge: "bg-blue-100 text-blue-800",        text: "text-blue-700" },
  "Engineering":         { bg: "bg-orange-50",   border: "border-orange-200",   badge: "bg-orange-100 text-orange-800",    text: "text-orange-700" },
  "Geo Physics":         { bg: "bg-teal-50",     border: "border-teal-200",     badge: "bg-teal-100 text-teal-800",        text: "text-teal-700" },
  "Med Lab":             { bg: "bg-rose-50",     border: "border-rose-200",     badge: "bg-rose-100 text-rose-800",        text: "text-rose-700" },
  "Medicine and Surgery":{ bg: "bg-red-50",      border: "border-red-200",      badge: "bg-red-100 text-red-800",          text: "text-red-700" },
  "Micro Biology":       { bg: "bg-lime-50",     border: "border-lime-200",     badge: "bg-lime-100 text-lime-800",        text: "text-lime-700" },
  "Nursing":             { bg: "bg-pink-50",     border: "border-pink-200",     badge: "bg-pink-100 text-pink-800",        text: "text-pink-700" },
  "Physiology":          { bg: "bg-indigo-50",   border: "border-indigo-200",   badge: "bg-indigo-100 text-indigo-800",    text: "text-indigo-700" },
};

function toTitleCase(str: string) {
  return str.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export default function App() {
  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [showRulesHelp, setShowRulesHelp] = useState(false);

  const { user, isAdmin, loginWithGoogle, logout } = useAuth();
  const { pending, approved, approvedError, addSubmission, approveSubmission, rejectSubmission, deleteSubmission } =
    useSubmissions(isAdmin);

  // Merge static data + approved Firestore submissions
  const mergedData = useMemo(() => {
    const result: Record<string, { matricNo: string; name: string; source: "static" | "dynamic" }[]> = {};
    for (const dept of DEPARTMENT_ORDER) {
      result[dept] = (attendanceData[dept] ?? []).map((s) => ({ ...s, source: "static" as const }));
    }
    for (const sub of approved) {
      const dept = sub.department;
      if (!result[dept]) result[dept] = [];
      const exists = result[dept].some(
        (s) => s.matricNo.trim().toLowerCase() === sub.matricNo.trim().toLowerCase()
      );
      if (!exists) result[dept].push({ matricNo: sub.matricNo, name: sub.name, source: "dynamic" });
    }
    return result;
  }, [approved]);

  const allDepts = useMemo(() => {
    const depts = [...DEPARTMENT_ORDER];
    for (const sub of approved) {
      if (!depts.includes(sub.department)) depts.push(sub.department);
    }
    return depts;
  }, [approved]);

  const totalCount = useMemo(
    () => Object.values(mergedData).reduce((sum, arr) => sum + arr.length, 0),
    [mergedData]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allDepts.reduce<Record<string, typeof mergedData[string]>>((acc, dept) => {
      if (activeDept && activeDept !== dept) return acc;
      const students = (mergedData[dept] ?? []).filter(
        (s) => !q || s.name.toLowerCase().includes(q) || s.matricNo.toLowerCase().includes(q)
      );
      if (students.length > 0) acc[dept] = students;
      return acc;
    }, {});
  }, [search, activeDept, mergedData, allDepts]);

  const filteredTotal = useMemo(
    () => Object.values(filtered).reduce((sum, arr) => sum + arr.length, 0),
    [filtered]
  );

  async function handleAdminLogin() {
    setAdminLoggingIn(true);
    try { await loginWithGoogle(); } finally { setAdminLoggingIn(false); }
  }

  const printDepts = allDepts.filter((d) => (mergedData[d]?.length ?? 0) > 0);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Firestore rules warning (only shows when permission-denied) ── */}
      {approvedError === "permission-denied" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-3">
            <div className="flex gap-2 items-start">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Firestore rules need updating</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Approved names won't show until you set the security rules in Firebase Console.
                  {" "}
                  <button onClick={() => setShowRulesHelp(!showRulesHelp)} className="underline font-medium">
                    {showRulesHelp ? "Hide" : "Show rules"}
                  </button>
                </p>
                {showRulesHelp && (
                  <pre className="mt-2 text-xs bg-amber-100 rounded-lg p-3 text-amber-900 overflow-x-auto whitespace-pre-wrap">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /submissions/{id} {
      allow create: if true;
      allow read, update, delete: if request.auth != null
        && request.auth.token.email == "${import.meta.env.VITE_ADMIN_EMAIL ?? "your-admin@email.com"}";
      allow read: if resource.data.status == "approved";
    }
  }
}`}</pre>
                )}
              </div>
            </div>
            <button onClick={() => setShowRulesHelp(false)} className="text-amber-400 hover:text-amber-600 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Print-only layer ── */}
      <div className="print-only" aria-hidden="true">
        <div className="print-title-block">
          <h1 className="print-title">Attendance Roster</h1>
          <p className="print-subtitle">{totalCount} students &nbsp;·&nbsp; {printDepts.length} departments</p>
          <p className="print-date">
            Printed: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        {printDepts.map((dept) => {
          const students = mergedData[dept] ?? [];
          if (students.length === 0) return null;
          return (
            <div key={dept} className="print-dept-block">
              <div className="print-dept-header">
                <span className="print-dept-name">{dept}</span>
                <span className="print-dept-count">{students.length} student{students.length !== 1 ? "s" : ""}</span>
              </div>
              <ol className="print-student-list">
                {students.map((s, i) => (
                  <li key={s.matricNo + i} className="print-student-row">
                    <span className="print-student-num">{i + 1}.</span>
                    <span className="print-student-name">{toTitleCase(s.name)}</span>
                    <span className="print-student-matric">{s.matricNo}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
        <div className="print-footer">Total: {totalCount} students across {printDepts.length} departments</div>
      </div>

      {/* ── Screen UI ── */}
      <div className="no-print">
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Roster</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {filteredTotal} of {totalCount} students across {allDepts.length} departments
                  {pending.length > 0 && isAdmin && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">
                      {pending.length} pending
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="search"
                  placeholder="Search by name or matric no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-56 px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
                />

                {/* Add my name */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add My Name
                </button>

                {/* Print */}
                <button
                  onClick={() => window.print()}
                  title="Export full roster as PDF"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium shadow-sm hover:bg-slate-700 active:bg-slate-900 transition-colors whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Print / PDF
                </button>

                {/* Export Excel */}
                <button
                  onClick={() => exportToExcel(filtered, filteredTotal, activeDept)}
                  title={activeDept ? `Export ${activeDept} to Excel` : "Export all departments to Excel"}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium shadow-sm hover:bg-emerald-700 active:bg-emerald-800 transition-colors whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  Export Excel
                </button>

                {/* Admin */}
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAdminPanel(true)}
                      className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium shadow-sm hover:bg-amber-600 transition-colors whitespace-nowrap"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Admin
                      {pending.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {pending.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={logout}
                      className="px-2 py-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Sign out"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAdminLogin}
                    disabled={adminLoggingIn}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-600 text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors whitespace-nowrap disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
                    </svg>
                    {adminLoggingIn ? "Signing in…" : "Admin Login"}
                  </button>
                )}
              </div>
            </div>

            {/* Department filter pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => setActiveDept(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeDept === null ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {allDepts.map((dept) => {
                const colors = DEPT_COLORS[dept] ?? { badge: "bg-slate-100 text-slate-700" };
                const count = mergedData[dept]?.length ?? 0;
                return (
                  <button
                    key={dept}
                    onClick={() => setActiveDept(activeDept === dept ? null : dept)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeDept === dept
                        ? "ring-2 ring-offset-1 ring-slate-400 " + colors.badge
                        : colors.badge + " hover:opacity-80"
                    }`}
                  >
                    {dept} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {Object.keys(filtered).length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">Try a different name or matric number</p>
            </div>
          ) : (
            Object.entries(filtered).map(([dept, students]) => {
              const colors = DEPT_COLORS[dept] ?? { bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-100 text-slate-700", text: "text-slate-700" };
              return (
                <section key={dept} className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden shadow-sm`}>
                  <div className={`px-5 py-3 border-b ${colors.border} flex items-center justify-between`}>
                    <h2 className={`font-bold text-base ${colors.text}`}>{dept}</h2>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>
                      {students.length} student{students.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {students.map((student, idx) => (
                      <div
                        key={student.matricNo + idx}
                        className={`bg-white rounded-lg border shadow-sm px-3 py-2.5 hover:shadow-md transition-shadow relative ${
                          student.source === "dynamic" ? "border-blue-200 ring-1 ring-blue-100" : "border-white/80"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{toTitleCase(student.name)}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono tracking-tight">{student.matricNo}</p>
                        {student.source === "dynamic" && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-400" title="Recently added" />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </main>

        <footer className="text-center py-6 text-xs text-slate-400">
          Total attendance: {totalCount} students &nbsp;·&nbsp; {allDepts.length} departments
          {approved.length > 0 && (
            <span className="ml-2 text-blue-400">· {approved.length} added via roster</span>
          )}
        </footer>
      </div>

      {showAddModal && (
        <AddNameModal onClose={() => setShowAddModal(false)} onSubmit={addSubmission} />
      )}

      {showAdminPanel && isAdmin && (
        <AdminPanel
          pending={pending}
          approved={approved}
          onApprove={approveSubmission}
          onReject={rejectSubmission}
          onDelete={deleteSubmission}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </div>
  );
}
