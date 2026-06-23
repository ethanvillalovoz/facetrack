import React, { useState } from "react";

import { apiUrl } from "../api";

/**
 * UploadBatchImage
 * Allows the user to upload a batch image for attendance processing.
 * Shows a preview, handles loading state, and displays feedback.
 */
function UploadBatchImage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle file selection and preview
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
    setMessage("");
  };

  // Handle file upload to backend
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(apiUrl("/upload/batch/"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setMessage(data.info || data.error);
    } catch {
      setMessage("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 0 }}>
      <h3>Upload Batch Image</h3>
      <input type="file" onChange={handleFileChange} />
      {preview && (
        <div>
          <img
            src={preview}
            alt={file ? `Preview of ${file.name}` : "preview"}
            style={{ width: 100, margin: "1rem 0" }}
          />
        </div>
      )}
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>
      <div style={{ color: message.includes("failed") ? "red" : "green" }}>
        {message}
      </div>
    </div>
  );
}

export default UploadBatchImage;
