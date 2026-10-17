#!/usr/bin/env python3
"""Extract 1 frame per second from every video under a root directory.

For each video `<dir>/<name>.<ext>`, frames go to `<dir>/<name>/000001.jpg ...`.
Resumable: a video whose output dir already holds the expected number of frames
is skipped.
"""
import os
import sys
import time

import cv2

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
EXTS = {".mp4", ".webm", ".mov", ".m4v", ".mkv", ".avi"}
JPEG_QUALITY = 92


def videos(root):
    out = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames.sort()
        for fn in sorted(filenames):
            ext = os.path.splitext(fn)[1].lower()
            if ext in EXTS:
                out.append(os.path.join(dirpath, fn))
    return out


def expected_count(cap):
    fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    n = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0.0
    if fps <= 0 or n <= 0:
        return None
    return max(1, int(round(n / fps)))


def extract(path):
    stem = os.path.splitext(os.path.basename(path))[0]
    outdir = os.path.join(os.path.dirname(path), stem)
    os.makedirs(outdir, exist_ok=True)

    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        return "FAIL open"
    fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    if fps <= 0:
        cap.release()
        return "FAIL no fps"

    want = expected_count(cap)
    if want is not None:
        have = len([f for f in os.listdir(outdir) if f.endswith(".jpg")])
        if have >= want:
            cap.release()
            return f"SKIP {have} frames"

    # Sample the frame nearest each whole second.
    idx = 0
    t = 0.0
    written = 0
    while True:
        target = int(round(t * fps))
        cap.set(cv2.CAP_PROP_POS_FRAMES, target)
        ok, frame = cap.read()
        if not ok:
            break
        idx += 1
        dst = os.path.join(outdir, f"{idx:06d}.jpg")
        cv2.imwrite(dst, frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
        written += 1
        t += 1.0
        if want is not None and written >= want:
            break
    cap.release()
    return f"OK {written} frames @ {fps:.2f}fps"


def main():
    paths = videos(ROOT)
    print(f"{len(paths)} videos under {ROOT}", flush=True)
    t0 = time.time()
    for i, p in enumerate(paths, 1):
        rel = os.path.relpath(p, ROOT)
        ts = time.time()
        status = extract(p)
        print(f"[{i}/{len(paths)}] {status}  {rel}  ({time.time()-ts:.1f}s)", flush=True)
    print(f"done in {time.time()-t0:.0f}s", flush=True)


if __name__ == "__main__":
    main()
