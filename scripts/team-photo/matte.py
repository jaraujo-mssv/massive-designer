# /// script
# requires-python = ">=3.10"
# dependencies = ["pymatting==1.1.16", "pillow==13.0.0", "scipy==1.18.1", "numpy==2.5.5"]
# ///
# Alpha matting for the Team Photo cut-outs, so hair comes out strand by strand. Run by
# scripts/team-photo/cutouts.mjs through uv, which installs the pinned libraries in its own cache:
#
#   uv run --script scripts/team-photo/matte.py <dir> <id> [<id> …]
#
# For each id, reads <dir>/<id>-rgb.png (the square crop) and <dir>/<id>-alpha.png (Vision's
# person mask, same size), writes <dir>/<id>-matte.png (RGBA) and prints one JSON line:
# {"id", "ok": true} or {"id", "error"}.
#
# Vision's mask only guides it:
# 1. Its inside, shrunk, is the person and its outside, grown, the backdrop. The band between,
#    about 2.5% of the side either way, is solved from the pixels (closed-form matting).
# 2. In that band, a pixel the colour of the backdrop around it is backdrop, whatever the
#    matting said, unless the matting is sure it's the person; faint leftovers near zero go too.
# 3. Small see-through holes walled in by the person (a highlight blown out to the backdrop's
#    white) are the person: backdrop always reaches the outside.
# 4. The hair's own colour is estimated where the backdrop showed through it, so no light halo
#    is left on a coloured ground.
import json
import sys
from contextlib import redirect_stdout

import numpy as np
from PIL import Image
from pymatting import estimate_alpha_cf, estimate_foreground_ml
from scipy import ndimage

# Shares of the side (tuned at 1080 px: 26 and 28 px).
INNER = 0.024
OUTER = 0.026
# How far from the backdrop's colour (0–1, in the furthest channel) a pixel starts to be the person.
KEY_FROM, KEY_RAMP = 0.03, 0.10
# Alpha the matting is sure of, kept whatever its colour (bright highlights in the hair).
SURE = 0.9
# Alpha below this is backdrop.
FLOOR = 0.06
# Holes up to this share of the image are filled.
HOLE = 0.0005


def disk(r):
    return np.add.outer(np.arange(-r, r + 1) ** 2, np.arange(-r, r + 1) ** 2) <= r * r


def matte(rgb, a0):
    side = a0.shape[0]
    person = ndimage.binary_erosion(a0 > 0.9, structure=disk(max(1, round(side * INNER))))
    backdrop = ~ndimage.binary_dilation(a0 > 0.1, structure=disk(max(1, round(side * OUTER))))
    trimap = np.full(a0.shape, 0.5)
    trimap[person] = 1
    trimap[backdrop] = 0
    band = trimap == 0.5

    alpha = np.clip(estimate_alpha_cf(rgb, trimap), 0, 1)

    _, bg = estimate_foreground_ml(rgb, alpha, return_background=True)
    key = np.clip((np.abs(rgb - bg).max(axis=2) - KEY_FROM) / KEY_RAMP, 0, 1)
    sure = alpha[band] * (alpha[band] > SURE)
    alpha[band] = np.minimum(alpha[band], np.maximum(key[band], sure))
    alpha = np.clip((alpha - FLOOR) / (1 - FLOOR), 0, 1)

    holes, n = ndimage.label(alpha < 0.5)
    edges = np.concatenate([holes[0], holes[-1], holes[:, 0], holes[:, -1]])
    outside = set(np.unique(holes[backdrop])) | set(np.unique(edges))
    sizes = ndimage.sum(np.ones_like(alpha), holes, index=np.arange(1, n + 1))
    for i, size in enumerate(sizes, start=1):
        if i not in outside and size < alpha.size * HOLE:
            alpha[holes == i] = np.maximum(alpha[holes == i], a0[holes == i])

    fg = estimate_foreground_ml(rgb, alpha)
    return np.dstack([np.clip(fg, 0, 1), alpha])


def main():
    folder, ids = sys.argv[1], sys.argv[2:]
    for id_ in ids:
        try:
            rgb = np.asarray(Image.open(f"{folder}/{id_}-rgb.png").convert("RGB"), dtype=np.float64) / 255
            a0 = np.asarray(Image.open(f"{folder}/{id_}-alpha.png").convert("L"), dtype=np.float64) / 255
            # pymatting prints notices (a slower solver retry); stdout is for the results.
            with redirect_stdout(sys.stderr):
                rgba = matte(rgb, a0)
            Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), "RGBA").save(f"{folder}/{id_}-matte.png")
            print(json.dumps({"id": id_, "ok": True}), flush=True)
        except Exception as e:  # one bad photo shouldn't stop the rest
            print(json.dumps({"id": id_, "error": str(e)}), flush=True)


if __name__ == "__main__":
    main()
