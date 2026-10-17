"""The nine HUD renderers. One design per clip, driven by the state data.

Every renderer subclasses ``drawbase.Renderer`` and implements ``draw(d, ctx)``.
Design intent per clip is noted above each class. All work in the normalized
1280x704 output space; world-anchored marks go through ``ctx.transform`` /
``ctx.anchor``.
"""

from __future__ import annotations

import math

from drawbase import (D, Renderer, Ctx, font, text_w, tracked_w, mix, rgba, rgb,
                      plate, kicker, keycap, chip, keycap_art, input_cluster,
                      action_callout)
from geom import (OUT_W, OUT_H, SAFE, SAFE_L, SAFE_R, SAFE_T, SAFE_B,
                  clamp, smoothstep, ease_out, lerp)

# Short alias; every design lays out in the normalized output space, inside
# the SAFE_* inset so nothing touches the frame edge.
OUT = OUT_W

INK = (18, 22, 26)          # dark ink used on light scenes
PAPER = (243, 244, 241)     # light ink used on dark scenes
WHITE = (245, 246, 247)


# ===========================================================================
# 029 - FLAPPY BIRD  (2D side-scroller, 480p)
# ===========================================================================
# One-button game, so the HUD stays airy. Big outlined score top-center like an
# arcade cabinet, a slim altitude rail on the right whose bracket shows the gap
# to fly through, a ring that pops on the bird each flap, and the single SPACE
# key in the bottom-center input slot.

class Flappy(Renderer):
    # The scene is warm sepia/moss, so a warm accent disappears into it --
    # this one goes cool cyan for separation.
    ACC = (96, 214, 248)
    GOOD = (128, 240, 168)    # bird is lined up with the gap
    INK = (14, 18, 20)

    def draw(self, d: D, c: Ctx):
        T = c.transform
        hud = c.frame["hud"]
        m = {k: v for k, v in hud["metrics"]}
        score = int(m.get("GAPS PASSED", 0))
        flaps = int(m.get("FLAPS", 0))
        vs = str(m.get("VERTICAL SPEED", "0 PX/S")).replace(" PX/S", "")
        ground = T(0, self.p["meta"].get("ground", 654))[1]
        bird = self._bird(c)

        # --- score, top-center, arcade weight -----------------------------
        d.display(OUT / 2, SAFE_T - 6, str(score), font("ncd_heavy", 86), (255, 255, 255),
                  anchor="ma", a=250, ow=4, outline=(14, 18, 20),
                  glow=self.ACC, ga=95, gr=16)
        d.display(OUT / 2, SAFE_T + 84, "PIPES CLEARED", font("bold", 12), self.ACC,
                  anchor="ma", a=240, track=5, ow=2)

        # --- flaps + vertical speed, top-left -----------------------------
        x = SAFE_L
        d.display(x, SAFE_T + 2, "FLAPS", font("bold", 11), self.ACC, anchor="la",
                  a=236, track=4, ow=2)
        d.display(x, SAFE_T + 20, str(flaps), font("ncd_heavy", 36), (255, 255, 255),
                  anchor="la", a=248, ow=3)
        d.display(x, SAFE_T + 72, "V-SPEED", font("bold", 11), self.ACC, anchor="la",
                  a=236, track=4, ow=2)
        rising = vs.startswith("-")
        d.display(x, SAFE_T + 90, vs.lstrip("-"), font("ncd_heavy", 28), (255, 255, 255),
                  anchor="la", a=246, ow=3)
        # climb/dive chevron instead of a bare minus sign
        ax = x + text_w(font("ncd_heavy", 28), vs.lstrip("-")) + 14
        ay = SAFE_T + 106
        col = self.GOOD if rising else self.ACC
        for k in range(2):
            o = k * 7 * (1 if rising else -1)
            d.poly([(ax, ay + 5 - o), (ax + 11, ay + 5 - o),
                    (ax + 5.5, ay - 4 - o)] if rising else
                   [(ax, ay - 5 - o), (ax + 11, ay - 5 - o),
                    (ax + 5.5, ay + 4 - o)], col, a=230 - k * 70)

        self._alt_rail(d, c, bird, ground)
        self._flap_ring(d, c, bird)

        down = self._key_down(c, "flap")
        input_cluster(d, [{"label": "SPACE", "action": "FLAP", "down": down}], self.ACC)

    # -- altitude rail, right edge -----------------------------------------
    def _alt_rail(self, d: D, c: Ctx, bird, ground):
        T = c.transform
        x = SAFE_R - 8
        y0 = SAFE_T + 34
        y1 = min(ground, SAFE_B - 92)
        d.display(SAFE_R, y0 - 30, "ALT", font("bold", 11), self.ACC, anchor="ra",
                  a=234, track=4, ow=2)
        d.vline(x, y0, y1, (255, 255, 255), 95, 2)
        d.hline(x - 7, x + 7, y0, (255, 255, 255), 150, 2)
        d.hline(x - 7, x + 7, y1, (255, 255, 255), 150, 2)

        nxt = self._next_pipe(c)
        gy0 = gy1 = None
        if nxt:
            gy0 = clamp(T(0, nxt["top"])[1], y0, y1)
            gy1 = clamp(T(0, nxt["bottom"])[1], y0, y1)
            if gy1 > gy0:
                # gap bracket: the window to aim through
                d.rect(x - 9, gy0, 18, gy1 - gy0, self.ACC, a=52)
                for yy in (gy0, gy1):
                    d.hline(x - 12, x + 12, yy, self.ACC, 240, 3)
                d.vline(x - 12, gy0, gy1, self.ACC, 130, 1)
                d.vline(x + 12, gy0, gy1, self.ACC, 130, 1)
        if bird:
            by = clamp(T(bird[0], bird[1])[1], y0, y1)
            inside = gy0 is not None and gy0 + 2 < by < gy1 - 2
            col = self.GOOD if inside else self.ACC
            d.glow_shape(lambda g: g.circle(x, by, 6, fill=col, a=255), col,
                         a=130, radius=8)
            d.circle(x, by, 6, fill=(255, 255, 255), a=250)
            d.circle(x, by, 6, outline=self.INK, oa=220, lw=2)
            # tick out to the rail
            d.hline(x - 18, x - 11, by, col, 235, 2)

    # -- flap ring on the bird ---------------------------------------------
    def _flap_ring(self, d: D, c: Ctx, bird):
        if not bird:
            return
        T = c.transform
        bx, by = T(bird[0], bird[1])
        pop = 0.0
        for ev in c.frame["events"]:
            if ev["kind"] == "flap":
                pop = max(pop, 1.0 - clamp((c.time - ev["time"]) / 0.26))
        r = 22 + pop * 12
        if pop > 0.04:
            d.glow_shape(lambda g: g.circle(bx, by, r, outline=self.ACC, oa=255, lw=3),
                         self.ACC, a=int(150 * pop), radius=10)
            d.circle(bx, by, r, outline=self.ACC, oa=int(60 + pop * 195), lw=2)
            # updraft ticks under the bird
            for s in (-1, 0, 1):
                tx = bx + s * 13
                d.vline(tx, by + r * 0.6, by + r * 0.6 + 9 * pop, self.ACC,
                        int(pop * 210), 2)
        else:
            d.circle(bx, by, 22, outline=(255, 255, 255), oa=60, lw=1)

    def _bird(self, c: Ctx):
        for e in c.entities:
            if e["id"] == "bird":
                return e["position"]
        return None

    def _next_pipe(self, c):
        best = None
        for e in c.entities:
            if e["id"].startswith("pipe") and e.get("visible") and not e.get("passed"):
                if best is None or e["x"] < best["x"]:
                    best = e
        return best

    def _key_down(self, c, kid):
        for g in c.frame["controls"].get("groups", []):
            for k in g["keys"]:
                if k["id"] == kid:
                    return bool(k["down"])
        return False



