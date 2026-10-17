"""Check that no HUD ink lands in the safe-area margin.

Renders every overlay frame-by-frame (no video decode needed -- the overlay
alpha channel is all we inspect) and reports any clip whose art reaches into
the outer ``SAFE`` band.

Two things are allowed through on purpose:
  * the action callout while it is still sliding in from above the frame
  * full-frame impact flashes, which are a deliberate wash, not a layout bug

Run after changing any layout:
    /tmp/ovenv/bin/python scripts/overlay9/audit.py
    /tmp/ovenv/bin/python scripts/overlay9/audit.py --only 059 --step 1
"""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np

from clips import CLIPS, SRC_STATE
from drawbase import Ctx
from geom import OUT_W, OUT_H, SAFE, transform_for
from huds import RENDERERS
from prepare import prepare

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CACHE = os.path.join(ROOT, "artifacts", "overlay9", "prepared")

# Ink fainter than this is antialias spill, not a visible element.
ALPHA_MIN = 26
# A handful of stray pixels is rounding, not a layout mistake.
TOLERANCE = 60
# Band inset: ignore the outermost few px, which codecs smear anyway.
INSET = 6
# Coverage above this fraction of the band means a full-frame flash.
FLASH_FRAC = 0.80
# Callout slide duration; crossing the top edge before this is intended.
SLIDE_S = 0.30


def bands(alpha: np.ndarray):
    b = SAFE - INSET
    yield "top", alpha[:b, :]
    yield "bottom", alpha[OUT_H - b:, :]
    yield "left", alpha[:, :b]
    yield "right", alpha[:, OUT_W - b:]


def audit_clip(clip: dict, step: int = 3, verbose: bool = False):
    cid = clip["id"]
    bundle = prepare(clip, SRC_STATE, CACHE)
    rend = RENDERERS[cid](clip, {"transform": transform_for(clip["kind"]),
                                 "meta": bundle["meta"]})
    frames = bundle["frames"]
    cams = bundle.get("cams") or []
    ents = bundle.get("entities") or []
    onsets = bundle["meta"].get("status_onset") or [0.0] * len(frames)

    worst = 0
    where = None
    for i in range(0, len(frames), step):
        t = i / 24.0
        if t - onsets[i] < SLIDE_S:
            continue  # callout still animating in
        ctx = Ctx(time=t, index=i, frame=frames[i],
                  transform=transform_for(clip["kind"]),
                  cam_mat=cams[i] if i < len(cams) else None,
                  entities=ents[i] if i < len(ents) else [])
        alpha = np.asarray(rend.overlay(ctx).getchannel("A"))
        for name, band in bands(alpha):
            hot = band > ALPHA_MIN
            n = int(hot.sum())
            if n and n / hot.size > FLASH_FRAC:
                continue  # deliberate full-frame flash
            if n > worst:
                worst, where = n, (name, i)
    return worst, where


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--step", type=int, default=3)
    args = ap.parse_args()

    want = {s.strip() for s in args.only.split(",") if s.strip()}
    clips = [c for c in CLIPS if not want or c["id"] in want]
    bad = []
    for clip in clips:
        worst, where = audit_clip(clip, step=args.step)
        ok = worst <= TOLERANCE
        tag = "clean" if ok else f"BREACH {where[0]} @f{where[1]}"
        print(f"{clip['id']}  margin ink={worst:6d}  {tag}")
        if not ok:
            bad.append(clip["id"])
    print()
    print("all clean" if not bad else f"breaches: {', '.join(bad)}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
