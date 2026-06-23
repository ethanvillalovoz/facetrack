import importlib
import sys

from fastapi.testclient import TestClient


def build_client(tmp_path, monkeypatch):
    monkeypatch.setenv("FACETRACK_KNOWN_DIR", str(tmp_path / "known_faces"))
    monkeypatch.setenv("FACETRACK_BATCH_DIR", str(tmp_path / "batch_images"))
    monkeypatch.setenv("FACETRACK_DB_PATH", str(tmp_path / "attendance.db"))

    for module_name in ["backend.fastapi_app", "backend.database.attendance_db"]:
        sys.modules.pop(module_name, None)

    fastapi_app = importlib.import_module("backend.fastapi_app")
    return TestClient(fastapi_app.app)


def test_health_endpoints(tmp_path, monkeypatch):
    client = build_client(tmp_path, monkeypatch)

    assert client.get("/").json() == {
        "message": "FaceTrack FastAPI backend is running."
    }
    assert client.get("/health").json() == {"status": "ok"}


def test_upload_and_empty_attendance(tmp_path, monkeypatch):
    client = build_client(tmp_path, monkeypatch)

    response = client.post(
        "/upload/known/",
        files={"file": ("person.jpg", b"image-bytes", "image/jpeg")},
    )

    assert response.status_code == 200
    assert response.json() == {"info": "Known face 'person.jpg' uploaded successfully."}
    assert (tmp_path / "known_faces" / "person.jpg").read_bytes() == b"image-bytes"
    assert client.get("/attendance/").json() == {"attendance": []}


def test_upload_filename_is_sanitized(tmp_path, monkeypatch):
    client = build_client(tmp_path, monkeypatch)

    response = client.post(
        "/upload/batch/",
        files={"file": ("../escape.jpg", b"image-bytes", "image/jpeg")},
    )

    assert response.status_code == 200
    assert response.json() == {"info": "Batch image 'escape.jpg' uploaded successfully."}
    assert (tmp_path / "batch_images" / "escape.jpg").exists()
    assert not (tmp_path / "escape.jpg").exists()
