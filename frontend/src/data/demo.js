export const DEMO_ROSTER = [
  { id: 1, label: "Ava Chen", quality: "Reference ready" },
  { id: 2, label: "Jordan Lee", quality: "Reference ready" },
  { id: 3, label: "Mina Patel", quality: "Reference ready" },
]

export const DEMO_ATTENDANCE = [
  { id: 1, name: "Mina Patel", timestamp: "2026-07-11T09:14:18-07:00" },
  { id: 2, name: "Jordan Lee", timestamp: "2026-07-11T09:14:15-07:00" },
  { id: 3, name: "Ava Chen", timestamp: "2026-07-11T09:14:12-07:00" },
]

export const DEMO_SUMMARY = {
  frames_processed: 2,
  faces_detected: 4,
  unknown_faces: 1,
  attendance_marked: 3,
  distance_threshold: 0.48,
  matches: [
    { name: "Ava Chen", frame: "session-01.jpg", distance: 0.281 },
    { name: "Jordan Lee", frame: "session-02.jpg", distance: 0.314 },
    { name: "Mina Patel", frame: "session-02.jpg", distance: 0.337 },
  ],
}
