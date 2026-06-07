import { useState, useMemo } from "react";
import { attendanceData, DEPARTMENT_ORDER } from "./data/attendance";

const DEPT_COLORS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  "Agric":              { bg: "bg-emerald-50",  border: "border-emerald-200",  badge: "bg-emerald-100 text-emerald-800",  text: "text-emerald-700" },
  "Anatomy":            { bg: "bg-purple-50",   border: "border-purple-200",   badge: "bg-purple-100 text-purple-800",    text: "text-purple-700" },
  "Bio Chemistry":      { bg: "bg-amber-50",    border: "border-amber-200",    badge: "bg-amber-100 text-amber-800",      text: "text-amber-700" },
  "Computer Science":   { bg: "bg-blue-50",     border: "border-blue-200",     badge: "bg-blue-100 text-blue-800",        text: "text-blue-700" },
  "Engineering":        { bg: "bg-orange-50",   border: "border-orange-200",   badge: "bg-orange-100 text-orange-800",    text: "text-orange-700" },
  "Geo Physics":        { bg: "bg-teal-50",     border: "border-teal-200",     badge: "bg-teal-100 text-teal-800",        text: "text-teal-700" },
  "Med Lab":            { bg: "bg-rose-50",     border: "border-rose-200",     badge: "bg-rose-100 text-rose-800",        text: "text-rose-700" },
  "Medicine and Surgery":{ bg: "bg-red-50",     border: "border-red-200",      badge: "bg-red-100 text-red-800",          text: "text-red-700" },
  "Micro Biology":      { bg: "bg-lime-50",     border: "border-lime-200",     badge: "bg-lime-100 text-lime-800",        text: "text-lime-700" },
  "Nursing":            { bg: "bg-pink-50",     border: "border-pink-200",     badge: "bg-pink-100 text-pink-800",        text: "text-pink-700" },
  "Physiology":         { bg: "bg-indigo-50",   border: "border-indigo-200",   badge: "bg-indigo-100 text-indigo-800",    text: "text-indigo-700" },
};

function toTitleCase(str: string) {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function App() {
  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState<string | null>(null);

  const totalCount = useMemo(() =>
    DEPARTMENT_ORDER.reduce((sum, d) => sum + (attendanceData[d]?.length ?? 0), 0),
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DEPARTMENT_ORDER.reduce<Record<string, typeof attendanceData[string]>>((acc, dept) => {
      if (activeDept && activeDept !== dept) return acc;
      const students = (attendanceData[dept] ?? []).filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.matricNo.toLowerCase().includes(q)
      );
      if (students.length > 0) acc[dept] = students;
      return acc;
    }, {});
  }, [search, activeDept]);

  const filteredTotal = useMemo(
    () => Object.values(filtered).reduce((sum, arr) => sum + arr.length, 0),
    [filtered]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Attendance Roster
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {filteredTotal} of {totalCount} students across {DEPARTMENT_ORDER.length} departments
              </p>
            </div>
            <input
              type="search"
              placeholder="Search by name or matric no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 px-4 py-2 rounded-lg border border-slate-300 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>

          {/* Department filter pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setActiveDept(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeDept === null
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            {DEPARTMENT_ORDER.map((dept) => {
              const colors = DEPT_COLORS[dept] ?? { badge: "bg-slate-100 text-slate-700" };
              const count = attendanceData[dept]?.length ?? 0;
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

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {Object.keys(filtered).length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm mt-1">Try a different name or matric number</p>
          </div>
        ) : (
          Object.entries(filtered).map(([dept, students]) => {
            const colors = DEPT_COLORS[dept] ?? {
              bg: "bg-slate-50",
              border: "border-slate-200",
              badge: "bg-slate-100 text-slate-700",
              text: "text-slate-700",
            };

            return (
              <section
                key={dept}
                className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden shadow-sm`}
              >
                {/* Department header */}
                <div className={`px-5 py-3 border-b ${colors.border} flex items-center justify-between`}>
                  <h2 className={`font-bold text-base ${colors.text}`}>{dept}</h2>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>
                    {students.length} student{students.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Student grid */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {students.map((student, idx) => (
                    <div
                      key={student.matricNo + idx}
                      className="bg-white rounded-lg border border-white/80 shadow-sm px-3 py-2.5 hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-semibold text-slate-800 leading-tight">
                        {toTitleCase(student.name)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono tracking-tight">
                        {student.matricNo}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-400">
        Total attendance: {totalCount} students &nbsp;·&nbsp; {DEPARTMENT_ORDER.length} departments
      </footer>
    </div>
  );
}
