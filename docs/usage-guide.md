# Usage Guide

## Synthetic UI Demo

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The default mode requires no backend or images.

## Native Local Runtime

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.fastapi_app:app --reload
```

Then configure and start the frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Enroll A Reference

Open Roster, provide a display label, and choose one clear reference image. Uploading the same label again replaces the prior file. Images are validated, reoriented, stripped of metadata, and normalized to JPEG.

## Run A Session

1. Open Session and stage one or more consented frames.
2. Run recognition.
3. Review match and unknown counts.
4. Open Attendance to inspect or export the daily ledger.

By default, every staged frame is deleted after the attempt, including failed processing.

## Command Line

With references and session frames already staged:

```bash
python -m src.cli --known data/known_faces --batch data/batch_images --threshold 0.48
```

## Reset Local State

Stop the API, then remove `backend/attendance.db`, `data/known_faces/`, and `data/batch_images/`. These paths are ignored by git.