# ===========================================================================
# 051 - TWO FIGHTER DUEL  (boxing / kickboxing, 480p)
# ===========================================================================
# Street Fighter / Tekken grammar: two skewed health bars draining toward the
# center with a damage trail, a round timer between them, and the two players'
# inputs split to the bottom corners (two-player game, so input cannot live in
# one centered cluster). No panels -- the bars ARE the frame.

class Duel(Renderer):
    P1 = (74, 162, 255)       # blue corner
    P2 = (255, 132, 48)       # orange corner
    GOLD = (255, 214, 96)
    DANGER = (255, 72, 60)

    # The name/HP labels are drawn 26px above BAR_Y, so the bar has to sit at
    # least that far inside the safe area or the labels poke out the top.
    BAR_Y = SAFE_T + 30
    BAR_H = 22
    BAR_W = 430
    SKEW = 10                 # parallelogram lean, like an arcade health bar
    VALUE_ON_NAME_ROW = False
    SEGMENTED = False

    def draw(self, d: D, c: Ctx):
        hud = c.frame["hud"]
        h = hud["health"]
        ko = self._ko(c)

        for i in (0, 1):
            self._bar(d, c, i, h[i])
        self._timer(d, c)

        if ko:
            self._ko_call(d, c, ko, "K.O.", 160, self.GOLD)

        self._keys(d, c, "PLAYER 1", SAFE_L, self.P1, left=True)
        self._keys(d, c, "PLAYER 2", SAFE_R, self.P2, left=False)

    # -- skewed health bar --------------------------------------------------
    def _bar(self, d: D, c: Ctx, i, st):
        left = i == 0
        accent = self.P1 if left else self.P2
        bw, by, bh, k = self.BAR_W, self.BAR_Y, self.BAR_H, self.SKEW
        bx = SAFE_L if left else SAFE_R - bw
        hp = clamp(st["value"] / max(1, st["max"]))
        trail = clamp(st.get("trail", st["value"]) / max(1, st["max"]))

        def quad(x0, x1, col, a):
            """Parallelogram slice; the lean always points at the center."""
            if x1 - x0 < 0.7:
                return
            s = k if left else -k
            d.poly([(x0 + s, by), (x1 + s, by), (x1, by + bh), (x0, by + bh)], col, a=a)

        # trough
        quad(bx, bx + bw, (10, 13, 16), 196)
        # damage trail sits behind the live fill
        if trail > hp:
            t0 = bx + bw * hp if left else bx + bw * (1 - trail)
            t1 = bx + bw * trail if left else bx + bw * (1 - hp)
            quad(t0, t1, (255, 246, 246), 150)
        fill = accent if hp > 0.28 else self.DANGER
        if hp > 0.002:
            f0 = bx if left else bx + bw * (1 - hp)
            f1 = bx + bw * hp if left else bx + bw
            quad(f0, f1, fill, 242)
            # top sheen
            s = k if left else -k
            d.line((f0 + s + 2, by + 3), (f1 + s - 2, by + 3), (255, 255, 255), 66, 2)
        if self.SEGMENTED:
            for sg in range(1, 10):
                sx = bx + bw * sg / 10
                s = k if left else -k
                d.line((sx + s, by + 1), (sx, by + bh - 1), (0, 0, 0), 80, 1)
        # frame on top of everything
        s = k if left else -k
        d.g.line([(bx + s, by), (bx + bw + s, by), (bx + bw, by + bh),
                  (bx, by + bh), (bx + s, by)],
                 fill=rgba((248, 250, 252), 170), width=2)
        if hp <= 0.28 and hp > 0:
            pulse = 0.5 + 0.5 * math.sin(c.time * 11)
            d.g.line([(bx + s, by), (bx + bw + s, by), (bx + bw, by + bh),
                      (bx, by + bh), (bx + s, by)],
                     fill=rgba(self.DANGER, int(90 + pulse * 140)), width=2)

        # name outboard, HP number inboard
        d.display(bx if left else bx + bw, by - 26, "PLAYER 1" if left else "PLAYER 2",
                  font("ncd_demi", 22), accent, anchor="la" if left else "ra",
                  a=250, ow=2, track=1)
        d.display(bx + bw if left else bx, by - 26, str(int(st["value"])),
                  font("ncd_heavy", 26), (255, 255, 255), anchor="ra" if left else "la",
                  a=250, ow=3)
        return bx, bw

    # -- round timer --------------------------------------------------------
    def _timer(self, d: D, c: Ctx):
        rem = max(0, 30 - int(c.time))
        cx = OUT / 2
        d.display(cx, self.BAR_Y - 30, "ROUND 1", font("bold", 10), (214, 220, 226),
                  anchor="ma", a=210, track=4, ow=2)
        low = rem <= 10
        d.display(cx, self.BAR_Y - 14, f"{rem:02d}", font("ncd_heavy", 46),
                  self.DANGER if low else (255, 255, 255), anchor="ma", a=252, ow=3,
                  glow=self.DANGER if low else None, ga=120, gr=12)

    def _ko_call(self, d: D, c: Ctx, ko, label, size, col):
        dt = c.time - ko
        sc = ease_out(clamp(dt / 0.2))
        a = int(255 * clamp(1 - dt / 2.4))
        fnt = font("impact", int(size * (0.6 + 0.4 * sc)))
        d.display(OUT / 2, OUT_H / 2 - size * 0.6, label, fnt, col, anchor="mm",
                  a=a, ow=4, outline=(12, 10, 8), glow=col, ga=150, gr=20, track=3)

    # -- per-player key row, bottom corner ----------------------------------
    def _keys(self, d: D, c: Ctx, label, x, accent, left):
        grp = next((g for g in c.frame["controls"]["groups"] if g["label"] == label), None)
        if not grp:
            return
        h = 40
        cy = SAFE_B - h
        order = ["left", "right", "punch", "kick", "guard", "special"]
        keys = {k["id"]: k for k in grp["keys"]}
        kf = font("bold", 14)
        caps = [(keys[o], max(44, text_w(kf, keys[o]["label"]) + 22))
                for o in order if o in keys]
        total = sum(w for _, w in caps) + 7 * (len(caps) - 1)

        d.display(x, cy - 32, label, font("bold", 11), accent,
                  anchor="la" if left else "ra", a=236, track=3, ow=2)
        cx = x if left else x - total
        for k, w in caps:
            down = bool(k["down"])
            act = k["action"]
            if act in ("LEFT", "RIGHT"):
                self._tri(d, cx + w / 2, cy - 11, -1 if act == "LEFT" else 1,
                          accent if down else (226, 231, 235), 245 if down else 170)
            else:
                d.display(cx + w / 2, cy - 17, self._abbr(act), font("bold", 10),
                          accent if down else (226, 231, 235), anchor="ma",
                          a=245 if down else 170, track=1, ow=2)
            keycap_art(d, cx, cy, w, h, k["label"], down, accent, size=14)
            cx += w + 7

    @staticmethod
    def _tri(d, x, y, dirn, col, a):
        """Move arrow. ``dirn`` -1 points left, +1 points right.

        The apex goes on the ``dirn`` side and the flat edge opposite it --
        the reverse put the apex away from the travel direction, so LEFT drew
        a right-pointing arrow and vice versa.
        """
        r = 5
        d.poly([(x - dirn * r, y - r), (x - dirn * r, y + r), (x + dirn * r, y)], col, a=a)

    @staticmethod
    def _abbr(action):
        return {"SPECIAL": "SPEC", "GUARD": "GRD"}.get(action, action)

    def _ko(self, c):
        for ev in self.p["meta"]["events"]:
            if ev["kind"] == "knockout" and ev["time"] <= c.time:
                return ev["time"]
        return None


