# Security Policy

## Reporting A Vulnerability

Do not open a public issue for vulnerabilities or exposed biometric data. Use a private GitHub security advisory or contact the maintainer through the address on the GitHub profile.

## Sensitive Data

Never commit or attach:

- Face images or descriptor vectors.
- Attendance databases or CSV exports.
- Names connected to real attendance events.
- Private deployment URLs, credentials, or logs.

## Supported Boundary

FaceTrack is a trusted local reference implementation. It validates image type and size, strips metadata, generates server-side filenames, restricts CORS, serializes processing, deduplicates attendance, and deletes session frames by default.

It does not provide user authentication, authorization, encrypted object storage, liveness detection, anti-spoofing, demographic bias evaluation, or regulatory compliance. Do not expose the API publicly without designing those controls.
