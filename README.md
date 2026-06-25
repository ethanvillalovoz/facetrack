# FaceTrack

[![CI](https://github.com/ethanvillalovoz/facetrack/actions/workflows/ci.yml/badge.svg)](https://github.com/ethanvillalovoz/facetrack/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-API-009688.svg)](https://fastapi.tiangolo.com/)

FaceTrack is a full-stack face-recognition attendance system. It combines a React dashboard, a FastAPI backend, SQLite persistence, and OpenCV/`face_recognition` batch processing so users can register known faces, upload attendance-session images, process matches, and view attendance records.

![FaceTrack dashboard](docs/screenshots/home_page.png)

## Features

- Register known faces through image uploads
- Upload batch attendance-session images
- Run face-recognition processing against known faces
- Store attendance records in SQLite
- View attendance records from the React dashboard
- Run standalone Python demos for webcam and batch workflows

## Tech Stack

- Frontend: React, Vite, CSS
- Backend: FastAPI, Uvicorn, SQLite
- Computer vision: OpenCV, `face_recognition`, NumPy
- Tooling: GitHub Actions, pytest, React Testing Library

## Screenshots

![FaceTrack example workflow](docs/screenshots/example.png)

## Demo Availability

FaceTrack is not currently published as a public live app because it depends on a running FastAPI backend, local image uploads, SQLite persistence, and responsible handling of biometric data. The README screenshots are the public demo surface for now.

See [Demo strategy](docs/demo-strategy.md) for the recommended walkthrough format and the requirements for adding a maintained hosted demo later.

## Prerequisites

- Python 3.10+
- Node.js 20+
- macOS or Linux recommended for `face_recognition`/`dlib` installation
- A webcam only if running the standalone webcam demo

The `face_recognition` package depends on `dlib`, which may require native build tools. On macOS, installing CMake and Xcode command-line tools first is often necessary.

## Quick Start

Clone the repository:

```bash
git clone https://github.com/ethanvillalovoz/facetrack.git
cd facetrack
```

Set up the backend:

```bash
conda create -n facetrack python=3.11
conda activate facetrack
pip install -r requirements.txt
uvicorn backend.fastapi_app:app --reload
```

Set up the frontend in a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

The frontend runs at `http://localhost:3000` and the backend runs at `http://localhost:8000`.

## Configuration

Backend configuration is read from environment variables:

```bash
FACETRACK_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
FACETRACK_KNOWN_DIR=data/known_faces
FACETRACK_BATCH_DIR=data/batch_images
FACETRACK_DB_PATH=backend/attendance.db
```

Frontend configuration lives in `frontend/.env`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## API Overview

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/` | GET | Basic API health check |
| `/health` | GET | Structured health check for CI and monitoring |
| `/upload/known/` | POST | Upload a known face image |
| `/upload/batch/` | POST | Upload a batch image for processing |
| `/process/` | POST | Run batch face recognition and mark attendance |
| `/attendance/` | GET | Retrieve attendance records |

FastAPI's interactive docs are available at `http://localhost:8000/docs` when the backend is running.

## Development

Run frontend checks:

```bash
cd frontend
npm test
npm run build
```

Run backend smoke tests:

```bash
pip install -r requirements-ci.txt
PYTHONPATH=. pytest backend/tests
```

`requirements-ci.txt` intentionally avoids native computer-vision dependencies so CI can verify API wiring without compiling `dlib`. Use `requirements.txt` for the full local recognition pipeline.

## Project Structure

```text
facetrack/
├── backend/
│   ├── database/
│   │   └── attendance_db.py
│   └── fastapi_app.py
├── data/
│   ├── batch_images/
│   ├── image_attendance_data/
│   ├── image_basics_data/
│   └── known_faces/
├── docs/
│   ├── architecture.md
│   ├── faq.md
│   ├── usage-guide.md
│   └── screenshots/
├── frontend/
│   ├── public/
│   └── src/
├── src/
│   ├── AttendanceProject.py
│   ├── basics.py
│   ├── batch_attendance.py
│   └── sample_lfw_images.py
├── requirements.txt
└── requirements-ci.txt
```

## Privacy And Data

Face recognition systems handle biometric data. Use FaceTrack only with images you have permission to process, and do not commit real attendance databases, generated CSV logs, or private face images. Runtime databases and local attendance output are ignored by git.

## Documentation

- [Architecture](docs/architecture.md)
- [Usage guide](docs/usage-guide.md)
- [Demo strategy](docs/demo-strategy.md)
- [FAQ](docs/faq.md)

## Roadmap

- [x] React dashboard for uploads and attendance viewing
- [x] FastAPI upload and attendance endpoints
- [x] Batch image processing pipeline
- [x] SQLite-backed attendance records
- [ ] Authentication and role-based access
- [ ] Admin roster management
- [ ] Docker Compose development environment
- [ ] Production deployment guide

## License

This project is released under the [MIT License](LICENSE).
