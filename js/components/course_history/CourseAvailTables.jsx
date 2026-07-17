// src/pages/CourseAvailTables.jsx
import React, { useEffect, useState } from "react";
import { fetchCsvRows } from "../common/CSVParser";
import { NavBar } from "../common/NavBar.js.jsx"; // adjust path if needed

export default function CourseAvailTables() {
  const [byCourse, setByCourse] = useState([]);
  const [byTerm, setByTerm] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const a = await fetchCsvRows("/static/data/Courses_Avail.csv");
        const p = await fetchCsvRows("/static/data/Courses_Avail_Pivot.csv");

        // drop the index column if present
        const clean = rows =>
          rows.map(({ ["Unnamed: 0"]: _idx, ...rest }) => rest);

        setByCourse(clean(a));
        setByTerm(clean(p));
      } catch (e) {
        setErr(String(e));
      }
    })();
  }, []);

  if (err) {
    return (
      <>
        <NavBar selected_page="course_avail" open_modal={() => {}} />
        <div style={{ padding: 16 }}>Error loading CSVs: {err}</div>
      </>
    );
  }

  return (
    <>
      <NavBar selected_page="course_avail" open_modal={() => {}} />
      <div style={{ padding: 16 }}>
        <h2>Course → Terms</h2>
        <table>
          <thead>
            <tr><th>course</th><th>terms</th></tr>
          </thead>
          <tbody>
            {byCourse.map((r, i) => (
              <tr key={`${r.course}-${i}`}>
                <td>{r.course}</td>
                <td>{r.terms}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 style={{ marginTop: 24 }}>Term → Courses (pivoted)</h2>
        <table>
          <thead>
            <tr><th>term</th><th>courses</th></tr>
          </thead>
          <tbody>
            {byTerm.map((r, i) => (
              <tr key={`${r.term}-${i}`}>
                <td>{r.term}</td>
                <td>{r.courses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}