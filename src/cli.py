import argparse
import json

from backend.database.attendance_db import get_roster, init_db
from src.recognition import process_image_folder


def main() -> None:
    parser = argparse.ArgumentParser(description="Run one local FaceTrack recognition session.")
    parser.add_argument("--known", default="data/known_faces", help="Reference image directory")
    parser.add_argument("--batch", default="data/batch_images", help="Session frame directory")
    parser.add_argument("--threshold", type=float, default=0.48, help="Maximum face distance")
    args = parser.parse_args()

    init_db()
    summary = process_image_folder(
        input_folder=args.batch,
        known_images_folder=args.known,
        roster=get_roster(),
        distance_threshold=args.threshold,
    )
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
