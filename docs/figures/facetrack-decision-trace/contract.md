# Figure contract: FaceTrack decision trace

## Communication job

By the end of the figure, a technical reviewer should understand how FaceTrack keeps a local attendance decision traceable from a numbered detection to its roster distance, threshold outcome, daily ledger rule, and session-frame cleanup behavior.

## Supported claim

The bundled deterministic demo exposes four numbered detections: three committed roster distances (`0.281`, `0.314`, and `0.337`) at or below the configured `0.48` threshold and one unknown outcome whose distance is not retained in the fixture. The maintained local implementation records recognized identities at most once per UTC day and deletes staged session frames after processing by default.

## Evidence used

- `frontend/src/data/demo.js` for the deterministic demo threshold, match distances, counts, and attendance fixture.
- `media/session-workspace-demo.png`, captured from the running frontend after the deterministic recognition action, for the synchronized detection and match ledger.
- `src/recognition.py` for nearest-reference selection, threshold behavior, and unknown handling.
- `backend/database/attendance_db.py` for `UNIQUE(name, attendance_date)` and `INSERT OR IGNORE` daily deduplication.
- `backend/fastapi_app.py` for image normalization, metadata removal, the non-blocking processing lock, and default session-frame deletion in `finally`.

## Evidence boundary

- The public session image is a fictional, synthetic classroom illustration and is not biometric or experimental evidence.
- The displayed distances and attendance records are deterministic bundled fixtures, not native inference results.
- The live path remains local and requires consented user-supplied images.
- Face distance is not a calibrated probability.
- The figure makes no recognition-accuracy, biometric-dataset, surveillance-deployment, or attendance-outcome claim.

## Selection rule

The figure shows the complete four-detection default demo state after the single documented “Run recognition” action. No detection or outcome is omitted.

## Visual hierarchy

1. The completed session workspace is the dominant evidence panel.
2. A compact data-derived distance plot explains the `0.48` decision boundary without inventing an unknown-face distance.
3. Exact persistence and deletion rules distinguish the attendance record from transient session imagery.
4. The demo/live/not-claimed boundary remains readable at GitHub README width.

## Delivery formats

- Editable source: `editable/facetrack-decision-trace.pptx`
- README export: `exports/facetrack-decision-trace.svg`
- Review export: `exports/facetrack-decision-trace.png`
- Print/preflight export: `exports/facetrack-decision-trace.pdf`
