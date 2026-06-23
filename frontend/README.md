# FaceTrack Frontend

React dashboard for the FaceTrack attendance workflow.

## Setup

```bash
npm install
cp .env.example .env
npm start
```

The app runs at `http://localhost:3000`.

## Configuration

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Available Commands

```bash
npm start
npm test
npm run build
```

## Main Components

- `UploadKnownFace`: uploads reference images for known people
- `UploadBatchImage`: uploads attendance-session images
- `ProcessBatch`: triggers backend recognition processing
- `DownloadAttendance`: fetches and displays attendance records