# ===========================================================================
# 057 - ARCADE COMBO DUEL  (flashier fighter, 720p)
# ===========================================================================
# Same bones as the boxing duel, dressed up: segmented bars, a SUPER gauge per
# fighter that flashes READY, a live combo counter, and the move name as a
# drop-in callout rather than a static label.

class ArcadeDuel(Duel):
    P1 = (104, 198, 255)
    P2 = (255, 128, 64)
    GOLD = (255, 206, 72)

    BAR_W = 396              # narrower: the combo counters live inboard
    SEGMENTED = True
    VALUE_ON_NAME_ROW = True

    def draw(self, d: D, c: Ctx):
        hud = c.frame["hud"]
        h = hud["health"]
        ko = self._ko(c)

        for i in (0, 1):
            bx, bw = self._bar(d, c, i, h[i])
            left = i == 0
            sy = self.BAR_Y + self.BAR_H + 12
            sfrac = clamp(h[i].get("super", 0))
            # SUPER gauge, skewed to match the health bar
            gw = bw * 0.78
            gx = bx + (bw - gw) if not left else bx
            d.bar(gx, sy, gw, 9, sfrac, self.GOLD, a=232, bg=(10, 13, 16), bga=186,
                  edge=(248, 250, 252), ea=90, r=4, sheen=False)
            lab_x = bx if left else bx + bw
            d.display(lab_x, sy + 12, "SUPER", font("bold", 10), self.GOLD,
                      anchor="la" if left else "ra", a=218, track=3, ow=2)
            if sfrac >= 1:
                pulse = 0.5 + 0.5 * math.sin(c.time * 10)
                d.display(gx + gw if left else gx, sy + 12, "READY", font("bold", 10),
                          self.GOLD, anchor="ra" if left else "la",
                          a=int(190 + pulse * 65), track=3, ow=2)

            combo = h[i].get("hits", 0)
            if combo > 1:
                cxx = bx + bw + 26 if left else bx - 26
                anc = "la" if left else "ra"
                d.display(cxx, self.BAR_Y - 32, str(combo), font("impact", 44),
                          self.GOLD, anchor=anc, a=252, ow=3, glow=self.GOLD,
                          ga=110, gr=12)
                d.display(cxx, self.BAR_Y + 18, "HIT COMBO", font("bold", 10),
                          self.GOLD, anchor=anc, a=228, track=1, ow=2)

        self._timer(d, c)

        # move name drops in on each change
        action_callout(d, hud["status"], self.p["meta"]["status_onset"][c.index],
                       c.time, self.GOLD, hold=0.7, fade=0.35, size=44,
                       y_end=self.BAR_Y + 56)

        if ko:
            dt = c.time - ko
            if dt < 0.3:
                d.rect(0, 0, OUT, OUT_H, (255, 255, 255), a=int(104 * (1 - dt / 0.3)))
            self._ko_call(d, c, ko, "K.O.!", 196, self.GOLD)

        self._keys(d, c, "PLAYER 1", SAFE_L, self.P1, left=True)
        self._keys(d, c, "PLAYER 2", SAFE_R, self.P2, left=False)


# ===========================================================================
# ===========================================================================
# 059 - GODZILLA RAMPAGE  (kaiju vs city, aerial, 480p)
# ===========================================================================
# Kaiju disaster telemetry, all drawn art. A segmented atomic-breath coil on
# the left that ignites while the beam is out, a city-destruction readout
# top-right whose tower glyphs collapse one by one, and the two controls in
# the bottom-center cluster. Ember orange with a hot ember glow.

class Godzilla(Renderer):
    FIRE = (255, 112, 40)
    EMBER = (255, 198, 96)

    def draw(self, d: D, c: Ctx):
        hud = c.frame["hud"]
        m = {k: v for k, v in hud["metrics"]}
        buildings = str(m.get("BUILDINGS DOWN", "0 / 10"))
        breath = m.get("BREATH", "READY")
        status = hud["status"]
        firing = breath == "ACTIVE"

        self._coil(d, c, firing, breath)
        self._city(d, c, buildings)

        action_callout(d, status, self.p["meta"]["status_onset"][c.index], c.time,
                       self.FIRE, hold=1.1, size=50)

        grp = c.frame["controls"]["groups"]
        if grp:
            keys = {k["id"]: k for k in grp[0]["keys"]}
            cluster = []
            for kid, mouse in (("walk", False), ("fire", True)):
                k = keys.get(kid)
                if k:
                    cluster.append({"label": k["label"], "action": k["action"],
                                    "down": bool(k["down"]), "mouse": mouse})
            input_cluster(d, cluster, self.FIRE)

    # -- atomic breath coil, left ------------------------------------------
    def _coil(self, d: D, c: Ctx, firing, breath):
        # +10 clears the housing outline (drawn at x-6, 2px wide); the cells'
        # glow is safe-clipped in glow_shape, so it needs no extra budget.
        x, y, w = SAFE_L + 10, SAFE_T + 56, 28
        n = 8
        cell = 34
        h = n * cell
        # The label is far wider than the 28px column, so it hangs off the
        # left when centered on it -- anchor it to the safe line instead.
        d.display(SAFE_L, y - 30, "ATOMIC BREATH", font("bold", 11), self.FIRE,
                  anchor="la", a=240, track=2, ow=2)
        # outer housing, drawn as a frame rather than a filled panel
        d.outline(x - 6, y - 6, w + 12, h + 12, (248, 250, 252), a=120, lw=2, r=13)
        for k in range(n):
            yy = y + h - (k + 1) * cell
            lit = firing or k == 0        # one cell idles lit = "charged"
            col = mix(self.FIRE, self.EMBER, k / max(1, n - 1))
            if lit:
                pulse = (0.72 + 0.28 * math.sin(c.time * 12 - k)) if firing else 1.0
                a = int(236 * pulse)
                d.glow_shape(lambda g, yy=yy, col=col: g.plate(
                    x + 2, yy + 3, w - 4, cell - 7, r=6, fill=col, a=255),
                    col, a=int(110 * pulse), radius=9)
                d.plate(x + 2, yy + 3, w - 4, cell - 7, r=6, fill=col, a=a)
            else:
                d.outline(x + 2, yy + 3, w - 4, cell - 7, (248, 250, 252), a=52, lw=1, r=6)
        d.display(SAFE_L, y + h + 12, breath, font("ncd_heavy", 24),
                  self.EMBER if firing else (212, 218, 222), anchor="la", a=250, ow=3,
                  glow=self.FIRE if firing else None, ga=130, gr=12)

    # -- city destruction, top-right ---------------------------------------
    def _city(self, d: D, c: Ctx, buildings):
        n_done, n_tot = [int(v) for v in buildings.split("/")]
        x = SAFE_R
        y = SAFE_T + 2
        d.display(x, y, "CITY DESTRUCTION", font("bold", 11), self.FIRE, anchor="ra",
                  a=240, track=3, ow=2)
        # "7 / 10" as one right-aligned run: the count and the total were
        # overlapping when drawn as two separately-anchored pieces.
        bigf = font("ncd_heavy", 40)
        smallf = font("ncd_demi", 20)
        tot_s = f"/ {n_tot}"
        tot_w = text_w(smallf, tot_s)
        d.display(x, y + 40, tot_s, smallf, (224, 230, 234), anchor="rs", a=215, ow=2)
        d.display(x - tot_w - 9, y + 42, str(n_done), bigf, (255, 255, 255),
                  anchor="rs", a=250, ow=3)
        # tower glyphs, right-aligned, newest collapse on the left
        gw, gap = 17, 5
        base = y + 102
        total = n_tot * gw + (n_tot - 1) * gap
        x0 = x - total
        for i in range(n_tot):
            gx = x0 + i * (gw + gap)
            if i < n_done:
                # collapsed: rubble mound plus an ember cap
                d.poly([(gx, base), (gx + gw, base), (gx + gw - 3, base - 9),
                        (gx + 3, base - 9)], mix(self.FIRE, (40, 26, 20), 0.35), a=215)
                d.hline(gx + 1, gx + gw - 1, base - 10, self.EMBER, 180, 2)
            else:
                hgt = 46 - (i % 3) * 9
                d.rect(gx, base - hgt, gw, hgt, (28, 32, 36), a=176)
                d.outline(gx, base - hgt, gw, hgt, (248, 250, 252), a=120, lw=1)
                for wy in range(int(base - hgt) + 5, int(base) - 5, 10):
                    d.rect(gx + 4, wy, 3, 3, (236, 242, 246), a=110)



