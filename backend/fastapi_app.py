import os
from pathlib import Path
import shutil
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from backend.database.attendance_db import init_db, get_attendance_records

DEFAULT_ALLOWED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"


def get_allowed_origins() -> list[str]:
    """Return CORS origins from the environment."""
    origins = os.getenv("FACETRACK_ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS)
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


def get_storage_path(env_name: str, default_path: str) -> Path:
    """Resolve a local storage directory from the environment."""
    return Path(os.getenv(env_name, default_path))


KNOWN_DIR = get_storage_path("FACETRACK_KNOWN_DIR", "data/known_faces")
BATCH_DIR = get_storage_path("FACETRACK_BATCH_DIR", "data/batch_images")

KNOWN_DIR.mkdir(parents=True, exist_ok=True)
BATCH_DIR.mkdir(parents=True, exist_ok=True)

init_db()

app = FastAPI(
    title="FaceTrack API",
    description="API for FaceTrack, a face-recognition attendance system.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def safe_upload_name(filename: Optional[str]) -> str:
    """Normalize an uploaded filename so it cannot escape the storage directory."""
    name = Path(filename or "").name
    if not name:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must have a filename.",
        )
    return name


def save_upload(file: UploadFile, destination_dir: Path) -> Path:
    """Persist an uploaded file to a configured local directory."""
    destination_dir.mkdir(parents=True, exist_ok=True)
    file_location = destination_dir / safe_upload_name(file.filename)
    with file_location.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_location


@app.get("/", tags=["Health"])
def read_root():
    """Health check endpoint."""
    return {"message": "FaceTrack FastAPI backend is running."}


@app.get("/health", tags=["Health"])
def health_check():
    """Structured health check endpoint for CI and monitoring."""
    return {"status": "ok"}


@app.post("/upload/known/", tags=["Upload"])
async def upload_known_face(file: UploadFile = File(...)):
    """
    Upload a known face image.
    """
    saved_path = save_upload(file, KNOWN_DIR)
    return {"info": f"Known face '{saved_path.name}' uploaded successfully."}


@app.post("/upload/batch/", tags=["Upload"])
async def upload_batch_image(file: UploadFile = File(...)):
    """
    Upload a batch image for attendance processing.
    """
    saved_path = save_upload(file, BATCH_DIR)
    return {"info": f"Batch image '{saved_path.name}' uploaded successfully."}


@app.post("/process/", tags=["Processing"])
def process_batch():
    """
    Trigger batch face recognition and mark attendance.
    """
    from src.batch_attendance import process_image_folder

    process_image_folder(BATCH_DIR, KNOWN_DIR)
    return {"info": "Batch processing complete. Attendance marked."}


@app.get("/attendance/", tags=["Attendance"])
def get_attendance():
    """
    Retrieve all attendance records.
    """
    records = get_attendance_records()
    return {
        "attendance": [
            {"name": name, "timestamp": timestamp}
            for name, timestamp in records
        ]
    }
