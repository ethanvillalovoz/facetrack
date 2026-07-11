import csv
import io
import logging
import os
import re
import threading
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image, ImageOps, UnidentifiedImageError

from backend.database.attendance_db import (
    add_roster_identity,
    clear_attendance_records,
    get_attendance_records,
    get_roster,
    init_db,
)
from src.recognition import RecognitionUnavailableError, process_image_folder

logger = logging.getLogger(__name__)
DEFAULT_ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_BYTES = int(os.getenv("FACETRACK_MAX_UPLOAD_BYTES", str(8 * 1024 * 1024)))
MAX_IMAGE_PIXELS = int(os.getenv("FACETRACK_MAX_IMAGE_PIXELS", "25000000"))
processing_lock = threading.Lock()


def get_allowed_origins() -> list[str]:
    origins = os.getenv("FACETRACK_ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS)
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


def get_storage_path(env_name: str, default_path: str) -> Path:
    return Path(os.getenv(env_name, default_path))


def get_known_dir() -> Path:
    return get_storage_path("FACETRACK_KNOWN_DIR", "data/known_faces")


def get_batch_dir() -> Path:
    return get_storage_path("FACETRACK_BATCH_DIR", "data/batch_images")


def should_delete_batch() -> bool:
    return os.getenv("FACETRACK_DELETE_BATCH_AFTER_PROCESS", "true").lower() != "false"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    get_known_dir().mkdir(parents=True, exist_ok=True)
    get_batch_dir().mkdir(parents=True, exist_ok=True)
    init_db()
    yield


app = FastAPI(
    title="FaceTrack API",
    description="Local, consent-aware face matching and attendance session API.",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


def normalize_label(raw_label: str) -> str:
    label = " ".join(raw_label.strip().split())
    if not 1 <= len(label) <= 80:
        raise HTTPException(status_code=422, detail="Label must contain 1-80 characters")
    if not re.fullmatch(r"[A-Za-z0-9 .'-]+", label):
        raise HTTPException(status_code=422, detail="Label contains unsupported characters")
    return label


def slugify_label(label: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
    return slug or "identity"


async def normalize_upload(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP image")

    payload = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the upload limit")

    try:
        with Image.open(io.BytesIO(payload)) as candidate:
            candidate.verify()
        with Image.open(io.BytesIO(payload)) as candidate:
            if candidate.width * candidate.height > MAX_IMAGE_PIXELS:
                raise HTTPException(status_code=413, detail="Image dimensions exceed the limit")
            normalized = ImageOps.exif_transpose(candidate).convert("RGB")
            normalized.thumbnail((4096, 4096))
            output = io.BytesIO()
            normalized.save(output, format="JPEG", quality=92, optimize=True)
            return output.getvalue()
    except HTTPException:
        raise
    except (Image.DecompressionBombError, UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=422,
            detail="The uploaded file is not a valid image",
        ) from exc


async def save_normalized_upload(file: UploadFile, destination: Path, stem: str) -> Path:
    destination.mkdir(parents=True, exist_ok=True)
    image_bytes = await normalize_upload(file)
    output_path = destination / f"{stem}--{uuid.uuid4().hex[:12]}.jpg"
    output_path.write_bytes(image_bytes)
    return output_path


@app.get("/", tags=["Health"])
def read_root():
    return {"name": "FaceTrack API", "docs": "/docs", "health": "/health"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


@app.get("/roster/", tags=["Roster"])
def list_roster():
    return {"roster": get_roster()}


@app.post("/upload/known/", tags=["Roster"])
async def upload_known_face(
    label: Annotated[str, Form()],
    file: Annotated[UploadFile, File()],
):
    normalized_label = normalize_label(label)
    existing_identity = next(
        (item for item in get_roster() if item["label"].casefold() == normalized_label.casefold()),
        None,
    )
    saved_path = await save_normalized_upload(
        file,
        get_known_dir(),
        slugify_label(normalized_label),
    )
    try:
        identity = add_roster_identity(normalized_label, saved_path.name)
    except Exception:
        saved_path.unlink(missing_ok=True)
        raise
    if existing_identity and existing_identity["filename"] != saved_path.name:
        (get_known_dir() / existing_identity["filename"]).unlink(missing_ok=True)
    return {"identity": identity}


@app.post("/upload/batch/", tags=["Session"])
async def upload_batch_image(file: Annotated[UploadFile, File()]):
    saved_path = await save_normalized_upload(file, get_batch_dir(), "session-frame")
    return {"frame": {"filename": saved_path.name}}


@app.post("/process/", tags=["Session"])
def process_batch():
    if not processing_lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="A recognition session is already running")

    batch_dir = get_batch_dir()
    try:
        summary = process_image_folder(
            input_folder=batch_dir,
            known_images_folder=get_known_dir(),
            roster=get_roster(),
        )
        return {"summary": summary}
    except RecognitionUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Recognition session failed")
        raise HTTPException(status_code=500, detail="Recognition session failed") from exc
    finally:
        if should_delete_batch():
            for image_path in batch_dir.glob("*"):
                if image_path.is_file() and image_path.name != ".gitkeep":
                    image_path.unlink(missing_ok=True)
        processing_lock.release()


@app.get("/attendance/", tags=["Attendance"])
def get_attendance():
    return {"attendance": get_attendance_records()}


@app.delete("/attendance/", tags=["Attendance"])
def clear_attendance():
    return {"deleted": clear_attendance_records()}


@app.get("/attendance/export/", tags=["Attendance"])
def export_attendance():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["name", "timestamp"])
    for record in get_attendance_records():
        writer.writerow([record["name"], record["timestamp"]])

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="facetrack-attendance.csv"'},
    )