# 068 - SHIPWRECK RECOVERY  (sub vs octopus, underwater, 480p)
# ===========================================================================
# Sonar-flavored recovery HUD: a circular sonar sweep whose blips track the
# octopus and the treasure chest, a salvage objective checklist that ticks off,
# and a claw-state readout. Deep-teal sonar green with amber targets.

class Subwreck(Renderer):
    SON = (84, 230, 168)      # sonar green
    AMB = (252, 194, 84)      # neutral contact
    RED = (255, 96, 86)       # hostile contact
    DEEP = (10, 26, 30)

    def draw(self, d: D, c: Ctx):
        hud = c.frame["hud"]
        status = hud["status"]

        self._sonar(d, c)
        self._mission(d, c)
        self._claw(d, c)

        # current objective as a drop-in callout, not a boxed status line
        action_callout(d, status, self.p["meta"]["status_onset"][c.index], c.time,
                       self.SON, hold=1.3, size=46)

        grp = c.frame["controls"]["groups"]
        if grp:
            keys = [{"label": k["label"], "action": k["action"], "down": bool(k["down"])}
                    for k in grp[0]["keys"]]
            input_cluster(d, keys, self.SON)

    # -- sonar scope, drawn as art with no backing panel -------------------
    def _sonar(self, d: D, c: Ctx):
        R = 96
        cx, cy = SAFE_L + 98, SAFE_B - 112
        # glass well: a faint dark disc only inside the scope circle, so the
        # instrument reads as a lens on the scene rather than a grey rectangle
        d.circle(cx, cy, R, fill=(4, 18, 22), a=104)
        d.glow_shape(lambda g: g.circle(cx, cy, R, outline=self.SON, oa=255, lw=2),
                     self.SON, a=90, radius=10)
        d.circle(cx, cy, R, outline=self.SON, oa=215, lw=2)
        d.circle(cx, cy, R + 5, outline=self.SON, oa=55, lw=1)
        for rr in (R * 0.66, R * 0.33):
            d.circle(cx, cy, rr, outline=self.SON, oa=95, lw=1)
        d.line((cx - R + 4, cy), (cx + R - 4, cy), self.SON, 60, 1)
        d.line((cx, cy - R + 4), (cx, cy + R - 4), self.SON, 60, 1)
        # bearing ticks around the rim
        for deg in range(0, 360, 30):
            a = math.radians(deg)
            r0 = R - (9 if deg % 90 == 0 else 5)
            d.line((cx + r0 * math.cos(a), cy + r0 * math.sin(a)),
                   (cx + (R - 1) * math.cos(a), cy + (R - 1) * math.sin(a)),
                   self.SON, 150 if deg % 90 == 0 else 85, 1)
        d.circle(cx, cy, 2.6, fill=self.SON, a=245)

        # rotating sweep wedge with a decaying tail
        sweep = (c.time * 1.5) % (2 * math.pi)
        for k in range(22):
            a = sweep - k * 0.042
            d.line((cx, cy), (cx + (R - 3) * math.cos(a), cy + (R - 3) * math.sin(a)),
                   self.SON, int(118 * (1 - k / 22)), 2)

        sub = self._ent(c, "submarine")
        octo = self._ent(c, "octopus")
        chest = self._ent(c, "chest")
        scale = R / 16.0
        if sub and octo:
            dx = (octo["position"][0] - sub["position"][0]) * scale
            dz = (octo["position"][2] - sub["position"][2]) * scale
            hostile = bool(octo.get("pursuing"))
            self._blip(d, cx, cy, R, dx, dz, "OCTOPUS",
                       self.RED if hostile else self.AMB, c.time, kind="threat")
        if sub and chest:
            cpos = chest.get("position")
            held = chest.get("held") or cpos is None
            dx = dz = 0.0
            if not held:
                dx = (cpos[0] - sub["position"][0]) * scale
                dz = (cpos[2] - sub["position"][2]) * scale
            self._blip(d, cx, cy, R, dx, dz, "CARGO" if held else "CHEST",
                       self.SON, c.time, kind="cargo")

        d.display(cx, cy + R + 10, "SONAR", font("bold", 11), self.SON,
                  anchor="ma", a=235, track=4, ow=2)

    def _blip(self, d: D, cx, cy, R, dx, dz, label, col, t, kind="threat"):
        """Contact mark, clamped to the scope rim with a heading arrow."""
        dist = math.hypot(dx, dz)
        edge = dist > R - 10
        if edge:
            k = (R - 10) / dist
            dx, dz = dx * k, dz * k
        x, y = cx + dx, cy + dz
        pulse = 0.5 + 0.5 * math.sin(t * 6)
        a = int(205 + pulse * 50)
        d.glow_shape(lambda g: g.circle(x, y, 4.5, fill=col, a=255), col,
                     a=int(120 * (0.5 + pulse * 0.5)), radius=7)
        if kind == "cargo":
            d.poly([(x, y - 5), (x + 5, y), (x, y + 5), (x - 5, y)], col, a=a)
        else:
            d.circle(x, y, 4.4, fill=col, a=a)
        # expanding return ring
        rr = 7 + pulse * 7
        d.circle(x, y, rr, outline=col, oa=int(95 * (1 - pulse)), lw=1)
        if edge:
            # off-scope: point outward instead of pretending it is at the rim
            ang = math.degrees(math.atan2(dz, dx))
            d.arrow(x + 7 * math.cos(math.radians(ang)),
                    y + 7 * math.sin(math.radians(ang)), ang, 8, col, a=a, lw=2, head=4)
        d.display(x, y - 20, label, font("bold", 9), col, anchor="ma",
                  a=int(a * 0.95), track=1, ow=2)

    # -- mission checklist, top-right --------------------------------------
    def _mission(self, d: D, c: Ctx):
        steps = self.p["meta"]["objectives"]
        done = self.p["meta"]["objective_done"]
        rx = SAFE_R
        y = SAFE_T + 4
        d.display(rx, y, "MISSION", font("bold", 11), self.SON, anchor="ra",
                  a=240, track=4, ow=2)
        d.hline(rx - 150, rx, y + 20, self.SON, 110, 1)
        y += 34
        for i, s in enumerate(steps):
            is_done = done[i] <= c.time
            active = (i == 0 or done[i - 1] <= c.time) and not is_done
            col = self.SON if is_done else (self.AMB if active else (176, 184, 188))
            a = 252 if (is_done or active) else 150
            fnt = font("ncd_demi", 21 if not active else 23)
            d.display(rx - 26, y, s, fnt,
                      WHITE if is_done else (self.AMB if active else (196, 202, 206)),
                      anchor="ra", a=a, ow=2, outline=(8, 12, 14))
            # marker: filled check when done, pulsing ring while active
            mx, my = rx - 10, y + 11
            if is_done:
                d.circle(mx, my, 8, fill=self.SON, a=235)
                d.line((mx - 3.5, my), (mx - 0.5, my + 3.5), (8, 20, 22), 255, 2)
                d.line((mx - 0.5, my + 3.5), (mx + 4, my - 3), (8, 20, 22), 255, 2)
            elif active:
                pulse = 0.5 + 0.5 * math.sin(c.time * 5)
                d.circle(mx, my, 8, outline=self.AMB, oa=int(170 + pulse * 85), lw=2)
                d.circle(mx, my, 3, fill=self.AMB, a=int(190 + pulse * 65))
            else:
                d.circle(mx, my, 7, outline=(186, 194, 198), oa=120, lw=1)
            y += 36

    # -- claw gauge, bottom-right ------------------------------------------
    def _claw(self, d: D, c: Ctx):
        claw = self._ent(c, "claw")
        if claw is None:
            return
        cl = clamp(claw.get("closure", 0))
        lift = clamp(claw.get("lift", 0))
        rx = SAFE_R
        y = SAFE_B - 106
        d.display(rx, y, "CLAW", font("bold", 11), self.SON, anchor="ra",
                  a=235, track=4, ow=2)
        # two slim meters, right-aligned
        for lbl, v, yy in (("GRIP", cl, y + 24), ("LIFT", lift, y + 50)):
            d.display(rx - 126, yy + 4, lbl, font("bold", 9), (214, 220, 224),
                      anchor="ra", a=195, track=1, ow=2)
            d.bar(rx - 118, yy, 118, 9, v, self.SON, a=238,
                  bg=(6, 16, 18), bga=170, edge=self.SON, ea=95, r=4)
        # mechanical claw glyph that opens and closes with GRIP
        self._claw_glyph(d, rx - 150, y + 44, cl)

    def _claw_glyph(self, d: D, x, y, closure):
        spread = lerp(16, 3, closure)
        col = self.SON
        d.line((x, y - 14), (x, y - 5), col, 215, 2)
        for s in (-1, 1):
            d.line((x, y - 5), (x + s * spread, y + 4), col, 230, 2)
            d.line((x + s * spread, y + 4), (x + s * spread * 0.7, y + 12), col, 230, 2)

    def _ent(self, c, eid):
        for e in c.entities:
            if e["id"] == eid:
                return e
        return None


