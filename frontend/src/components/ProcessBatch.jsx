import React, { useState } from "react";

import { apiUrl } from "../api";

/**
 * ProcessBatch
 * Triggers batch face recognition and marks attendance via the backend.
 */
function ProcessBatch() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle batch processing request
  const handleProcess = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(apiUrl("/process/"), {
        method: "POST",
      });
      const data = await res.json();
      setMessage(data.info || data.error);
    } catch {
      setMessage("Batch processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 0 }}>
      <h3>Process Batch</h3>
      <button onClick={handleProcess} disabled={loading}>
        {loading ? "Processing..." : "Run Batch Processing"}
      </button>
      {message && (
        <div style={{ color: message.includes("failed") ? "red" : "green" }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default ProcessBatch;
