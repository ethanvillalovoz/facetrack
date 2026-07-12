# Contributing To FaceTrack

Thanks for your interest in improving FaceTrack.

## Development Setup

Backend:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.fastapi_app:app --reload
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Checks

Run backend smoke tests:

```bash
pip install -r requirements-ci.txt
ruff check backend src
pytest -q
```

Run frontend tests and build:

```bash
cd frontend
npm run check
```

## Pull Requests

- Keep changes focused and explain the user-facing impact.
- Update docs when setup, configuration, endpoints, or workflows change.
- Add or update tests for behavior changes when practical.
- Do not commit generated databases, attendance CSVs, private face images, API keys, or `.env` files.

## Privacy

FaceTrack can process biometric data. Only use images you have permission to process and avoid sharing private datasets in issues or pull requests.