# ===========================================================================
# 076 - FOREST DRONE  (chase-cam quad through trees, cool green, 480p)
# ===========================================================================
# FPV flight telemetry: an artificial-horizon ladder that rolls with bank and
# shifts with speed, a heading tape across the top, route progress, and a
# bank indicator. Air-data cyan on the green scene. No keys -- it's an
# authored path, so the HUD leans into "autopilot telemetry".

class Drone(Renderer):
    CY = (124, 226, 248)
    AMB = (255, 196, 88)

    def draw(self, d: D, c: Ctx):
        m = {k: v for k, v in c.frame["hud"]["metrics"]}
        speed = str(m.get("SPEED", "0 SU/S")).replace(" SU/S", "")
        route = str(m.get("ROUTE", "0%"))
        bank = str(m.get("BANK", "0 DEG"))
        bank_deg = float(bank.replace(" DEG", ""))
        axis = c.frame["controls"].get("axis", {})
        bval = clamp(float(axis.get("value", 0.0)), -1, 1)

        self._heading_tape(d, c)
        self._reticle(d, c, bank_deg)
        self._telemetry(d, speed, route, bank_deg)
        self._bank_scale(d, bval)

        # Authored route: say so once, quietly, bottom-center where the input
        # cluster would otherwise sit.
        d.display(OUT / 2, SAFE_B - 16, "AUTOPILOT ROUTE  ·  NO MANUAL INPUT",
                  font("bold", 11), self.CY, anchor="ma", a=186, track=3, ow=2)

    # -- heading tape, top-center ------------------------------------------
    def _heading_tape(self, d: D, c: Ctx):
        half = 300
        cx = OUT / 2
        y = SAFE_T + 24
        hdg = self._heading(c)
        d.hline(cx - half, cx + half, y, (248, 250, 252), 110, 1)
        for deg in range(-60, 61, 10):
            wx = cx + deg / 60 * half
            major = deg % 30 == 0
            d.vline(wx, y - (10 if major else 5), y, self.CY, 170 if major else 95, 2 if major else 1)
            if major:
                d.display(wx, y - 30, self._compass(hdg + deg), font("bold", 12),
                          self.CY, anchor="ma", a=230, ow=2)
        # center index
        d.poly([(cx - 7, y + 3), (cx + 7, y + 3), (cx, y + 12)], self.AMB, a=248)
        d.display(cx, y + 18, f"{int(hdg) % 360:03d}", font("ncd_heavy", 22),
                  (255, 255, 255), anchor="ma", a=248, ow=3)

    # -- flight reticle, center, banks with roll ---------------------------
    def _reticle(self, d: D, c: Ctx, bank_deg):
        cx, cy = OUT / 2, OUT_H / 2 + 10
        roll = math.radians(bank_deg)
        ca, sa = math.cos(roll), math.sin(roll)
        # wings, with tip ticks that drop along the reticle's own "down" axis
        # (perpendicular to the wing, so they stay square as it banks)
        dnx, dny = -sa, ca
        for s in (-1, 1):
            x0, y0 = cx + s * 30 * ca, cy + s * 30 * sa
            x1, y1 = cx + s * 76 * ca, cy + s * 76 * sa
            d.line((x0, y0), (x1, y1), self.CY, 220, 2)
            d.line((x1, y1), (x1 + dnx * 10, y1 + dny * 10), self.CY, 180, 2)
        # Hub gets a glow: on a busy forest canopy a 2px ring vanishes.
        d.glow_shape(lambda g: g.circle(cx, cy, 7, outline=self.AMB, oa=255, lw=3),
                     self.AMB, a=120, radius=8)
        d.circle(cx, cy, 7, outline=self.AMB, oa=245, lw=2)
        d.circle(cx, cy, 1.8, fill=self.AMB, a=245)
        # roll pointer on a short arc above the reticle
        R = 92
        d.ring(cx, cy, R, 200, 340, 2, self.CY, 120)
        px = cx + R * math.sin(roll)
        py = cy - R * math.cos(roll)
        d.glow_shape(lambda g: g.circle(px, py, 4.5, fill=self.AMB, a=255),
                     self.AMB, a=120, radius=7)
        d.circle(px, py, 4.5, fill=self.AMB, a=248)

    # -- telemetry, right, label-over-value stack ---------------------------
    def _telemetry(self, d: D, speed, route, bank_deg):
        x = SAFE_R
        y = SAFE_T + 70
        rows = [("SPEED", speed, "SU/S", self.CY),
                ("ROUTE", route, None, self.CY),
                ("BANK", f"{bank_deg:+.0f}", "DEG", self.AMB)]
        vf = font("ncd_heavy", 38)
        uf = font("bold", 11)
        for lbl, val, unit, col in rows:
            d.display(x, y, lbl, font("bold", 11), col, anchor="ra", a=232, track=3, ow=2)
            # Unit sits to the LEFT of the value on the same baseline, so it
            # can never land on the digits.
            vw = text_w(vf, val)
            d.display(x, y + 18, val, vf, (255, 255, 255), anchor="ra", a=250, ow=3)
            if unit:
                d.display(x - vw - 10, y + 44, unit, uf, col, anchor="ra",
                          a=205, track=1, ow=2)
            if lbl == "ROUTE":
                rf = clamp(float(route.replace("%", "")) / 100.0)
                d.bar(x - 168, y + 54, 168, 7, rf, self.CY, a=238, bg=(8, 16, 20),
                      bga=170, edge=self.CY, ea=100, r=3, sheen=False)
            y += 84

    # -- bank scale, bottom-center ------------------------------------------
    def _bank_scale(self, d: D, bval):
        cx = OUT / 2
        y = SAFE_B - 52
        half = 150
        d.hline(cx - half, cx + half, y, (248, 250, 252), 115, 1)
        d.vline(cx, y - 8, y + 8, self.CY, 190, 2)
        for s in (-1, -0.5, 0.5, 1):
            d.vline(cx + s * half, y - 5, y + 5, self.CY, 115, 1)
        mx = cx + bval * half
        d.poly([(mx - 8, y - 17), (mx + 8, y - 17), (mx, y - 4)], self.AMB, a=248)
        d.display(cx, y + 10, "BANK", font("bold", 10), self.CY, anchor="ma",
                  a=212, track=4, ow=2)

    def _heading(self, c):
        for e in c.entities:
            if e["id"] == "vehicle":
                fx, fz = e["forward"][0], e["forward"][2]
                return math.degrees(math.atan2(fx, -fz))
        return 0.0

    def _compass(self, deg):
        pts = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        return pts[int((deg % 360) / 45 + 0.5) % 8]



