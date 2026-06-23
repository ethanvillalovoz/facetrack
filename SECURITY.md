# Security Policy

## Supported Versions

The `main` branch is the supported development version.

## Reporting A Vulnerability

Please open a private security advisory on GitHub if you discover a vulnerability. If that is not available, contact the repository owner directly before posting details publicly.

## Sensitive Data

FaceTrack can process biometric data. Do not commit real face images, production attendance databases, generated CSV logs, API keys, or environment files. Use sample/demo data only when you have permission to share it.

## Production Notes

Before deploying FaceTrack beyond a local prototype, add authentication, strict CORS, access controls, private storage, retention policies, logging, and a consent-aware data handling process.
