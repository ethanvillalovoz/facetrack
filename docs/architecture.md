# Architecture

FaceTrack is organized as a small full-stack application with a separate computer-vision processing layer.

## Components

### React Frontend

The frontend lives in `frontend/` and provides the user-facing workflow:

- Upload a known face image
- Upload a batch image
- Trigger batch processing
- Fetch and display attendance records

The frontend reads `VITE_API_BASE_URL` and defaults to `http://127.0.0.1:8000`.

### FastAPI Backend

The backend lives in `backend/` and exposes upload, processing, health, and attendance endpoints. Uploaded files are written to configured local directories:

- `FACETRACK_KNOWN_DIR`
- `FACETRACK_BATCH_DIR`

Attendance records are stored in SQLite through `backend/database/attendance_db.py`.

### Recognition Pipeline

The recognition pipeline lives in `src/`:

- `AttendanceProject.py` contains shared image-loading, encoding, and webcam attendance logic.
- `batch_attendance.py` loads known faces, scans batch images, compares encodings, and marks recognized people.
- `basics.py` and `sample_lfw_images.py` are standalone demos/utilities.

The heavy computer-vision dependencies are imported only when the recognition path is executed, which keeps health checks and API smoke tests fast.

## Data Flow

1. A user uploads known faces through the frontend.
2. The backend stores those files in `data/known_faces/` by default.
3. A user uploads attendance-session images.
4. The backend stores those files in `data/batch_images/` by default.
5. The user triggers `/process/`.
6. The recognition pipeline computes face encodings, compares them against known faces, and writes matches to SQLite.
7. The frontend fetches `/attendance/` and displays the stored records.

## Runtime Data

Runtime databases, generated CSV logs, and local uploads should not be committed. The repository includes sample/demo images, but real biometric data should stay local and should only be processed with consent.
