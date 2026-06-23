# Contributing To FaceTrack

Thanks for your interest in improving FaceTrack.

## Development Setup

Backend:

```bash
conda create -n facetrack python=3.11
conda activate facetrack
pip install -r requirements.txt
uvicorn backend.fastapi_app:app --reload
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

## Checks

Run backend smoke tests:

```bash
pip install -r requirements-ci.txt
PYTHONPATH=. pytest backend/tests
```

Run frontend tests and build:

```bash
cd frontend
npm test
npm run build
```

## Pull Requests

- Keep changes focused and explain the user-facing impact.
- Update docs when setup, configuration, endpoints, or workflows change.
- Add or update tests for behavior changes when practical.
- Do not commit generated databases, attendance CSVs, private face images, API keys, or `.env` files.

## Privacy

FaceTrack can process biometric data. Only use images you have permission to process and avoid sharing private datasets in issues or pull requests.