# ===========================================================================
# 080 - FOREST CAR  (chase-cam rally through trees, warm, 480p)
# ===========================================================================
# Rally HUD: an analog speedometer arc, a tach-style drift indicator that kicks
# sideways while sliding, gear/route readout, and a steering wheel that turns
# with the DRIFT axis. Warm amber/redline accents.

class ForestCar(Renderer):
    AMB = (255, 172, 56)
    RED = (255, 76, 58)
    CY = (140, 226, 250)

    SPD_MAX = 34.0

    def draw(self, d: D, c: Ctx):
        m = {k: v for k, v in c.frame["hud"]["metrics"]}
        speed = float(str(m.get("SPEED", "0 SU/S")).replace(" SU/S", ""))
        route = str(m.get("ROUTE", "0%"))
        drift = float(str(m.get("DRIFT", "0 DEG")).replace(" DEG", ""))
        axis = c.frame["controls"].get("axis", {})
        dval = clamp(float(axis.get("value", 0.0)), -1, 1)

        self._dial(d, c, speed)
        self._stage(d, route)
        self._wheel(d, dval)
        self._drift(d, c, drift)

        # Authored route here too -- the steering readout is derived, not input.
        d.display(OUT / 2, SAFE_B - 16, "AUTHORED STAGE  ·  STEERING DERIVED",
                  font("bold", 11), self.AMB, anchor="ma", a=180, track=3, ow=2)

    # -- speed dial, bottom-right, drawn as a bare gauge --------------------
    def _dial(self, d: D, c: Ctx, spd):
        R = 74
        cx, cy = SAFE_R - R - 6, SAFE_B - R - 34
        a0, a1 = 144, 396
        frac = clamp(spd / self.SPD_MAX)
        red_at = 0.82
        # trough + redline
        d.ring(cx, cy, R, a0, a1, 9, (12, 15, 18), 180)
        d.ring(cx, cy, R, lerp(a0, a1, red_at), a1, 9, self.RED, 150)
        col = mix(self.AMB, self.RED, smoothstep(red_at - 0.08, 1.0, frac))
        if frac > 0.004:
            d.glow_shape(lambda g: g.ring(cx, cy, R, a0, lerp(a0, a1, frac), 9,
                                          col, 255), col, a=110, radius=10)
            d.ring(cx, cy, R, a0, lerp(a0, a1, frac), 9, col, 248)
        # outer rim + ticks
        d.circle(cx, cy, R + 7, outline=(248, 250, 252), oa=95, lw=1)
        for i in range(11):
            ang = math.radians(lerp(a0, a1, i / 10))
            major = i % 5 == 0
            r0 = R - (16 if major else 12)
            d.line((cx + r0 * math.cos(ang), cy + r0 * math.sin(ang)),
                   (cx + (R - 6) * math.cos(ang), cy + (R - 6) * math.sin(ang)),
                   (255, 255, 255), 170 if major else 105, 2 if major else 1)
        # needle
        nang = math.radians(lerp(a0, a1, frac))
        d.line((cx - 9 * math.cos(nang), cy - 9 * math.sin(nang)),
               (cx + (R - 20) * math.cos(nang), cy + (R - 20) * math.sin(nang)),
               (255, 255, 255), 250, 3)
        d.circle(cx, cy, 6, fill=(255, 255, 255), a=250)
        d.circle(cx, cy, 2.4, fill=(16, 20, 24), a=255)
        d.display(cx, cy + 16, str(int(round(spd))), font("ncd_heavy", 38),
                  (255, 255, 255), anchor="ma", a=250, ow=3)
        d.display(cx, cy + R + 14, "SU/S", font("bold", 11), self.AMB,
                  anchor="ma", a=228, track=4, ow=2)

    # -- stage progress, top-center -----------------------------------------
    def _stage(self, d: D, route):
        cx = OUT / 2
        y = SAFE_T + 6
        rf = clamp(float(route.replace("%", "")) / 100.0)
        half = 230
        d.display(cx, y, "FOREST RALLY", font("bold", 11), self.AMB, anchor="ma",
                  a=238, track=5, ow=2)
        # Title, then bar, then the STAGE/percent row -- each on its own band.
        bar_y = y + 28
        d.bar(cx - half, bar_y, half * 2, 10, rf, self.AMB, a=240,
              bg=(12, 15, 18), bga=180, edge=(248, 250, 252), ea=110, r=5)
        d.display(cx - half, bar_y + 16, "STAGE", font("bold", 10), (226, 232, 236),
                  anchor="la", a=200, track=3, ow=2)
        d.display(cx + half, bar_y + 14, route, font("ncd_heavy", 22), (255, 255, 255),
                  anchor="ra", a=248, ow=3)

    # -- steering wheel, bottom-left ----------------------------------------
    def _wheel(self, d: D, dval):
        wr = 50
        wx, wy = SAFE_L + wr + 6, SAFE_B - wr - 34
        rot = dval * 120
        d.circle(wx, wy, wr, outline=(18, 22, 26), oa=200, lw=10)
        d.circle(wx, wy, wr + 5, outline=(248, 250, 252), oa=100, lw=1)
        d.circle(wx, wy, wr - 5, outline=(248, 250, 252), oa=70, lw=1)
        for ang in (90, 210, 330):
            a2 = math.radians(ang + rot)
            d.line((wx, wy), (wx + wr * 0.82 * math.cos(a2), wy + wr * 0.82 * math.sin(a2)),
                   (236, 240, 244), 235, 6)
        a3 = math.radians(rot - 90)
        gx, gy = wx + wr * math.cos(a3), wy + wr * math.sin(a3)
        d.glow_shape(lambda g: g.circle(gx, gy, 6, fill=self.AMB, a=255),
                     self.AMB, a=130, radius=8)
        d.circle(gx, gy, 6, fill=self.AMB, a=250)
        d.circle(wx, wy, 9, fill=(18, 22, 26), a=235)
        d.display(wx, wy + wr + 14, "STEER", font("bold", 11), self.AMB,
                  anchor="ma", a=228, track=4, ow=2)

    # -- drift callout ------------------------------------------------------
    def _drift(self, d: D, c: Ctx, dv):
        if abs(dv) <= 6:
            return
        pulse = 0.5 + 0.5 * math.sin(c.time * 9)
        txt = f"DRIFT {dv:+.0f}"
        d.display(OUT / 2, SAFE_T + 86, txt, font("impact", 38), self.RED,
                  anchor="ma", a=int(205 + pulse * 50), track=2, ow=3,
                  glow=self.RED, ga=int(90 + pulse * 60), gr=14)



