import importlib
import io
import sys
from contextlib import contextmanager

import pytest
from PIL import Image
from starlette.testclient import TestClient


def make_image() -> bytes:
    output = io.BytesIO()
    Image.new("RGB", (32, 32), color=(126, 142, 134)).save(output, format="PNG")
    return output.getvalue()


@contextmanager
def build_client(tmp_path, monkeypatch, max_upload_bytes=None):
    monkeypatch.setenv("FACETRACK_KNOWN_DIR", str(tmp_path / "known_faces"))
    monkeypatch.setenv("FACETRACK_BATCH_DIR", str(tmp_path / "batch_images"))
    monkeypatch.setenv("FACETRACK_DB_PATH", str(tmp_path / "attendance.db"))
    if max_upload_bytes is not None:
        monkeypatch.setenv("FACETRACK_MAX_UPLOAD_BYTES", str(max_upload_bytes))

    for module_name in [
        "backend.fastapi_app",
        "src.recognition",
        "backend.database.attendance_db",
    ]:
        sys.modules.pop(module_name, None)

    fastapi_app = importlib.import_module("backend.fastapi_app")
    with TestClient(fastapi_app.app) as client:
        yield client, fastapi_app


def test_health_endpoints(tmp_path, monkeypatch):
    with build_client(tmp_path, monkeypatch) as (client, _app):
        assert client.get("/").json() == {
            "name": "FaceTrack API",
            "docs": "/docs",
            "health": "/health",
        }
        assert client.get("/health").json() == {"status": "ok"}


def test_known_image_is_normalized_and_added_to_roster(tmp_path, monkeypatch):
    with build_client(tmp_path, monkeypatch) as (client, _app):
        response = client.post(
            "/upload/known/",
            data={"label": "Ava Chen"},
            files={"file": ("portrait.png", make_image(), "image/png")},
        )

        assert response.status_code == 200
        identity = response.json()["identity"]
        assert identity["label"] == "Ava Chen"
        assert identity["filename"].startswith("ava-chen--")
        saved_path = tmp_path / "known_faces" / identity["filename"]
        assert saved_path.exists()
        assert Image.open(saved_path).format == "JPEG"
        assert client.get("/roster/").json()["roster"][0]["label"] == "Ava Chen"


def test_replacing_identity_removes_stale_reference(tmp_path, monkeypatch):
    with build_client(tmp_path, monkeypatch) as (client, _app):
        upload = {
            "data": {"label": "Ava Chen"},
            "files": {"file": ("portrait.png", make_image(), "image/png")},
        }
        first = client.post("/upload/known/", **upload).json()["identity"]
        second = client.post("/upload/known/", **upload).json()["identity"]

        assert first["filename"] != second["filename"]
        references = list((tmp_path / "known_faces").glob("*.jpg"))
        assert [item.name for item in references] == [second["filename"]]


@pytest.mark.parametrize(
    ("label", "status_code"),
    [("", 422), ("Ava <script>", 422)],
)
def test_invalid_roster_labels_are_rejected(tmp_path, monkeypatch, label, status_code):
    with build_client(tmp_path, monkeypatch) as (client, _app):
        response = client.post(
            "/upload/known/",
            data={"label": label},
            files={"file": ("portrait.png", make_image(), "image/png")},
        )
        assert response.status_code == status_code


def test_non_image_and_oversized_uploads_are_rejected(tmp_path, monkeypatch):
    with build_client(tmp_path, monkeypatch, max_upload_bytes=32) as (client, _app):
        wrong_type = client.post(
            "/upload/batch/",
            files={"file": ("notes.txt", b"not an image", "text/plain")},
        )
        oversized = client.post(
            "/upload/batch/",
            files={"file": ("frame.png", make_image(), "image/png")},
        )

        assert wrong_type.status_code == 415
        assert oversized.status_code == 413


def test_processing_returns_summary_and_deletes_session_frames(tmp_path, monkeypatch):
    with build_client(tmp_path, monkeypatch) as (client, app_module):
        upload = client.post(
            "/upload/batch/",
            files={"file": ("frame.png", make_image(), "image/png")},
        )
        assert upload.status_code == 200

        expected_summary = {
            "frames_processed": 1,
            "faces_detected": 3,
            "matches": [{"name": "Ava Chen", "distance": 0.29}],
            "unknown_faces": 1,
            "attendance_marked": 1,
            "distance_threshold": 0.48,
        }
        monkeypatch.setattr(
            app_module,
            "process_image_folder",
            lambda **_kwargs: expected_summary,
        )

        response = client.post("/process/")

        assert response.status_code == 200
        assert response.json() == {"summary": expected_summary}
        assert list((tmp_path / "batch_images").glob("*.jpg")) == []


def test_attendance_can_be_read_exported_and_cleared(tmp_path, monkeypatch):
    with build_client(tmp_path, monkeypatch) as (client, _app):
        database = importlib.import_module("backend.database.attendance_db")
        assert database.mark_attendance("Ava Chen") is True
        assert database.mark_attendance("Ava Chen") is False

        response = client.get("/attendance/")
        assert response.status_code == 200
        assert response.json()["attendance"][0]["name"] == "Ava Chen"

        export = client.get("/attendance/export/")
        assert export.status_code == 200
        assert export.headers["content-type"].startswith("text/csv")
        assert "Ava Chen" in export.text

        cleared = client.delete("/attendance/")
        assert cleared.json() == {"deleted": 1}
        assert client.get("/attendance/").json() == {"attendance": []}
