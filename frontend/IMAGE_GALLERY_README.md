# Image Gallery Script Documentation

Event photos live under `src/assets/images/<eventShortName>/` (for example `dtpairs2025/square/`). The generator writes one JSON manifest per event.

## Quick Start

```bash
npm run generate-images
```

This scans each folder under `src/assets/images/` and writes `src/assets/image-list-<eventShortName>.json`.

## Routes

- `/pics` — pick an event
- `/pics/dtpairs2025` — Pairs 2025 gallery
- `/pics/dtteams2025` — Teams 2025 gallery

Configure which events appear in the picker via `galleryEventShortNames` in `src/app/config/config.ts`.

## Workflow

1. Add images under `src/assets/images/<eventShortName>/`
2. Run `npm run generate-images`
3. Open the matching `/pics/<eventShortName>` route

Supported extensions are listed in `scripts/generate-image-list.js` (`IMAGE_EXTENSIONS`).
