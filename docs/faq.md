# FAQ

## Why are there no sample face images?

The repository should be inspectable without redistributing biometric data. The public demo uses abstract identities. Bring your own consented images for local inference.

## Why does `face_recognition` fail to install?

It depends on dlib and may require CMake, a compiler toolchain, and platform headers. Python 3.11 is a conservative target for local native setup.

## Why does CI avoid `requirements.txt`?

API and recognition-contract tests do not need to compile dlib. `requirements-ci.txt` keeps pull requests fast while the full stack remains available locally.

## Is face distance a confidence score?

No. Face distance is not calibrated probability. Decisions are made by comparing the minimum distance against the configured threshold.

## What happens to uploaded frames?

Session frames are normalized to JPEG and deleted after each processing attempt by default. Reference images remain local until replaced or removed.

## Can this be deployed publicly?

Not as-is. The repository intentionally models a trusted local operator. Public or organizational use needs authentication, authorization, private encrypted storage, retention enforcement, auditing, rate limits, and legal/consent review.
