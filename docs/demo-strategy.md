# Demo Strategy

FaceTrack's public demonstration is synthetic by design.

## Review Path

1. Start only the frontend with `npm run dev`.
2. Inspect the abstract four-person session frame.
3. Run recognition and watch the processing trace.
4. Compare three matches against one unknown detection.
5. Open Roster and Attendance to inspect the surrounding workflow.

This path communicates the product and systems behavior without publishing biometric data or pretending that fixtures came from live inference.

## README Media

`docs/media/facetrack-console.gif` cycles through browser-verified ready, scanning, completed, roster, and attendance states. Desktop and mobile captures are stored alongside it.

## Native Demo

For local inference, use images you have explicit permission to process. Do not screen-record private names or faces for public documentation. Remove the local database and runtime data after the walkthrough.
