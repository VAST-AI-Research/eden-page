"""Render the nine overlaid clips.

Pipeline per clip:
  1. normalize the proxy-fine source to 1280x704 / 24fps (center crop for the
     720p clips, crop+scale for the 480p ones -- see ``geom``)
  2. render one RGBA HUD per frame from the state bundle
  3. composite and encode H.264

Usage
  python render.py                       # all nine
  python render.py --only 051,081        # a subset
  python render.py --stills 4            # contact sheets only, no video
  python render.py --source proxy        # overlay the proxy instead of proxy-fine
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from PIL import Image

from clips import CLIPS, SRC_STATE, resolve_source
from geom import OUT_W, OUT_H, OUT_FPS, N_FRAMES, transform_for
from drawbase import Ctx
from huds import RENDERERS
from prepare import prepare

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BUILD = os.path.join(ROOT, "artifacts", "overlay9")
CACHE = os.path.join(BUILD, "prepared")


# ---------------------------------------------------------------------------
# Source normalization
# ---------------------------------------------------------------------------

def normalize_filter(kind: str) -> str:
    """ffmpeg filter mapping a source clip onto the 1280x704 / 24fps output.

    The 720p clips are already the exact canvas crop, so they only need a fps
    conform. The 480p clips are a squeezed canvas crop; we take the matching
    vertical center slice and scale up.
    """
    if kind == "720p":
        return f"fps={OUT_FPS},scale={OUT_W}:{OUT_H}:flags=lanczos,setsar=1"
    # 832x480 -> center-crop to 832x458 (= 1280:704 aspect) -> upscale
    return (f"fps={OUT_FPS},crop=832:458:0:11,"
            f"scale={OUT_W}:{OUT_H}:flags=lanczos,setsar=1")


def decode_frames(path: str, kind: str):
    """Yield normalized RGB frames as raw bytes."""
    cmd = [
        "ffmpeg", "-v", "error", "-i", path,
        "-vf", normalize_filter(kind),
        "-frames:v", str(N_FRAMES),
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
    ]
    n = OUT_W * OUT_H * 3
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=n * 2)
    try:
        while True:
            buf = proc.stdout.read(n)
            if not buf or len(buf) < n:
                break
            yield buf
    finally:
        proc.stdout.close()
        proc.wait()


# ---------------------------------------------------------------------------
# Per-clip render
# ---------------------------------------------------------------------------

def suffix(source: str) -> str:
    """Filename tag per source, so proxy and fine renders sit side by side.

    ``fine`` stays unsuffixed: it is the default and the existing outputs are
    already named that way.
    """
    return "" if source == "fine" else f"-{source}"


def build_ctx(clip, bundle, i, t):
    frames = bundle["frames"]
    idx = min(len(frames) - 1, i)
    cams = bundle.get("cams") or []
    return Ctx(
        time=t,
        index=idx,
        frame=frames[idx],
        transform=transform_for(clip["kind"]),
        cam_mat=cams[idx] if idx < len(cams) else None,
        entities=(bundle.get("entities") or [[]] * len(frames))[idx],
        out_w=OUT_W,
        out_h=OUT_H,
        fps=OUT_FPS,
    )


def render_clip(clip, source="fine", stills=0, quiet=False):
    cid = clip["id"]
    t0 = time.time()
    bundle = prepare(clip, SRC_STATE, CACHE)
    prepared = {"transform": transform_for(clip["kind"]), "meta": bundle["meta"]}
    rend = RENDERERS[cid](clip, prepared)

    src = resolve_source(clip, source)
    if not os.path.exists(src):
        raise SystemExit(f"missing source: {src}")

    os.makedirs(BUILD, exist_ok=True)

    if stills:
        picks = clip.get("stills") or [int(N_FRAMES * k / (stills + 1)) for k in range(1, stills + 1)]
        picks = picks[:stills] if len(picks) >= stills else picks
        tiles = []
        wanted = set(picks)
        for i, buf in enumerate(decode_frames(src, clip["kind"])):
            if i not in wanted:
                continue
            base = Image.frombytes("RGB", (OUT_W, OUT_H), buf).convert("RGBA")
            ov = rend.overlay(build_ctx(clip, bundle, i, i / OUT_FPS))
            tiles.append((i, Image.alpha_composite(base, ov).convert("RGB")))
            if len(tiles) == len(wanted):
                break
        tiles.sort()
        cols = 2 if len(tiles) > 2 else 1
        rows = (len(tiles) + cols - 1) // cols
        tw, th = OUT_W // 2, OUT_H // 2
        sheet = Image.new("RGB", (cols * tw + (cols - 1) * 6, rows * th + (rows - 1) * 6), "white")
        for k, (_, im) in enumerate(tiles):
            sheet.paste(im.resize((tw, th), Image.LANCZOS), ((k % cols) * (tw + 6), (k // cols) * (th + 6)))
        out = os.path.join(BUILD, f"{cid}-stills{suffix(source)}.jpg")
        sheet.save(out, quality=93)
        if not quiet:
            print(f"  {cid}  stills -> {os.path.relpath(out, ROOT)}  ({time.time()-t0:.1f}s)")
        return out

    out = os.path.join(BUILD, f"{cid}-{clip['slug']}-overlay{suffix(source)}.mp4")
    enc = subprocess.Popen([
        "ffmpeg", "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{OUT_W}x{OUT_H}", "-r", str(OUT_FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "19",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        out,
    ], stdin=subprocess.PIPE)

    n = 0
    try:
        for i, buf in enumerate(decode_frames(src, clip["kind"])):
            base = Image.frombytes("RGB", (OUT_W, OUT_H), buf).convert("RGBA")
            ov = rend.overlay(build_ctx(clip, bundle, i, i / OUT_FPS))
            enc.stdin.write(Image.alpha_composite(base, ov).convert("RGB").tobytes())
            n += 1
    finally:
        enc.stdin.close()
        enc.wait()
    if not quiet:
        print(f"  {cid}  {n} frames -> {os.path.relpath(out, ROOT)}  ({time.time()-t0:.1f}s)")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--source", default="fine", choices=["fine", "proxy", "wipe"])
    ap.add_argument("--stills", type=int, default=0)
    args = ap.parse_args()

    want = {s.strip() for s in args.only.split(",") if s.strip()}
    clips = [c for c in CLIPS if not want or c["id"] in want]
    print(f"rendering {len(clips)} clip(s), source={args.source}")
    for c in clips:
        render_clip(c, source=args.source, stills=args.stills)


if __name__ == "__main__":
    main()
