from pathlib import Path

from src import recognition


class FakeVision:
    @staticmethod
    def load_image_file(path):
        return Path(path).name

    @staticmethod
    def face_locations(image):
        if image.startswith("session"):
            return [(0, 10, 10, 0), (0, 20, 10, 10)]
        return [(0, 10, 10, 0)]

    @staticmethod
    def face_encodings(image, _locations=None):
        if image.startswith("reference"):
            return [[0.1]]
        if image.startswith("session"):
            return [[0.25], [0.9]]
        return []

    @staticmethod
    def face_distance(_references, encoding):
        return [0.28 if encoding == [0.25] else 0.72]


class FakeNumpy:
    @staticmethod
    def argmin(_distances):
        return 0


def test_recognition_summary_keeps_above_threshold_faces_unknown(tmp_path, monkeypatch):
    known_dir = tmp_path / "known"
    batch_dir = tmp_path / "batch"
    known_dir.mkdir()
    batch_dir.mkdir()
    (known_dir / "reference.jpg").touch()
    (batch_dir / "session.jpg").touch()

    marked = []
    monkeypatch.setattr(recognition, "_load_vision_dependencies", lambda: (FakeVision, FakeNumpy))
    monkeypatch.setattr(recognition, "mark_attendance", lambda label: marked.append(label) or True)

    summary = recognition.process_image_folder(
        input_folder=batch_dir,
        known_images_folder=known_dir,
        roster=[{"filename": "reference.jpg", "label": "Ava Chen"}],
    )

    assert summary["frames_processed"] == 1
    assert summary["faces_detected"] == 2
    assert summary["attendance_marked"] == 1
    assert summary["unknown_faces"] == 1
    assert summary["matches"][0]["name"] == "Ava Chen"
    assert summary["matches"][0]["distance"] == 0.28
    assert marked == ["Ava Chen"]


def test_recognition_requires_a_valid_reference(tmp_path, monkeypatch):
    known_dir = tmp_path / "known"
    batch_dir = tmp_path / "batch"
    known_dir.mkdir()
    batch_dir.mkdir()

    monkeypatch.setattr(recognition, "_load_vision_dependencies", lambda: (FakeVision, FakeNumpy))

    try:
        recognition.process_image_folder(batch_dir, known_dir, roster=[])
    except ValueError as error:
        assert "reference image" in str(error)
    else:
        raise AssertionError("Expected an empty roster to be rejected")
