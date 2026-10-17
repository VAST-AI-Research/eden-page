"""The nine clips: where each source lives, and its source geometry.

``kind`` drives normalization (see ``geom``):
  720p -- 1280x704 @24fps, an exact center crop of the 1280x720 state canvas
  480p -- 832x480 @16fps, a squeezed crop of that same canvas

``stills`` names frames worth putting on a contact sheet -- beats where the
design has something to show (a KO, a hit, a full meter), not arbitrary marks.
"""

from __future__ import annotations

import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ART = os.path.join(ROOT, "artifacts")

SRC_STATE = os.path.join(ART, "selected-9-state-ui")
SRC_ALIGNED = os.path.join(ART, "edenlive-aligned")
SRC_WIPE = os.path.join(ART, "edenlive-wipe-480")


CLIPS = [
    {
        "id": "029", "slug": "flappy", "folder": "029-flappy",
        "dir": "029-flappy-bird___839cc9", "file": "wan21-14b-480p.mp4",
        "kind": "480p", "title": "FLAPPY BIRD",
        "stills": [96, 232, 448, 636],
    },
    {
        "id": "051", "slug": "duel", "folder": "051-duel",
        "dir": "051-两人对打___47c973", "file": "wan21-14b-480p.mp4",
        "kind": "480p", "title": "TWO FIGHTER DUEL",
        # 110 = first cross lands, 400 = mid-round, 657 = just after the KO
        "stills": [110, 400, 560, 660],
    },
    {
        "id": "057", "slug": "arcadeduel", "folder": "057-arcadeduel",
        "dir": "057-双人对打_激烈格斗版本____9c498c", "file": "wan22-720p.mp4",
        "kind": "720p", "title": "ARCADE COMBO DUEL",
        "stills": [150, 380, 540, 662],
    },
    {
        "id": "059", "slug": "godzilla", "folder": "059-godzilla",
        "dir": "059-哥斯拉喷火毁灭原始草原上的原始建筑___bbbd42", "file": "wan21-14b-480p.mp4",
        "kind": "480p", "title": "GODZILLA RAMPAGE",
        "stills": [120, 300, 470, 650],
    },
    {
        "id": "068", "slug": "subwreck", "folder": "068-subwreck",
        "dir": "068-小潜艇穿进沉船___5fa369", "file": "wan21-14b-480p.mp4",
        "kind": "480p", "title": "SHIPWRECK RECOVERY",
        "stills": [140, 330, 500, 660],
    },
    {
        "id": "076", "slug": "drone", "folder": "076-drone",
        "dir": "076-无人机在森林中穿梭___13489b", "file": "wan21-14b-480p.mp4",
        "kind": "480p", "title": "FOREST DRONE",
        "stills": [100, 280, 460, 640],
    },
    {
        "id": "080", "slug": "forestcar", "folder": "080-forestcar",
        "dir": "080-汽车在森林间穿梭___da4103", "file": "wan21-14b-480p.mp4",
        "kind": "480p", "title": "FOREST CAR",
        "stills": [100, 300, 480, 650],
    },
    {
        "id": "081", "slug": "caveaxe", "folder": "081-caveaxe",
        "dir": "081-洞穴劈砍蜘蛛___a84497", "file": "wan22-720p.mp4",
        "kind": "720p", "title": "CAVE AXE COMBAT",
        "stills": [200, 320, 470, 620],
    },
    {
        "id": "088", "slug": "freezelava", "folder": "088-freezelava",
        "dir": "088-第一人称冰冻枪在岩浆上造路___6edb22", "file": "wan22-720p.mp4",
        "kind": "720p", "title": "FREEZE GUN CROSSING",
        "stills": [80, 260, 440, 640],
    },
]

BY_ID = {c["id"]: c for c in CLIPS}


def resolve_source(clip: dict, which: str = "fine") -> str:
    """Path to the clip's video.

    ``fine``  -- the generated result (what the user called the proxy-fine video)
    ``proxy`` -- the Three.js render the state was authored on
    ``wipe``  -- the proxy-to-fine wipe comparison
    """
    if which == "proxy":
        return os.path.join(SRC_ALIGNED, clip["dir"], "proxy-" + clip["file"])
    if which == "wipe":
        return os.path.join(SRC_WIPE, clip["dir"], clip["file"])
    return os.path.join(SRC_ALIGNED, clip["dir"], clip["file"])
