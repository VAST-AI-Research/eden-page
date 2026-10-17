#!/usr/bin/env python3
"""重做 EdenLive 首页卡片的封面（assets/edenlive/cover.jpg）。

素材是 088（第一人称冰冻枪）擦除片的首帧：左半边是 proxy、右半边是成片，
中间一条滑杆 —— EdenLive 在做的事本来就画在这一帧里了，所以不另画示意图。
裁成卡片要的 16:10，不加文字、不压蒙版。

    python scripts/cover.py

换素材就改 SRC。
"""

import os
import sys

import imageio.v3 as iio
from PIL import Image, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(
    ROOT, "artifacts/edenlive-wipe-480",
    "088-第一人称冰冻枪在岩浆上造路___6edb22/wan22-720p.mp4",
)
DST = os.path.join(ROOT, "assets/edenlive/cover.jpg")

OUT_W, OUT_H = 2400, 1500          # 16:10，和其他卡片一致


def first_frame(path):
    return Image.fromarray(iio.imread(path, index=0)).convert("RGB")


def build():
    frame = first_frame(SRC)
    w, h = frame.size
    cw = h * 16 // 10
    cw -= cw % 2
    x0 = (w - cw) // 2
    frame = frame.crop((x0, 0, x0 + cw, h))
    frame = frame.resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
    frame = ImageEnhance.Contrast(frame).enhance(1.05)

    os.makedirs(os.path.dirname(DST), exist_ok=True)
    frame.save(DST, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"{DST}  {OUT_W}x{OUT_H}  {os.path.getsize(DST) / 1024:.0f}KB")


if __name__ == "__main__":
    if not os.path.exists(SRC):
        sys.exit(f"missing source clip: {SRC}")
    build()
