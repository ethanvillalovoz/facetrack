# FaceTrack Demo Strategy

FaceTrack is best presented as a reproducible local demo plus screenshots or a short walkthrough video. It should not advertise a public live demo unless the backend, frontend, storage policy, and biometric-data handling expectations are intentionally designed for public use.

## Current Public Demo

- README screenshot gallery:
  - `docs/screenshots/home_page.png`
  - `docs/screenshots/example.png`
- Local reproduction through the README quick start and usage guide.

## Why Not GitHub Pages

GitHub Pages only hosts static files. It cannot run:

- The FastAPI backend.
- OpenCV and `face_recognition` processing.
- Local image upload handling.
- SQLite attendance persistence.
- Privacy controls for biometric data.

For that reason, a GitHub Pages link would only show static frontend assets unless the backend and data-handling workflow were hosted elsewhere.

## Recommended Public Demo Format

The strongest next demo artifact would be a short GIF or video that uses consent-safe sample images and shows:

1. Opening the dashboard.
2. Uploading a known face image.
3. Uploading a batch attendance image.
4. Running the recognition process.
5. Viewing the resulting attendance table.

Keep the walkthrough around 30 to 60 seconds and avoid showing private or real attendance data.

## Local Reproduction Checklist

Before recording a walkthrough:

- Create and activate the backend Python environment.
- Install full local dependencies from `requirements.txt`.
- Start the backend with `uvicorn backend.fastapi_app:app --reload`.
- Install frontend dependencies.
- Configure `frontend/.env` with the local API URL.
- Start the frontend with `npm start`.
- Use only consent-safe sample images.
- Remove generated databases, CSV logs, and uploaded private images before committing.

## If A Hosted Demo Is Added Later

A real public live demo should only be linked after:

- The backend is deployed and health-checked.
- Upload handling and storage retention are documented.
- Authentication or access control is added if the app accepts user images.
- Demo data is synthetic or consent-safe.
- The README clearly labels the hosted demo as maintained.
