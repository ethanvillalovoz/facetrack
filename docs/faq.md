# FAQ

## Why does `face_recognition` fail to install?

`face_recognition` depends on `dlib`, which may need native build tools. On macOS, install Xcode command-line tools and CMake first. A Conda environment with Python 3.11 is usually the most predictable local setup.

## Why does CI use `requirements-ci.txt` instead of `requirements.txt`?

CI smoke-tests the FastAPI wiring without compiling native computer-vision libraries. The full recognition pipeline still uses `requirements.txt` locally.

## Why is no one recognized?

Use clear, front-facing images and make sure known-face filenames are meaningful. The system uses the known-face filename as the displayed attendance name.

## Where are records stored?

The API stores attendance records in SQLite at `backend/attendance.db` by default. Override this with `FACETRACK_DB_PATH`.

## Can I change where uploads are stored?

Yes. Set `FACETRACK_KNOWN_DIR` and `FACETRACK_BATCH_DIR`.

## Can I deploy this as-is?

This repository is a working full-stack prototype. A production deployment should add authentication, stricter CORS, private object storage, data retention rules, audit logging, and a consent-aware operating policy.
