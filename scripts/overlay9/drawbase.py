"""Base classes and drawing helpers for the nine HUD renderers.

A renderer produces one RGBA overlay per frame at the normalized 1280x704
output size (see ``geom``). Everything here is layout in that output space;
world-anchored marks go through the clip's ``Transform`` first.

The look is a coherent family across all nine clips: 1-2px rules, a quiet dark
plate for contrast, and one accent color per game. No gradients, no drop
shadows, no hover styling -- same restraint as the site itself.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

from geom import (OUT_W, OUT_H, SAFE, SAFE_L, SAFE_R, SAFE_T, SAFE_B,
                  clamp, smoothstep, ease_out, lerp)

# ---------------------------------------------------------------------------
# Fonts
# ---------------------------------------------------------------------------

_F = {
    "impact": "/System/Library/Fonts/Supplemental/Impact.ttf",
    "blk": "/System/Library/Fonts/Supplemental/Arial Black.ttf",
    "bold": "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "reg": "/System/Library/Fonts/Supplemental/Arial.ttf",
    "mono": "/System/Library/Fonts/Supplemental/Courier New Bold.ttf",
    "ncd_heavy": "/System/Library/Fonts/Avenir Next Condensed.ttc",      # idx 8
    "ncd_bold": "/System/Library/Fonts/Avenir Next Condensed.ttc",       # idx 0
    "ncd_demi": "/System/Library/Fonts/Avenir Next Condensed.ttc",       # idx 2
    "ncd_med": "/System/Library/Fonts/Avenir Next Condensed.ttc",        # idx 5
}
_IDX = {"ncd_heavy": 8, "ncd_bold": 0, "ncd_demi": 2, "ncd_med": 5, "mono": 0}

_cache: dict = {}


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    size = max(8, int(round(size)))
    key = (name, size)
    f = _cache.get(key)
    if f is None:
        f = ImageFont.truetype(_F[name], size, index=_IDX.get(name, 0))
        _cache[key] = f
    return f


def text_w(fnt: ImageFont.FreeTypeFont, s: str) -> float:
    return fnt.getlength(s)


def tracked_w(fnt: ImageFont.FreeTypeFont, s: str, track: float) -> float:
    """Width of ``s`` when drawn with per-glyph tracking (no trailing gap)."""
    if not s:
        return 0.0
    return sum(fnt.getlength(ch) for ch in s) + track * (len(s) - 1)


# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------

def rgb(c) -> tuple:
    if isinstance(c, tuple):
        return c
    c = c.lstrip("#")
    return tuple(int(c[i : i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t: float) -> tuple:
    a, b = rgb(a), rgb(b)
    return tuple(int(round(a[i] + (b[i] - a[i]) * clamp(t))) for i in range(3))


def rgba(c, a: int) -> tuple:
    return rgb(c) + (max(0, min(255, int(round(a)))),)


# ---------------------------------------------------------------------------
# Draw helpers (operate on a PIL ImageDraw in the overlay's RGBA space)
# ---------------------------------------------------------------------------

class D:
    """Thin wrapper adding the drawing primitives the HUDs share."""

    def __init__(self, img: Image.Image):
        self.img = img
        self.g = ImageDraw.Draw(img, "RGBA")

    # -- text ---------------------------------------------------------------
    def text(self, x, y, s, fnt, fill, anchor="la", a=255, track=0):
        """Draw text, optionally letter-spaced.

        Tracking is applied per glyph, so the run is wider than
        ``fnt.getlength(s)``. The horizontal and vertical anchor are honoured
        in both paths -- otherwise every centered kicker drifts right by half
        its tracking.
        """
        if a <= 0 or not s:
            return
        col = rgba(fill, a)
        if not track:
            self.g.text((x, y), s, font=fnt, fill=col, anchor=anchor)
            return
        w = tracked_w(fnt, s, track)
        ha = anchor[0] if anchor else "l"
        if ha == "m":
            cx = x - w / 2
        elif ha == "r":
            cx = x - w
        else:
            cx = x
        va = anchor[1] if len(anchor) > 1 else "a"
        for ch in s:
            self.g.text((cx, y), ch, font=fnt, fill=col, anchor="l" + va)
            cx += fnt.getlength(ch) + track

    # -- display type (plate-free legibility) --------------------------------
    def display(self, x, y, s, fnt, fill, anchor="la", a=255, track=0,
                outline=(8, 10, 12), ow=3, oa=None, glow=None, ga=90, gr=9,
                shadow=0):
        """Text that holds up on any background without a backing plate.

        The stack, outside-in: an optional soft glow, a hard contrasting
        outline, then the fill. This is how shipped game HUDs keep white
        display type readable over arbitrary scenes -- an outline costs a few
        pixels, a translucent panel costs the whole rectangle.
        """
        if a <= 0 or not s:
            return
        oa = a if oa is None else oa
        if glow is not None and ga > 0:
            self._soft(x, y, s, fnt, glow, anchor, int(ga * a / 255), track, gr)
        if shadow:
            self.text(x + shadow, y + shadow, s, fnt, (0, 0, 0),
                      anchor=anchor, a=int(a * 0.5), track=track)
        if outline is not None and ow > 0 and oa > 0:
            # 8-way offsets: cheaper than a true stroke and visually identical
            # at these sizes.
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1),
                           (-1, -1), (1, -1), (-1, 1), (1, 1)):
                for k in range(1, int(ow) + 1):
                    self.text(x + dx * k, y + dy * k, s, fnt, outline,
                              anchor=anchor, a=oa, track=track)
        self.text(x, y, s, fnt, fill, anchor=anchor, a=a, track=track)

    def _soft(self, x, y, s, fnt, col, anchor, a, track, radius):
        """Blurred copy of the text, for neon/ember glows.

        Not safe-clipped: the action callout deliberately animates in from
        above the safe area, and clipping would chop its glow mid-slide. Text
        glows are centered on the type, so they do not creep into the margin
        the way a glow on an edge-hugging widget does.
        """
        if a <= 0:
            return
        layer = Image.new("RGBA", self.img.size, (0, 0, 0, 0))
        dd = D(layer)
        dd.text(x, y, s, fnt, col, anchor=anchor, a=255, track=track)
        layer = layer.filter(ImageFilter.GaussianBlur(radius))
        if a < 255:
            alpha = layer.getchannel("A").point(lambda v: v * a // 255)
            layer.putalpha(alpha)
        self.img.alpha_composite(layer)

    def glow_shape(self, draw_fn, col, a=120, radius=8, clip_safe=True):
        """Run ``draw_fn(D)`` into a blurred layer to halo vector art.

        A Gaussian blur spreads ink outward by roughly its radius, so a glow
        on a widget sitting at the safe-area line bleeds into the margin even
        though the widget itself does not. ``clip_safe`` zeroes the glow
        outside the safe box, which keeps the margin genuinely empty without
        every caller having to budget for blur spread.
        """
        layer = Image.new("RGBA", self.img.size, (0, 0, 0, 0))
        draw_fn(D(layer))
        layer = layer.filter(ImageFilter.GaussianBlur(radius))
        alpha = layer.getchannel("A")
        if a < 255:
            alpha = alpha.point(lambda v: v * a // 255)
        if clip_safe:
            mask = Image.new("L", self.img.size, 0)
            ImageDraw.Draw(mask).rectangle(
                [SAFE_L, SAFE_T, SAFE_R - 1, SAFE_B - 1], fill=255)
            alpha = ImageChops.multiply(alpha, mask)
        layer.putalpha(alpha)
        self.img.alpha_composite(layer)

    # -- plates -------------------------------------------------------------
    def plate(self, x, y, w, h, r=8, fill=(10, 13, 16), a=168, line=None, la=200, lw=1):
        box = [x, y, x + w, y + h]
        if a > 0:
            self.g.rounded_rectangle(box, radius=r, fill=rgba(fill, a))
        if line is not None and la > 0:
            self.g.rounded_rectangle(box, radius=r, outline=rgba(line, la), width=lw)

    def bar(self, x, y, w, h, frac, fill, a=240, bg=(10, 12, 14), bga=190,
            edge=(255, 255, 255), ea=70, r=0, sheen=True):
        """Framed meter with a dark trough, used by every gauge here."""
        self.plate(x, y, w, h, r=r, fill=bg, a=bga, line=edge, la=ea, lw=1)
        fw = (w - 4) * clamp(frac)
        if fw > 0.6:
            self.plate(x + 2, y + 2, fw, h - 4, r=max(0, r - 1), fill=fill, a=a)
            if sheen and h >= 8:
                self.hline(x + 3, x + 2 + fw - 1, y + 3, (255, 255, 255), 58)

    def rect(self, x, y, w, h, fill, a=255):
        self.g.rectangle([x, y, x + w, y + h], fill=rgba(fill, a))

    def outline(self, x, y, w, h, line, a=255, lw=1, r=0):
        box = [x, y, x + w, y + h]
        if r:
            self.g.rounded_rectangle(box, radius=r, outline=rgba(line, a), width=lw)
        else:
            self.g.rectangle(box, outline=rgba(line, a), width=lw)

    # -- lines / shapes -----------------------------------------------------
    def line(self, p0, p1, fill, a=255, lw=1):
        self.g.line([p0, p1], fill=rgba(fill, a), width=lw)

    def vline(self, x, y0, y1, fill, a=255, lw=1):
        self.line((x, y0), (x, y1), fill, a, lw)

    def hline(self, x0, x1, y, fill, a=255, lw=1):
        self.line((x0, y), (x1, y), fill, a, lw)

    def circle(self, x, y, r, fill=None, a=255, outline=None, oa=255, lw=1):
        box = [x - r, y - r, x + r, y + r]
        if fill is not None:
            self.g.ellipse(box, fill=rgba(fill, a))
        if outline is not None:
            self.g.ellipse(box, outline=rgba(outline, oa), width=lw)

    def ring(self, x, y, r, a0, a1, width, fill, a=255):
        """Arc from angle a0 to a1 (degrees, 0=east, CCW positive)."""
        self.g.arc([x - r, y - r, x + r, y + r], a0, a1, fill=rgba(fill, a), width=width)

    def poly(self, pts, fill, a=255, outline=None, oa=255, lw=1):
        self.g.polygon(pts, fill=rgba(fill, a))
        if outline is not None:
            self.g.polygon(pts, outline=rgba(outline, oa))

    def arrow(self, x, y, ang_deg, length, fill, a=255, lw=2, head=6):
        ar = math.radians(ang_deg)
        x1, y1 = x + length * math.cos(ar), y + length * math.sin(ar)
        self.line((x, y), (x1, y1), fill, a, lw)
        for s in (-1, 1):
            ha = ar + math.radians(150 * s)
            self.line((x1, y1), (x1 + head * math.cos(ha), y1 + head * math.sin(ha)), fill, a, lw)


# ---------------------------------------------------------------------------
# Frame + game context
# ---------------------------------------------------------------------------

@dataclass
class Ctx:
    """Per-frame state handed to a renderer."""

    time: float
    index: int
    frame: dict  # overlay-data frame: hud / controls / actions / events
    transform: object  # canvas -> output affine
    cam_mat: object = None  # P@V row-major 16, or None for Canvas2D clips
    entities: list = field(default_factory=list)
    raw: dict = field(default_factory=dict)
    out_w: int = OUT_W
    out_h: int = OUT_H
    fps: float = 24.0

    # world-anchor convenience
    def anchor(self, point):
        from geom import project

        if self.cam_mat is None:
            return None
        res = project(self.cam_mat, point)
        if res is None:
            return None
        x, y, depth = res
        return self.transform(x, y) + (depth,)


class Renderer:
    """One overlay design. Subclass per clip."""

    def __init__(self, clip: dict, prepared: dict):
        self.clip = clip
        self.p = prepared
        self.transform = prepared["transform"]
        self.meta = prepared["meta"]

    def overlay(self, ctx: Ctx) -> Image.Image:
        img = Image.new("RGBA", (ctx.out_w, ctx.out_h), (0, 0, 0, 0))
        self.draw(D(img), ctx)
        return img

    def draw(self, d: D, ctx: Ctx):  # pragma: no cover - overridden
        raise NotImplementedError


# ---------------------------------------------------------------------------
# Shared widgets
# ---------------------------------------------------------------------------

def plate(d: D, x, y, w, h, r=10, a=170, line=(255, 255, 255), la=26, lw=1, fill=(10, 14, 17)):
    """Standard HUD backing plate.

    Used sparingly now -- only where a widget genuinely needs a trough (bars,
    minimap wells). Text and icons rely on ``D.display`` / glows instead, so
    the HUD sits *on* the scene rather than behind a grey sheet.
    """
    d.plate(x, y, w, h, r=r, fill=fill, a=a, line=line, la=la, lw=lw)


# ---------------------------------------------------------------------------
# Keycaps and the centered input cluster
# ---------------------------------------------------------------------------

def keycap_art(d: D, x, y, w, h, label, down, accent, size=15, alpha=255,
               mouse=False):
    """A beveled, plate-free key or mouse-button cap.

    Idle caps are dark with a light rim; a pressed cap fills with the accent,
    gains a glow and sinks 2px. Mouse buttons get a rounded top so LMB/RMB
    read as a mouse, not another keyboard key.
    """
    a = alpha / 255.0
    yy = y + (2 if down else 0)
    r = 10 if not mouse else 13
    if down:
        d.glow_shape(lambda g: g.plate(x, yy, w, h, r=r, fill=accent, a=255),
                     accent, a=int(120 * a), radius=10)
    body = mix((26, 30, 35), accent, 0.55) if down else (24, 28, 32)
    d.plate(x, yy, w, h, r=r, fill=body, a=int((238 if down else 206) * a),
            line=accent if down else (236, 240, 244),
            la=int((255 if down else 150) * a), lw=2 if down else 1)
    if not down:
        # top bevel + bottom shade: gives the cap a physical edge
        d.hline(x + 5, x + w - 5, yy + 2, (255, 255, 255), int(60 * a))
        d.hline(x + 5, x + w - 5, yy + h - 2, (0, 0, 0), int(70 * a))
    if mouse:
        # button split line, upper third
        d.hline(x + 6, x + w - 6, yy + h * 0.42, accent if down else (236, 240, 244),
                int((150 if down else 80) * a))
    fnt = font("bold", size)
    d.display(x + w / 2, yy + h / 2, label, fnt,
              (255, 255, 255) if down else (232, 236, 240), anchor="mm",
              a=int((255 if down else 226) * a), ow=2,
              outline=(8, 10, 12), oa=int(200 * a))


def input_cluster(d: D, keys, accent, cy=None, alpha=255, gap=10,
                  label_above=True):
    """Bottom-center input strip: every control in one place, no panel.

    ``keys`` is a list of dicts with ``label``, ``action``, ``down`` and an
    optional ``mouse`` flag. Single-player clips put all input here, which is
    where players already look for it.
    """
    if not keys:
        return
    h = 48
    # Cap bottoms rest on the safe-area line, never on the frame edge.
    cy = cy if cy is not None else SAFE_B - h
    lf = font("bold", 12)
    kf = font("bold", 17)
    widths = [max(54, text_w(kf, k["label"]) + 30) for k in keys]
    total = sum(widths) + gap * (len(keys) - 1)
    x = OUT_W / 2 - total / 2
    for k, w in zip(keys, widths):
        down = bool(k.get("down"))
        if label_above and k.get("action"):
            d.display(x + w / 2, cy - 10, k["action"], lf,
                      accent if down else (230, 235, 239), anchor="mb",
                      a=int((255 if down else 200) * alpha / 255), track=2,
                      ow=2, outline=(8, 10, 12))
        keycap_art(d, x, cy, w, h, k["label"], down, accent, size=17,
                   alpha=alpha, mouse=bool(k.get("mouse")))
        x += w + gap


def action_callout(d: D, text, t_in, now, accent, hold=0.9, fade=0.45,
                   size=52, y_end=None, track=2):
    """Current-action word that drops in from above screen-top and fades.

    Plate-free art lettering: glow, hard outline, accent fill. This is the
    'semantic reminder' slot -- it reads instantly and then gets out of the
    way instead of sitting in a permanent box.
    """
    if not text or t_in is None:
        return
    dt = now - t_in
    if dt < 0 or dt > hold + fade:
        return
    # Rest with the whole glyph box inside the safe area. An "ma"-anchored
    # draw puts ink from y downward, but the outline and the Gaussian glow
    # both reach *above* y (measured ~24px at gr=14), so the resting y sits
    # that far below SAFE_T.
    if y_end is None:
        y_end = SAFE_T + 24
    slide = ease_out(clamp(dt / 0.22))
    # Slide the glyph *baseline* down to y_end; Impact's ascent means an
    # "ma"-anchored draw at y puts ink from y to roughly y + size.
    y = lerp(-size * 1.5, y_end, slide)
    a = 255 if dt <= hold else int(255 * (1 - (dt - hold) / fade))
    fnt = font("impact", int(size))
    d.display(OUT_W / 2, y, text, fnt, (248, 250, 252), anchor="ma", a=a,
              track=track, ow=3, outline=(10, 12, 14),
              glow=accent, ga=150, gr=14)
    # underscore rule that grows with the slide
    half = (tracked_w(fnt, text, track) / 2) * slide
    if half > 4:
        d.hline(OUT_W / 2 - half, OUT_W / 2 + half, y + size * 1.1, accent,
                int(a * 0.85), 3)


def kicker(d: D, x, y, label, value, vfont, accent, vfnt=None, lw=None, val_a=255, lab_a=200):
    """Small label-above-value readout."""
    d.text(x, y, label, font("bold", 13), accent, anchor="la", a=lab_a, track=1)
    d.text(x, y + 20, value, vfnt or vfont, (235, 238, 240), anchor="la", a=val_a)


def keycap(d: D, x, y, label, action, down, accent, w=None, size=15, on_top=True, alpha=255):
    """A keyboard-key cap. Highlights while ``down``."""
    fnt = font("bold", size)
    tw = text_w(fnt, label)
    w = w or max(34, tw + 22)
    h = 40
    base_a = int(150 * alpha / 255)
    face = mix((24, 29, 33), accent, 0.28 if down else 0.0)
    edge_a = int((150 if down else 60) * alpha / 255)
    d.plate(x, y, w, h, r=8, fill=face, a=base_a + (70 if down else 0),
            line=accent if down else (255, 255, 255), la=edge_a, lw=2 if down else 1)
    # cap highlight
    d.hline(x + 4, x + w - 4, y + 2, accent if down else (255, 255, 255), int(60 * alpha / 255))
    fg = (255, 255, 255) if down else (228, 232, 235)
    d.text(x + w / 2, y + h / 2 - 1, label, fnt, fg, anchor="mm",
           a=int((255 if down else 215) * alpha / 255))
    if on_top:
        d.text(x + w / 2, y - 12, action, font("bold", 12), accent if down else (200, 205, 210),
               anchor="mm", a=int((255 if down else 190) * alpha / 255), track=1)
    return w


def chip(d: D, x, y, label, value, accent, alpha=255, w=None):
    """Inline label: value chip for metric rows."""
    lf = font("bold", 12)
    vf = font("ncd_bold", 20)
    lw_ = text_w(lf, label)
    vw = text_w(vf, value)
    w = w or (lw_ + vw + 40)
    a = int(150 * alpha / 255)
    d.plate(x, y, w, 34, r=17, fill=(12, 16, 19), a=a, line=accent, la=int(120 * alpha / 255), lw=1)
    d.text(x + 16, y + 17, label, lf, accent, anchor="lm", a=int(210 * alpha / 255), track=1)
    d.text(x + w - 16, y + 17, value, vf, (240, 243, 245), anchor="rm", a=int(245 * alpha / 255))
    return w