# ===========================================================================
# 081 - CAVE AXE COMBAT  (first-person melee, dark warm cave, 720p)
# ===========================================================================
# First-person melee: a crosshair dot, floating health pips over the spiders
# currently on screen (world-anchored), a strike readout, and a weapon card
# bottom-right with LMB + an axe glyph. Warm amber accent.

class CaveAxe(Renderer):
    AMB = (255, 180, 72)
    BLOOD = (236, 74, 62)

    def draw(self, d: D, c: Ctx):
        hud = c.frame["hud"]
        m = {k: v for k, v in hud["metrics"]}
        down = str(m.get("SPIDERS DOWN", "0 / 6"))
        strikes = str(m.get("STRIKES", "0 / 12"))
        axe = str(m.get("AXE", "READY"))

        self._crosshair(d, c)
        self._threats(d, c)
        self._tally(d, down, strikes)
        self._weapon(d, c, axe)
        self._feedback(d, c)

        grp = c.frame["controls"]["groups"]
        if grp:
            k = grp[0]["keys"][0]
            input_cluster(d, [{"label": k["label"], "action": k["action"],
                               "down": bool(k["down"]), "mouse": True}], self.AMB)

    # -- crosshair ----------------------------------------------------------
    def _crosshair(self, d: D, c: Ctx):
        cx, cy = OUT / 2, OUT_H / 2
        swinging = any(a["type"] in ("SWING", "AXE SWING") for a in c.frame["actions"])
        gap = 9 if not swinging else 13
        ln = 9 if not swinging else 13
        for ang in (0, 90, 180, 270):
            a = math.radians(ang)
            d.line((cx + gap * math.cos(a), cy + gap * math.sin(a)),
                   (cx + (gap + ln) * math.cos(a), cy + (gap + ln) * math.sin(a)),
                   (255, 255, 255), 215, 2)
            d.line((cx + gap * math.cos(a) + 1, cy + gap * math.sin(a) + 1),
                   (cx + (gap + ln) * math.cos(a) + 1, cy + (gap + ln) * math.sin(a) + 1),
                   (10, 12, 14), 110, 2)
        d.circle(cx, cy, 1.8, fill=(255, 255, 255), a=235)

    # -- world-anchored spider markers --------------------------------------
    def _threats(self, d: D, c: Ctx):
        for e in c.entities:
            if not e["id"].startswith("spider") or not e.get("alive"):
                continue
            p = e.get("renderPose", {}).get("worldPosition") or e.get("position")
            a = c.anchor(p)
            if not a:
                continue
            sx, sy, depth = a
            if not (-30 < sx < OUT + 30 and -30 < sy < OUT_H + 30):
                continue
            sc = clamp(1.6 / max(0.6, depth + 1.2), 0.45, 1.5)
            hits = max(0, e.get("requiredHits", 2) - e.get("hitsReceived", 0))
            # Marker floats above the spider, but distant ones sit high in
            # frame -- clamp so the caret and its pips stay inside the safe
            # area instead of riding off the top edge.
            yy = max(sy - 34 * sc, SAFE_T + 22 * sc)
            # caret + health pips, no boxes
            r = 7 * sc
            d.poly([(sx - r, yy - r * 0.8), (sx + r, yy - r * 0.8), (sx, yy + r * 0.9)],
                   self.BLOOD, a=235)
            d.g.line([(sx - r, yy - r * 0.8), (sx + r, yy - r * 0.8),
                      (sx, yy + r * 0.9), (sx - r, yy - r * 0.8)],
                     fill=rgba((12, 10, 10), 180), width=1)
            pw = 7 * sc
            x0 = sx - (hits - 1) * pw / 2 if hits else sx
            for i in range(hits):
                d.circle(x0 + i * pw, yy - r * 2.1, 2.3 * sc, fill=self.BLOOD, a=245)
                d.circle(x0 + i * pw, yy - r * 2.1, 2.3 * sc, outline=(14, 10, 10),
                         oa=140, lw=1)

    # -- clearance tally, top-left ------------------------------------------
    def _tally(self, d: D, down, strikes):
        x = SAFE_L
        y = SAFE_T + 2
        d.display(x, y, "CAVE CLEARANCE", font("bold", 11), self.AMB, anchor="la",
                  a=240, track=3, ow=2)
        d.display(x, y + 20, down, font("ncd_heavy", 34), (255, 255, 255),
                  anchor="la", a=250, ow=3)
        d.display(x, y + 66, "SPIDERS", font("bold", 10), (224, 230, 234),
                  anchor="la", a=200, track=2, ow=2)
        x2 = x + 136
        d.display(x2, y + 20, strikes, font("ncd_heavy", 34), (255, 255, 255),
                  anchor="la", a=250, ow=3)
        d.display(x2, y + 66, "STRIKES", font("bold", 10), (224, 230, 234),
                  anchor="la", a=200, track=2, ow=2)

    # -- weapon readout, bottom-right ---------------------------------------
    def _weapon(self, d: D, c: Ctx, axe):
        x = SAFE_R
        y = SAFE_B - 76
        ready = axe == "READY"
        d.display(x, y, "STONE AXE", font("ncd_demi", 24), (255, 255, 255),
                  anchor="ra", a=248, ow=3)
        d.display(x, y + 30, axe, font("bold", 11), self.AMB if ready else (236, 190, 120),
                  anchor="ra", a=232, track=3, ow=2)
        # Glyph clears the widest text in the block rather than a guessed inset.
        name_w = text_w(font("ncd_demi", 24), "STONE AXE")
        self._axe_glyph(d, x - name_w - 44, y + 22)

    def _axe_glyph(self, d: D, x, y):
        d.line((x - 13, y + 19), (x + 10, y - 17), (208, 166, 118), 245, 5)
        d.line((x - 13, y + 19), (x + 10, y - 17), (60, 42, 26), 110, 1)
        d.poly([(x + 2, y - 22), (x + 25, y - 13), (x + 25, y + 3), (x + 4, y + 7),
                (x + 11, y - 6)], self.AMB, a=245)
        d.g.line([(x + 2, y - 22), (x + 25, y - 13), (x + 25, y + 3), (x + 4, y + 7),
                  (x + 11, y - 6), (x + 2, y - 22)],
                 fill=rgba((16, 12, 10), 190), width=1)

    # -- hit flashes and kill banner ----------------------------------------
    def _feedback(self, d: D, c: Ctx):
        cx, cy = OUT / 2, OUT_H / 2
        for ev in c.frame["events"]:
            if ev["kind"] == "axe-hit":
                dt = c.time - ev["time"]
                if 0 <= dt < 0.26:
                    p = 1 - dt / 0.26
                    r0 = 14 + (1 - p) * 34
                    for ang in range(0, 360, 45):
                        a2 = math.radians(ang)
                        d.line((cx + r0 * math.cos(a2), cy + r0 * math.sin(a2)),
                               (cx + (r0 + 12) * math.cos(a2), cy + (r0 + 12) * math.sin(a2)),
                               self.AMB, int(235 * p), 3)
            if ev["kind"] == "spider-defeated":
                dt = c.time - ev["time"]
                if 0 <= dt < 1.2:
                    a = int(245 * (1 - dt / 1.2))
                    d.display(cx, cy - 72 - dt * 26, "SPIDER DOWN",
                              font("impact", 34), self.AMB, anchor="mm", a=a,
                              track=3, ow=3, glow=self.AMB, ga=110, gr=12)



