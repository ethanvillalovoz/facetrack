# Usage Guide

## Start The App

Start the backend:

```bash
conda create -n facetrack python=3.11
conda activate facetrack
pip install -r requirements.txt
uvicorn backend.fastapi_app:app --reload
```

Start the frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

## Register Known Faces

Use "Upload Known Face" to add clear, front-facing reference images. The backend stores them in `data/known_faces/` by default. File names are used as person labels, so use descriptive names such as `Ada_Lovelace.jpg`.

## Upload Batch Images

Use "Upload Batch Image" to upload attendance-session images. The backend stores them in `data/batch_images/` by default.

## Process Attendance

Click "Run Batch Processing" to compare batch images against the known-face set. Recognized names are stored in SQLite with timestamps.

## View Records

Click "View Attendance" to fetch records from `/attendance/`.

## Run Standalone Scripts

Batch processing:

```bash
python src/batch_attendance.py
```

Webcam demo:

```bash
python src/AttendanceProject.py
```

Press `q` to exit the webcam window.

## Data Handling

Do not commit real face images, generated attendance CSVs, or SQLite databases. Keep production or real-world biometric data outside the repository and process only images you have permission to use.
