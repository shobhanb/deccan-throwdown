#!/usr/bin/env python3
"""
Clip a CrossFit-style YouTube demo and encode a learn-card GIF.

Pipeline (same as the push-jerk learn asset):

  1. Download the video with yt-dlp (≤720p MP4).
  2. ffmpeg: seek past the title card, sample a short window at 12 fps.
  3. Find the active rep: ignore the left title band, cap loop length.
  4. Union-crop to the athlete across those frames.
  5. Hold the first and last frames briefly so the loop reads clearly.
  6. ffmpeg palette GIF (400px wide, ~80 colors, bayer dither).

Requires: ffmpeg, yt-dlp, pillow, numpy.

Environment:

  YT_DLP   Optional path to the yt-dlp binary (otherwise PATH or ../.venv-ytdlp).

Runtime options:

  youtube                 YouTube watch URL, youtu.be link, or 11-character video id.
  -o, --output PATH       Output .gif path (required).
  --start SECONDS         Seek into the source before sampling (default: 0.45).
  --duration SECONDS      Length of the sample window after --start (default: 5.0).
  --fps N                 Frame rate while sampling (default: 12).
  --width PX              Output GIF width in pixels; height keeps aspect (default: 400).
  --max-frames N          Maximum frames in the movement loop (default: 50).
  --keep-mp4 PATH         Save the downloaded MP4 to this path (YouTube mode only).
  --from-mp4 PATH         Skip download; run clip/crop/GIF steps on a local MP4.
  -h, --help              Print usage and these options, then exit.

Example:

  python learn_gif_from_youtube.py \\
    'https://www.youtube.com/watch?v=VrHNJXoSyXw' \\
    -o src/assets/learn/push-jerk.gif

  python learn_gif_from_youtube.py --help
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
FRONTEND_ROOT = SCRIPT_DIR.parent

# Defaults tuned for CrossFit “infinity” movement demos (~1s title, then one rep).
DEFAULT_CLIP_START_SEC = 0.45
DEFAULT_CLIP_DURATION_SEC = 5.0
DEFAULT_FPS = 12
DEFAULT_WIDTH = 400
DEFAULT_MAX_ACTIVE_FRAMES = 50
DEFAULT_HOLD_HEAD = 4
DEFAULT_HOLD_TAIL = 5
DEFAULT_MIN_ACTIVITY = 0.08


@dataclass(frozen=True)
class ClipOptions:
    clip_start_sec: float = DEFAULT_CLIP_START_SEC
    clip_duration_sec: float = DEFAULT_CLIP_DURATION_SEC
    fps: int = DEFAULT_FPS
    width: int = DEFAULT_WIDTH
    max_active_frames: int = DEFAULT_MAX_ACTIVE_FRAMES
    hold_head: int = DEFAULT_HOLD_HEAD
    hold_tail: int = DEFAULT_HOLD_TAIL
    min_activity: float = DEFAULT_MIN_ACTIVITY


def parse_video_id(url_or_id: str) -> str:
    value = url_or_id.strip()
    if re.fullmatch(r"[\w-]{6,}", value) and "://" not in value:
        return value
    match = re.search(
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([\w-]{6,})",
        value,
    )
    if match:
        return match.group(1)
    raise ValueError(f"Could not parse YouTube video id from: {url_or_id}")


def yt_dlp_binary() -> str:
    env = os.environ.get("YT_DLP")
    if env and Path(env).is_file():
        return env
    found = shutil.which("yt-dlp")
    if found:
        return found
    repo = FRONTEND_ROOT.parent / ".venv-ytdlp" / "bin" / "yt-dlp"
    if repo.is_file():
        return str(repo)
    raise SystemExit("yt-dlp not found. Install it or set YT_DLP to the binary path.")


def run(cmd: list[str], quiet: bool = True) -> None:
    kwargs = {}
    if quiet:
        kwargs["stdout"] = subprocess.DEVNULL
        kwargs["stderr"] = subprocess.DEVNULL
    subprocess.run(cmd, check=True, **kwargs)


def download_youtube_video(video_id: str, dest: Path) -> None:
    url = f"https://www.youtube.com/watch?v={video_id}"
    run(
        [
            yt_dlp_binary(),
            "-f",
            "bv*[height<=720]+ba/b[height<=720]",
            "--merge-output-format",
            "mp4",
            "-o",
            str(dest),
            url,
        ],
    )


def extract_frames(mp4: Path, work: Path, opts: ClipOptions) -> list[Path]:
    pattern = work / "f%04d.png"
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            str(opts.clip_start_sec),
            "-t",
            str(opts.clip_duration_sec),
            "-i",
            str(mp4),
            "-vf",
            f"fps={opts.fps}",
            str(pattern),
        ],
    )
    frames = sorted(work.glob("f*.png"))
    if len(frames) < 8:
        raise RuntimeError(
            f"Only {len(frames)} frames extracted; check clip start/duration or the source video.",
        )
    return frames


def frame_activity(path: Path) -> float:
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
    h, w, _ = a.shape
    mask = np.any(a < 200, axis=2)
    mask[: int(h * 0.12), :] = False
    # CrossFit demos often place the movement title on the left; athlete is on the right.
    mask[:, : int(w * 0.42)] = False
    if not mask.any():
        mask = np.any(a < 200, axis=2)
        mask[: int(h * 0.12), :] = False
    if not mask.any():
        return 0.0
    return float((255 - a[mask].mean()) / 255.0)


def active_range(frames: list[Path], opts: ClipOptions) -> tuple[int, int]:
    scores = [frame_activity(p) for p in frames]
    active = [i for i, s in enumerate(scores) if s >= opts.min_activity]
    if not active:
        end = min(len(frames) - 1, opts.max_active_frames - 1)
        return 0, end
    start = active[0]
    end = active[-1]
    while end > start and scores[end] < opts.min_activity * 0.6:
        end -= 1
    if end - start + 1 > opts.max_active_frames:
        end = start + opts.max_active_frames - 1
    return start, end


def crop_box(frames: list[Path], start: int, end: int) -> tuple[int, int, int, int]:
    boxes: list[tuple[int, int, int, int]] = []
    for path in frames[start : end + 1]:
        a = np.asarray(Image.open(path).convert("RGB"))
        h, w, _ = a.shape
        mask = np.any(a < 200, axis=2)
        mask[: int(h * 0.14), : int(w * 0.38)] = False
        ys, xs = np.where(mask)
        if len(xs) == 0:
            continue
        boxes.append((int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())))
    if not boxes:
        w, h = Image.open(frames[0]).size
        return int(w * 0.35), 0, w, h
    x0 = min(b[0] for b in boxes)
    y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes)
    y1 = max(b[3] for b in boxes)
    pad = 16
    w, h = Image.open(frames[0]).size
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(w, x1 + pad)
    y1 = min(h, y1 + pad)
    if (x1 - x0) % 2:
        x1 += 1
    if (y1 - y0) % 2:
        y1 += 1
    return x0, y0, x1, y1


def encode_gif(
    frames: list[Path],
    start: int,
    end: int,
    crop: tuple[int, int, int, int],
    out: Path,
    opts: ClipOptions,
) -> None:
    x0, y0, x1, y1 = crop
    selected = frames[start : end + 1]
    seq: list[Image.Image] = []
    for _ in range(opts.hold_head):
        seq.append(Image.open(selected[0]).convert("RGB"))
    for path in selected:
        seq.append(Image.open(path).convert("RGB"))
    for _ in range(opts.hold_tail):
        seq.append(Image.open(selected[-1]).convert("RGB"))

    out.parent.mkdir(parents=True, exist_ok=True)
    seq_dir = out.parent / f".{out.stem}-seq"
    try:
        if seq_dir.exists():
            shutil.rmtree(seq_dir)
        seq_dir.mkdir(parents=True)
        for i, im in enumerate(seq):
            im.crop((x0, y0, x1, y1)).save(seq_dir / f"{i:04d}.png")
        run(
            [
                "ffmpeg",
                "-y",
                "-framerate",
                str(opts.fps),
                "-i",
                str(seq_dir / "%04d.png"),
                "-vf",
                f"scale={opts.width}:-2:flags=lanczos,split[s0][s1];"
                f"[s0]palettegen=max_colors=80:stats_mode=diff[p];"
                f"[s1][p]paletteuse=dither=bayer:bayer_scale=4",
                str(out),
            ],
        )
    finally:
        if seq_dir.exists():
            shutil.rmtree(seq_dir)


def learn_gif_from_mp4(mp4: Path, out: Path, opts: ClipOptions | None = None) -> dict:
    """Run steps 2–6 on a local MP4 (skip YouTube download)."""
    opts = opts or ClipOptions()
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        frames = extract_frames(mp4, work, opts)
        start, end = active_range(frames, opts)
        crop = crop_box(frames, start, end)
        encode_gif(frames, start, end, crop, out, opts)
    return {
        "output": str(out),
        "size_kb": out.stat().st_size // 1024,
        "loop_frames": end - start + 1,
        "crop": crop,
    }


def learn_gif_from_youtube(
    url_or_id: str,
    out: Path,
    opts: ClipOptions | None = None,
    keep_mp4: Path | None = None,
) -> dict:
    """Full pipeline: download, clip, crop, GIF."""
    video_id = parse_video_id(url_or_id)
    opts = opts or ClipOptions()
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        mp4 = work / "video.mp4"
        download_youtube_video(video_id, mp4)
        if keep_mp4:
            keep_mp4.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(mp4, keep_mp4)
        meta = learn_gif_from_mp4(mp4, out, opts)
    meta["video_id"] = video_id
    return meta


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Clip a YouTube movement demo and build a learn-card GIF.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Environment: YT_DLP — optional path to yt-dlp.\n"
            "Pipeline details: see the module docstring at the top of this file."
        ),
    )
    parser.add_argument(
        "youtube",
        help="YouTube URL or 11-character video id",
    )
    parser.add_argument(
        "-o",
        "--output",
        required=True,
        type=Path,
        help="Output .gif path",
    )
    parser.add_argument(
        "--start",
        type=float,
        default=DEFAULT_CLIP_START_SEC,
        help=f"Seek into the video before sampling (default {DEFAULT_CLIP_START_SEC})",
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=DEFAULT_CLIP_DURATION_SEC,
        help=f"Seconds to sample after --start (default {DEFAULT_CLIP_DURATION_SEC})",
    )
    parser.add_argument(
        "--fps",
        type=int,
        default=DEFAULT_FPS,
        help=f"Frame rate while sampling (default {DEFAULT_FPS})",
    )
    parser.add_argument(
        "--width",
        type=int,
        default=DEFAULT_WIDTH,
        help=f"GIF width in pixels (default {DEFAULT_WIDTH})",
    )
    parser.add_argument(
        "--max-frames",
        type=int,
        default=DEFAULT_MAX_ACTIVE_FRAMES,
        help=f"Max frames in the movement loop (default {DEFAULT_MAX_ACTIVE_FRAMES})",
    )
    parser.add_argument(
        "--keep-mp4",
        type=Path,
        help="Also save the downloaded MP4 here",
    )
    parser.add_argument(
        "--from-mp4",
        type=Path,
        help="Skip download; run the clip/GIF steps on this file instead",
    )
    args = parser.parse_args()

    opts = ClipOptions(
        clip_start_sec=args.start,
        clip_duration_sec=args.duration,
        fps=args.fps,
        width=args.width,
        max_active_frames=args.max_frames,
    )

    try:
        if args.from_mp4:
            meta = learn_gif_from_mp4(args.from_mp4.resolve(), args.output.resolve(), opts)
        else:
            meta = learn_gif_from_youtube(
                args.youtube,
                args.output.resolve(),
                opts,
                keep_mp4=args.keep_mp4.resolve() if args.keep_mp4 else None,
            )
    except subprocess.CalledProcessError as exc:
        print(f"Command failed: {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"Wrote {meta['output']} ({meta['size_kb']} KB, {meta['loop_frames']} loop frames)")
    if "video_id" in meta:
        print(f"Source: https://www.youtube.com/watch?v={meta['video_id']}")


if __name__ == "__main__":
    main()
