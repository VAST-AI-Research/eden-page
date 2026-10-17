"""Extract exactly the per-clip state each HUD needs.

``state.json`` runs 2 MB .. 192 MB per clip, so nothing here keeps a whole file
around. We stream the frames we need, pull the handful of fields the design
uses, and cache a compact per-clip bundle as JSON in ``build/prepared/``.

What lands in a bundle:
  * ``frames``   -- the overlay-data frame list (hud / controls / actions / events)
  * ``entities`` -- per-frame, only the entity fields a design reads
  * ``cams``     -- per-frame P@V matrix, for the two world-anchored designs
  * ``meta``     -- derived series (health trails, super meters, objectives)
"""

from __future__ import annotations

import json
import os

from geom import camera_matrix, clamp, N_FRAMES

# Entity fields each clip's design actually reads. Everything else is dropped
# before the bundle is written, which is what keeps the big scenes tractable.
ENTITY_FIELDS = {
    "029": {"bird": ("position",), "pipe": ("x", "top", "bottom", "width", "visible", "passed")},
    # The two duels and Godzilla are driven entirely by hud/controls/events,
    # so they need no entity extraction at all (and 059's state.json is 192 MB).
    "051": {},
    "057": {},
    "059": {},
    "068": {
        "submarine": ("position",),
        "octopus": ("position", "awake", "pursuing"),
        "chest": ("position", "held"),
        "claw": ("reach", "closure", "lift"),
    },
    "076": {"vehicle": ("position", "forward", "speed", "bank", "altitude")},
    "080": {"vehicle": ("position", "forward", "speed", "yaw")},
    "081": {"spider": ("position", "alive", "visible", "hitsReceived", "requiredHits"),
            "axe": ("swinging",)},
    "088": {"player": ("position", "jumping", "jumpProgress"),
            "pad": ("position", "growth", "melt", "visible", "permanent")},
}

NEEDS_CAMERA = {"081"}  # only CaveAxe anchors marks to world geometry


def _keep_entity(clip_id: str, ent: dict) -> dict | None:
    spec = ENTITY_FIELDS.get(clip_id) or {}
    eid = ent.get("id", "")
    fields = None
    for prefix, f in spec.items():
        if eid == prefix or eid.startswith(prefix + "-"):
            fields = f
            break
    if fields is None:
        return None
    out = {"id": eid}
    for k in fields:
        if k in ent:
            out[k] = ent[k]
    # CaveAxe needs the captured world pose for accurate anchoring.
    if clip_id == "081" and eid.startswith("spider"):
        pose = ent.get("renderPose")
        if isinstance(pose, dict) and "worldPosition" in pose:
            out["renderPose"] = {"worldPosition": pose["worldPosition"]}
    return out


def _health_series(frames: list) -> list:
    """Per-frame health plus a lagged 'trail' and a derived super meter.

    ``trail`` is the value from 8 frames back, which is what makes the white
    recent-damage sliver appear behind the bar. ``super`` charges with hits
    landed and is purely a display model, like the health model it rides on.
    """
    out = []
    for i, f in enumerate(frames):
        h = f["hud"].get("health")
        if not h:
            out.append(None)
            continue
        prev = frames[max(0, i - 8)]["hud"]["health"]
        row = []
        for side in (0, 1):
            hits = h[side].get("hits", 0)
            row.append({
                "value": h[side]["value"],
                "max": h[side]["max"],
                "hits": hits,
                "trail": prev[side]["value"],
                # 4 landed hits fills the meter; caps at 1.
                "super": clamp(hits / 4.0),
            })
        out.append(row)
    return out


# 068: the recovery mission reads as a checklist. Times come from the
# event catalog so the ticks land on real beats.
SUBWRECK_STEPS = [
    ("REACH WRECK", "pickup-reach"),
    ("GRAB CHEST", "pickup-held"),
    ("LIFT TREASURE", "pickup-lifted"),
    ("ESCAPE OCTOPUS", "escape-start"),
]


def prepare(clip: dict, src_root: str, cache_dir: str, force: bool = False) -> dict:
    cid = clip["id"]
    os.makedirs(cache_dir, exist_ok=True)
    cache = os.path.join(cache_dir, f"{cid}.json")
    if os.path.exists(cache) and not force:
        with open(cache) as fh:
            return json.load(fh)

    folder = os.path.join(src_root, clip["folder"])
    with open(os.path.join(folder, "overlay-data.json")) as fh:
        od = json.load(fh)
    frames = od["frames"]

    need_ent = bool(ENTITY_FIELDS.get(cid))
    need_cam = cid in NEEDS_CAMERA

    entities = [[] for _ in range(len(frames))]
    cams = [None] * len(frames)
    meta: dict = {"title": od["title"], "type": od["type"]}

    if need_ent or need_cam:
        with open(os.path.join(folder, "state.json")) as fh:
            st = json.load(fh)
        for i, sf in enumerate(st["frames"][: len(frames)]):
            if need_ent:
                kept = []
                for e in sf.get("entities", []):
                    k = _keep_entity(cid, e)
                    if k is not None:
                        kept.append(k)
                entities[i] = kept
            if need_cam:
                cams[i] = camera_matrix(sf["camera"])
        defs = st.get("definitions", {})
        if cid == "029":
            meta["ground"] = defs.get("GROUND_Y", 654)
            meta["bird_x"] = defs.get("BIRD_X", 350)
        if cid in ("076", "080"):
            meta["route_length"] = defs.get("ROUTE_LENGTH")
        del st

    # events: flat catalog, used for one-shot flourishes (KO, hits, flaps)
    meta["events"] = [e for f in frames for e in f["events"]]

    if od["type"] in ("duel", "arcadeduel"):
        series = _health_series(frames)
        for f, h in zip(frames, series):
            if h:
                f["hud"]["health"] = h

    if cid == "068":
        times = {}
        for e in meta["events"]:
            times.setdefault(e["kind"], e["time"])
        meta["objectives"] = [lbl for lbl, _ in SUBWRECK_STEPS]
        meta["objective_done"] = [times.get(k, 1e9) for _, k in SUBWRECK_STEPS]

    # When did the status word last change? The drop-in action callout fires
    # on transitions, so it needs the onset time, not just the current value.
    meta["status_onset"] = _status_onsets(frames)

    return _write(cache, {
        "id": cid,
        "frames": frames,
        "entities": entities,
        "cams": cams,
        "meta": meta,
    })


def _status_onsets(frames: list) -> list:
    """For each frame, the time the current ``hud.status`` first appeared."""
    out = []
    cur = None
    onset = 0.0
    for f in frames:
        s = f["hud"]["status"]
        if s != cur:
            cur = s
            onset = f["time"]
        out.append(onset)
    return out


def _write(cache: str, bundle: dict) -> dict:
    with open(cache, "w") as fh:
        json.dump(bundle, fh)
    return bundle

