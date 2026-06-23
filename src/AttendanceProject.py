"""
AttendanceProject.py
Core logic for loading images, encoding faces, and marking attendance using face recognition.
Can be run as a script for webcam-based attendance.
"""

from datetime import datetime
import os
from pathlib import Path
import cv2
import numpy as np
import face_recognition
from typing import List, Tuple

# === Constants ===
DEFAULT_ATTENDANCE_FILE = "data/Attendance.csv"


def load_images_from_folder(folder_path: str) -> Tuple[List[np.ndarray], List[str]]:
    """
    Loads images and class names from the specified folder.
    Args:
        folder_path (str): Path to the folder containing images.
    Returns:
        Tuple[List[np.ndarray], List[str]]: List of images and corresponding class names.
    """
    images = []
    class_names = []
    file_list = os.listdir(folder_path)
    print("Files found:", file_list)
    for filename in file_list:
        img = cv2.imread(os.path.join(folder_path, filename))
        if img is not None:
            images.append(img)
            class_names.append(os.path.splitext(filename)[0])
    print("Class names:", class_names)
    return images, class_names


def find_encodings(images: List[np.ndarray]) -> List[np.ndarray]:
    """
    Finds face encodings for a list of images.
    Args:
        images (List[np.ndarray]): List of images.
    Returns:
        List[np.ndarray]: List of face encodings.
    """
    encode_list = []
    for img in images:
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        encodings = face_recognition.face_encodings(img_rgb)
        if encodings:
            encode_list.append(encodings[0])
    return encode_list


def mark_attendance(name: str, attendance_file: str = DEFAULT_ATTENDANCE_FILE) -> None:
    """
    Marks attendance for the given name if not already present.
    Args:
        name (str): Name to mark attendance for.
        attendance_file (str): Path to the attendance CSV file.
    """
    csv_path = Path(attendance_file)
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    if not csv_path.exists():
        csv_path.write_text("Name,Time\n")

    with csv_path.open("r+") as f:
        lines = f.readlines()
        name_list = [line.split(",")[0] for line in lines]
        if name not in name_list:
            now = datetime.now()
            dt_string = now.strftime("%H:%M:%S")
            f.writelines(f"\n{name},{dt_string}")


def main():
    """
    Main function for webcam-based face attendance.
    Loads known faces, starts webcam, and marks attendance for recognized faces.
    """
    path = "data/image_attendance_data"
    images, class_names = load_images_from_folder(path)
    encode_list_known = find_encodings(images)
    print("Encoding Complete")

    cap = cv2.VideoCapture(0)
    while True:
        success, img = cap.read()
        if not success or img is None:
            print("Failed to read from webcam. Exiting.")
            break

        img_small = cv2.resize(img, (0, 0), None, 0.25, 0.25)
        img_small_rgb = cv2.cvtColor(img_small, cv2.COLOR_BGR2RGB)

        faces_cur_frame = face_recognition.face_locations(img_small_rgb)
        encodes_cur_frame = face_recognition.face_encodings(img_small_rgb, faces_cur_frame)

        for encode_face, face_loc in zip(encodes_cur_frame, faces_cur_frame):
            matches = face_recognition.compare_faces(encode_list_known, encode_face)
            face_dis = face_recognition.face_distance(encode_list_known, encode_face)
            match_index = np.argmin(face_dis) if face_dis.size > 0 else None

            if match_index is not None and matches[match_index]:
                name = class_names[match_index].upper()
                y1, x2, y2, x1 = face_loc
                # Scale back up face locations since the frame we detected in was scaled to 1/4 size
                y1, x2, y2, x1 = y1*4, x2*4, y2*4, x1*4
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.rectangle(img, (x1, y2 - 35), (x2, y2), (0, 255, 0), cv2.FILLED)
                cv2.putText(
                    img,
                    name,
                    (x1 + 6, y1 - 6),
                    cv2.FONT_HERSHEY_COMPLEX,
                    1.0,
                    (255, 255, 255),
                    2,
                )
                mark_attendance(name)

        cv2.imshow("Webcam", img)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
