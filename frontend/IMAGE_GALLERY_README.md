# Image Gallery

Event photos live under `src/assets/images/<eventShortName>/`. A flat folder is enough:

```text
src/assets/images/dtpairs2025/
  photo-001.jpg
  photo-002.jpg
```

Nested folders (for example legacy `square/` or `horizontal/`) still work — the generator includes every image — but the UI does not treat those folder names specially. Hub covers and the grid use a uniform layout for all photos.

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

1. Add images under `src/assets/images/<eventShortName>/` (flat layout preferred)
2. Ensure files are world-readable (`chmod a+r` / avoid mode `700`) — nginx returns **403** for owner-only files in production
3. Run `npm run generate-images` (also run automatically by `scripts/deploy.sh`)
4. Open the matching `/pics/<eventShortName>` route

Photos are shown in a randomized order as a square thumbnail grid; tap opens a full-screen viewer. The hub page picks a random cover image per event on each visit.

Supported extensions are listed in `scripts/generate-image-list.js` (`IMAGE_EXTENSIONS`).
