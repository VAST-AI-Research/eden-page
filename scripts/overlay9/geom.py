"""Coordinate transforms between the state canvas and the normalized output frame.

The nine proxy clips ship in two shapes. Measured against ``original.mp4`` (the
exact render the state data was authored on, 1280x720):

  * ``wan22-720p``     1280x704, 24fps  -- pixel-exact center crop, canvas rows 8..712
  * ``wan21-14b-480p``  832x480, 16fps  -- canvas crop (30, 8, 1250, 712) squeezed down

Both are normalized to a single 1280x704 / 24fps output so the overlays can be
designed once. The 480p clips get a vertical center crop to 832x458 (matching the
720p 1280:704 aspect) and are then scaled up.

Every HUD element is laid out directly in output space. Only world-anchored
markers go through ``Transform``, which maps a canvas point to output pixels.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

# State canvas the data was authored against.
CANVAS_W, CANVAS_H = 1280, 720

# Normalized output, shared by all nine clips.
OUT_W, OUT_H = 1280, 704
OUT_FPS = 24

# Frames of state per clip.
N_FRAMES = 720

# HUD safe area. Nothing should touch the frame edge -- broadcast and game HUDs
# both hold a margin, and it is what makes an overlay look placed rather than
# cropped. All nine designs lay out inside this inset.
SAFE = 52
SAFE_L = SAFE
SAFE_R = OUT_W - SAFE
SAFE_T = SAFE
SAFE_B = OUT_H - SAFE


@dataclass(frozen=True)
class Transform:
    """Affine canvas -> output mapping: ``X = x * sx + tx``, ``Y = y * sy + ty``."""

    sx: float
    tx: float
    sy: float
    ty: float

    def __call__(self, x: float, y: float) -> tuple[float, float]:
        return x * self.sx + self.tx, y * self.sy + self.ty

    def scale(self) -> float:
        """Mean linear scale, for sizing anchored glyphs."""
        return (self.sx + self.sy) * 0.5


# 720p: identity in x, canvas row 8 becomes output row 0.
T_720 = Transform(sx=1.0, tx=0.0, sy=1.0, ty=-8.0)

# 480p: canvas (30, 8)-(1250, 712) -> 832x480, center-cropped to 458 rows, up to 1280x704.
#   X = (x - 30) * 1280/1220
#   Y = ((y - 8) * 480/704 - 11) * 704/458
_SX_480 = 1280.0 / 1220.0
_SY_480 = (480.0 / 704.0) * (704.0 / 458.0)
T_480 = Transform(
    sx=_SX_480,
    tx=-30.0 * _SX_480,
    sy=_SY_480,
    ty=-8.0 * _SY_480 - 11.0 * (704.0 / 458.0),
)


def transform_for(kind: str) -> Transform:
    return T_720 if kind == "720p" else T_480


def project(matrix: list[float], point) -> tuple[float, float, float] | None:
    """Project a world point through a flattened row-major ``P @ V`` matrix.

    Returns canvas-space ``(x, y, depth)``, or ``None`` behind the camera.
    ``depth`` is NDC z; values outside -1..1 are off the near/far planes.
    """
    x, y, z = point[0], point[1], point[2]
    m = matrix
    cx = m[0] * x + m[1] * y + m[2] * z + m[3]
    cy = m[4] * x + m[5] * y + m[6] * z + m[7]
    cz = m[8] * x + m[9] * y + m[10] * z + m[11]
    cw = m[12] * x + m[13] * y + m[14] * z + m[15]
    if cw <= 1e-6:
        return None
    nx, ny, nz = cx / cw, cy / cw, cz / cw
    return (nx * 0.5 + 0.5) * CANVAS_W, (1.0 - (ny * 0.5 + 0.5)) * CANVAS_H, nz


def view_matrix(position, quaternion) -> list[float]:
    """Inverse of the camera's world matrix, row-major flat 16."""
    qx, qy, qz, qw = quaternion
    r = [
        [1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)],
        [2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw)],
        [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)],
    ]
    # Rotation is orthonormal, so the inverse is the transpose and the
    # translation is -R^T * t.
    t = position
    inv = [
        [r[0][0], r[1][0], r[2][0], 0.0],
        [r[0][1], r[1][1], r[2][1], 0.0],
        [r[0][2], r[1][2], r[2][2], 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ]
    for i in range(3):
        inv[i][3] = -(inv[i][0] * t[0] + inv[i][1] * t[1] + inv[i][2] * t[2])
    return [v for row in inv for v in row]


def mat_mul(a: list[float], b: list[float]) -> list[float]:
    """Multiply two row-major flat 4x4 matrices."""
    out = [0.0] * 16
    for i in range(4):
        for j in range(4):
            out[i * 4 + j] = sum(a[i * 4 + k] * b[k * 4 + j] for k in range(4))
    return out


def camera_matrix(camera: dict) -> list[float] | None:
    """Combined ``P @ V`` for a captured camera, or ``None`` for Canvas2D scenes."""
    if camera.get("type") == "Canvas2D":
        return None
    proj = camera["projectionMatrix"]
    # three.js serializes column-major; transpose to row-major.
    p = [proj[(i % 4) * 4 + (i // 4)] for i in range(16)]
    v = view_matrix(camera["position"], camera["quaternion"])
    return mat_mul(p, v)


def clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return lo if v < lo else hi if v > hi else v


def smoothstep(a: float, b: float, t: float) -> float:
    if b <= a:
        return 0.0 if t < a else 1.0
    x = clamp((t - a) / (b - a))
    return x * x * (3.0 - 2.0 * x)


def ease_out(t: float) -> float:
    t = clamp(t)
    return 1.0 - (1.0 - t) ** 3


def ease_in_out(t: float) -> float:
    t = clamp(t)
    return t * t * (3.0 - 2.0 * t)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def hypot(dx: float, dy: float) -> float:
    return math.hypot(dx, dy)
