/**
 * App.js
 * Main entry point for the FaceTrack frontend.
 * Renders the layout and all main UI components.
 */

import React from "react";
import "./App.css";

// === Main UI Components ===
import UploadKnownFace from "./components/UploadKnownFace";
import UploadBatchImage from "./components/UploadBatchImage";
import ProcessBatch from "./components/ProcessBatch";
import DownloadAttendance from "./components/DownloadAttendance";

function App() {
  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <h1>FaceTrack</h1>
        <p className="subtitle">Smart Face Recognition Attendance System</p>
      </header>

      {/* Main Card Section */}
      <section className="card">
        <UploadKnownFace />
        <hr className="divider" />
        <UploadBatchImage />
        <hr className="divider" />
        <ProcessBatch />
        <hr className="divider" />
        <DownloadAttendance />
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} FaceTrack</p>
      </footer>
    </div>
  );
}

export default App;
