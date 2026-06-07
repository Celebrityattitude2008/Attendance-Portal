import * as XLSX from "xlsx";

interface Student {
  matricNo: string;
  name: string;
  source?: "static" | "dynamic";
}

export function exportToExcel(
  filtered: Record<string, Student[]>,
  totalCount: number,
  activeDept: string | null
) {
  const wb = XLSX.utils.book_new();

  const allDepts = Object.keys(filtered);

  if (activeDept && allDepts.length === 1) {
    // Single department sheet
    const dept = allDepts[0];
    const students = filtered[dept];
    const rows = students.map((s, i) => ({
      "S/N": i + 1,
      "Full Name": titleCase(s.name),
      "Matric Number": s.matricNo,
      Department: dept,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    setColWidths(ws, [6, 40, 22, 26]);
    XLSX.utils.book_append_sheet(wb, ws, dept.slice(0, 31));
  } else {
    // Summary sheet: all students across departments
    const summaryRows: { "S/N": number; "Full Name": string; "Matric Number": string; Department: string }[] = [];
    let sn = 1;
    for (const dept of allDepts) {
      for (const s of filtered[dept]) {
        summaryRows.push({
          "S/N": sn++,
          "Full Name": titleCase(s.name),
          "Matric Number": s.matricNo,
          Department: dept,
        });
      }
    }
    const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
    setColWidths(summaryWs, [6, 40, 22, 26]);
    XLSX.utils.book_append_sheet(wb, summaryWs, "All Students");

    // One sheet per department
    for (const dept of allDepts) {
      const students = filtered[dept];
      const rows = students.map((s, i) => ({
        "S/N": i + 1,
        "Full Name": titleCase(s.name),
        "Matric Number": s.matricNo,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      setColWidths(ws, [6, 40, 22]);
      XLSX.utils.book_append_sheet(wb, ws, dept.slice(0, 31));
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  const fileName = activeDept
    ? `Attendance_${activeDept.replace(/\s+/g, "_")}_${date}.xlsx`
    : `Attendance_Roster_${date}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

function titleCase(str: string) {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
}
