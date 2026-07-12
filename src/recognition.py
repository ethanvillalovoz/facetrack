from pathlib import Path

from backend.database.attendance_db import mark_attendance


class RecognitionUnavailableError(RuntimeError):
    """Raised when optional native recognition dependencies are unavailable."""


def _load_vision_dependencies():
    try:
        import face_recognition
        import numpy as np
    except ImportError as exc:
        raise RecognitionUnavailableError(
            "Recognition dependencies are not installed on this server"
        ) from exc
    return face_recognition, np


def _load_reference_encodings(known_dir: Path, roster: list[dict]):
    face_recognition, _ = _load_vision_dependencies()
    labels_by_filename = {item["filename"]: item["label"] for item in roster}
    references = []

    for image_path in sorted(known_dir.glob("*.jpg")):
        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)
        if encodings:
            references.append(
                {
                    "label": labels_by_filename.get(image_path.name, image_path.stem),
                    "encoding": encodings[0],
                }
            )
    return references


def process_image_folder(
    input_folder: str | Path,
    known_images_folder: str | Path,
    roster: list[dict],
    distance_threshold: float = 0.48,
) -> dict:
    face_recognition, np = _load_vision_dependencies()
    input_dir = Path(input_folder)
    known_dir = Path(known_images_folder)
    references = _load_reference_encodings(known_dir, roster)

    if not references:
        raise ValueError("Add at least one reference image with a detectable face")

    reference_encodings = [item["encoding"] for item in references]
    frames = sorted(input_dir.glob("*.jpg"))
    if not frames:
        raise ValueError("Upload at least one session frame before processing")

    matches = []
    faces_detected = 0
    unknown_faces = 0
    attendance_marked = 0

    for frame_path in frames:
        image = face_recognition.load_image_file(frame_path)
        locations = face_recognition.face_locations(image)
        encodings = face_recognition.face_encodings(image, locations)
        faces_detected += len(encodings)

        for encoding in encodings:
            distances = face_recognition.face_distance(reference_encodings, encoding)
            best_index = int(np.argmin(distances))
            distance = float(distances[best_index])
            if distance > distance_threshold:
                unknown_faces += 1
                continue

            label = references[best_index]["label"]
            inserted = mark_attendance(label)
            attendance_marked += int(inserted)
            matches.append(
                {
                    "name": label,
                    "frame": frame_path.name,
                    "distance": round(distance, 4),
                }
            )

    return {
        "frames_processed": len(frames),
        "faces_detected": faces_detected,
        "matches": matches,
        "unknown_faces": unknown_faces,
        "attendance_marked": attendance_marked,
        "distance_threshold": distance_threshold,
    }
