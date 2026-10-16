#!/usr/bin/env python3
"""
Build all learn-card GIFs for CrossFit essentials slugs in lessons.ts.

Uses learn_gif_from_youtube.py for each official demo video.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from learn_gif_from_youtube import ClipOptions, learn_gif_from_youtube  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "src" / "assets" / "learn"

# CrossFit channel demos aligned with crossfit.com/essentials slugs.
MOVEMENTS: dict[str, tuple[str, str]] = {
    "the-air-squat": ("rMvwVtlqjTE", "air-squat"),
    "the-front-squat": ("uYumuL_G_V0", "front-squat"),
    "the-overhead-squat": ("pn8mqlG0nkE", "overhead-squat"),
    "the-shoulder-press": ("5yWaNOvgFCM", "shoulder-press"),
    "the-push-press": ("iaBVSJm78ko", "push-press"),
    "the-push-jerk": ("VrHNJXoSyXw", "push-jerk"),
    "the-deadlift": ("1ZXobu7JvvE", "deadlift"),
    "the-sumo-deadlift-high-pull": ("gh55vVlwlQg", "sumo-deadlift-high-pull"),
    "the-medicine-ball-clean": ("KVGhkHSrDJo", "medicine-ball-clean"),
    "the-pull-up": ("aAggnpPyR6E", "pull-up"),
    "the-thruster": ("L219ltL15zk", "thruster"),
    "the-muscle-up": ("OCg3UXgzftc", "muscle-up"),
    "the-snatch": ("GhxhiehJcQY", "snatch"),
    "the-wall-ball-shot": ("EqjGKsiIMCE", "wall-ball-shot"),
    "the-handstand-push-up": ("9wIkPCS4Mbo", "handstand-push-up"),
    "the-kettlebell-swing": ("mKDIuUbH94Q", "kettlebell-swing"),
    "the-push-up": ("0pkjOk0EiAk", "push-up"),
    "the-box-jump": ("NBY9-kTuHEk", "box-jump"),
    "the-double-under": ("82jNjDS19lg", "double-under"),
    "the-ring-dip": ("EznLCDBAPIU", "ring-dip"),
    "the-abmat-sit-up": ("VIZX2Ru9qU8", "abmat-sit-up"),
}


def process_slug(slug: str, video_id: str, name: str, force: bool) -> dict:
    out = OUT_DIR / f"{name}.gif"
    if out.is_file() and not force:
        return {"slug": slug, "status": "skipped", "out": str(out.relative_to(ROOT))}
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    try:
        meta = learn_gif_from_youtube(video_id, out, ClipOptions())
    except Exception as exc:  # noqa: BLE001
        return {"slug": slug, "status": "error", "error": str(exc)}
    return {
        "slug": slug,
        "status": "ok",
        "video_id": video_id,
        "out": str(out.relative_to(ROOT)),
        "size_kb": meta["size_kb"],
        "frames": meta["loop_frames"],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--slug", action="append", help="Only these essentials slugs")
    args = parser.parse_args()
    targets = MOVEMENTS
    if args.slug:
        targets = {k: v for k, v in MOVEMENTS.items() if k in args.slug}
    results = []
    for slug, (vid, name) in targets.items():
        print(f"Processing {slug} ({vid})…", flush=True)
        result = process_slug(slug, vid, name, args.force)
        if result.get("status") == "error":
            print(f"  ERROR: {result['error']}", file=sys.stderr)
        results.append(result)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