# ===========================================================================
# 088 - FREEZE GUN CROSSING  (first-person platformer over lava, 720p)
# ===========================================================================
# First-person traversal: an ice crosshair that charges while the beam is out,
# a row of ice-pad crystals that fill as the path is built, a beam/charge
# meter, and FREEZE/JUMP keys. Cold cyan accent.

class FreezeLava(Renderer):
    ICE = (96, 216, 250)
    FROST = (196, 240, 255)

    def draw(self, d: D, c: Ctx):
        hud = c.frame["hud"]
        m = {k: v for k, v in hud["metrics"]}
        pads = str(m.get("ICE PADS", "0 / 9"))
        landings = str(m.get("LANDINGS", "0 / 10"))
        beam = m.get("BEAM", "OFF")
        status = hud["status"]
        firing = beam == "ON"

        charge = 0.0
        for a in c.frame["actions"]:
            if a["type"] == "FREEZE":
                charge = max(charge, clamp(a.get("progress", 0)))

        self._crosshair(d, c, firing, charge)
        self._ice_path(d, c, pads)
        self._beam(d, c, firing, charge)
        self._landings(d, landings)

        action_callout(d, status, self.p["meta"]["status_onset"][c.index], c.time,
                       self.ICE, hold=1.0, size=48)

        grp = c.frame["controls"]["groups"]
        if grp:
            keys = {k["id"]: k for k in grp[0]["keys"]}
            cluster = []
            for kid, mouse in (("fire", True), ("jump", False)):
                k = keys.get(kid)
                if k:
                    cluster.append({"label": k["label"], "action": k["action"],
                                    "down": bool(k["down"]), "mouse": mouse})
            input_cluster(d, cluster, self.ICE)

    # -- six-point ice crosshair -------------------------------------------
    def _crosshair(self, d: D, c: Ctx, firing, charge):
        cx, cy = OUT / 2, OUT_H / 2
        base = 15
        reach = base + charge * 11
        if firing:
            d.glow_shape(lambda g: g.circle(cx, cy, reach * 0.8, outline=self.ICE,
                                            oa=255, lw=3),
                         self.ICE, a=130, radius=12)
        for k in range(6):
            a = math.radians(k * 60 - 90)
            r0, r1 = 6, reach
            d.line((cx + r0 * math.cos(a), cy + r0 * math.sin(a)),
                   (cx + r1 * math.cos(a), cy + r1 * math.sin(a)),
                   self.FROST if firing else self.ICE, 240 if firing else 170, 2)
            # frost barbs, like a snowflake arm
            if firing:
                mr = r1 * 0.62
                for s in (-1, 1):
                    ba = a + s * 0.5
                    d.line((cx + mr * math.cos(a), cy + mr * math.sin(a)),
                           (cx + (mr + 5) * math.cos(ba), cy + (mr + 5) * math.sin(ba)),
                           self.FROST, 200, 1)
        d.circle(cx, cy, 2.1, fill=self.FROST, a=245)
        if charge > 0.01:
            d.ring(cx, cy, reach + 7, -90, -90 + 360 * charge, 3, self.FROST, 245)

    # -- ice path: a stepping-stone trail, top-center -----------------------
    def _ice_path(self, d: D, c: Ctx, pads):
        # Top-left, under the beam column's headroom: the bottom-center strip
        # belongs to the input cluster alone.
        n_done, n_tot = [int(x) for x in pads.split("/")]
        step = 30
        x0 = SAFE_L + 66
        y = SAFE_T + 30
        row_w = (n_tot - 1) * step
        d.hline(x0, x0 + row_w, y, (226, 242, 248), 70, 1)
        if n_done > 1:
            d.hline(x0, x0 + step * (n_done - 1), y, self.ICE, 210, 2)
        for i in range(n_tot):
            self._crystal(d, x0 + i * step, y, 9, i < n_done, i == n_done, c.time)
        d.display(x0 - 2, y - 34, "ICE PATH", font("bold", 11), self.ICE,
                  anchor="la", a=238, track=4, ow=2)
        d.display(x0 + row_w + 16, y - 11, f"{n_done}/{n_tot}", font("ncd_heavy", 22),
                  WHITE, anchor="la", a=244, ow=2)

    def _crystal(self, d: D, x, y, r, filled, active, t=0.0):
        pts = [(x, y - r), (x + r * 0.72, y), (x, y + r), (x - r * 0.72, y)]
        if filled:
            d.glow_shape(lambda g: g.poly(pts, self.ICE, a=255), self.ICE,
                         a=95, radius=7)
            d.poly(pts, self.ICE, a=240, outline=self.FROST, oa=215)
            d.poly([(x, y - r * 0.46), (x + r * 0.33, y), (x, y + r * 0.46),
                    (x - r * 0.33, y)], self.FROST, a=215)
        else:
            pulse = (0.5 + 0.5 * math.sin(t * 7)) if active else 0.0
            d.poly(pts, (16, 26, 32), a=150,
                   outline=self.ICE if active else (210, 228, 236),
                   oa=int(130 + pulse * 115) if active else 95)

    # -- beam charge, left, framed as a cryo tank ---------------------------
    def _beam(self, d: D, c: Ctx, firing, charge):
        x, y, w, h = SAFE_L + 4, 196, 24, 250
        level = (0.84 + 0.1 * math.sin(c.time * 12)) if firing else 0.14
        d.plate(x, y, w, h, r=11, fill=(8, 18, 24), a=168,
                line=(226, 242, 248), la=120, lw=2)
        fh = (h - 6) * level
        col = self.FROST if firing else mix(self.ICE, (28, 40, 46), 0.45)
        if firing:
            d.glow_shape(lambda g: g.plate(x + 3, y + h - 3 - fh, w - 6, fh, r=8,
                                           fill=col, a=255),
                         self.ICE, a=120, radius=11)
        d.plate(x + 3, y + h - 3 - fh, w - 6, fh, r=8, fill=col, a=238)
        for s in range(1, 6):
            ty = y + h * s / 6
            d.hline(x - 5, x - 1, ty, (226, 242, 248), 120, 1)
        # Both labels are wider than the 24px tank, so they anchor to the safe
        # line rather than centering on the column.
        d.display(SAFE_L, y - 26, "BEAM", font("bold", 11), self.ICE,
                  anchor="la", a=238, track=3, ow=2)
        d.display(SAFE_L, y + h + 8, "ON" if firing else "OFF",
                  font("ncd_heavy", 22), self.FROST if firing else (206, 216, 222),
                  anchor="la", a=248, ow=2)

    def _landings(self, d: D, landings):
        x = SAFE_R
        d.display(x, SAFE_T + 4, "LANDINGS", font("bold", 11), self.ICE, anchor="ra",
                  a=236, track=4, ow=2)
        d.display(x, SAFE_T + 22, landings, font("ncd_heavy", 34), WHITE,
                  anchor="ra", a=248, ow=3)


# lookup --------------------------------------------------------------------

RENDERERS = {
    "029": Flappy,
    "051": Duel,
    "057": ArcadeDuel,
    "059": Godzilla,
    "068": Subwreck,
    "076": Drone,
    "080": ForestCar,
    "081": CaveAxe,
    "088": FreezeLava,
}
