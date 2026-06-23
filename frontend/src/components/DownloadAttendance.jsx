import React, { useState } from "react";

import { apiUrl } from "../api";

/**
 * DownloadAttendance
 * Fetches and displays attendance records from the backend.
 */
function DownloadAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch attendance records from the backend API
  const fetchAttendance = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/attendance/"));
      if (!res.ok) throw new Error("Failed to fetch attendance.");
      const data = await res.json();
      setAttendance(data.attendance || []);
    } catch {
      setError("Could not load attendance records.");
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 0 }}>
      <h3>Attendance Records</h3>
      <button onClick={fetchAttendance} disabled={loading}>
        {loading ? "Loading..." : "View Attendance"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <ul>
        {attendance.length === 0 && !loading && !error && (
          <li>No attendance records found.</li>
        )}
        {attendance.map((record, idx) => (
          <li key={idx}>
            <strong>{record.name}</strong> &mdash; <span>{record.timestamp}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DownloadAttendance;
