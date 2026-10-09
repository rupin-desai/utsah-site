"""
Splits a photo into the two layers DepthStage stacks: the untouched photo as
the back plate, and the subject cut out onto transparency as the front plate.

One-off asset generation, not a build step — the outputs are committed. Re-run
only when a source photo changes:

    pip install rembg
    python scripts/make-layers.py

The invariant the component relies on: each pair is the SAME pixel size, so
both layers render in one box with one object-fit / object-position and
register exactly. Never resize one without the other.

A back plate made here still contains its subject, so DepthStage may only use
it in `grow` mode. The hero's night-bg / night-bride pair is not made here: it
was generated as two separate images (an empty venue, and the bride on
transparency), so its back plate is clean and can take `parallax`.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
HERO = ROOT / 'public' / 'assets' / 'hero'
OUT = HERO / 'layers'

# source photo -> layer name
PAIRS = {
    'hero-3.jpg': 'groom',
}

MAX_WIDTH = 2400
# isnet-general-use keeps fine edges (hair, dupatta lace) better than u2net.
MODEL = 'isnet-general-use'
# Matte islands smaller than this share of the subject are stray background.
MIN_ISLAND = 0.005


def clean(alpha: np.ndarray) -> np.ndarray:
    """Drops detached specks the model mistook for subject."""
    solid = alpha > 0.5
    labels, count = ndimage.label(solid)
    if count <= 1:
        return alpha
    sizes = ndimage.sum(solid, labels, range(1, count + 1))
    keep = np.isin(labels, 1 + np.flatnonzero(sizes >= sizes.max() * MIN_ISLAND))
    # Keep each surviving island's soft edge, not just its solid core.
    keep = ndimage.binary_dilation(keep, iterations=3)
    return alpha * keep


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    session = new_session(MODEL)

    for source, name in PAIRS.items():
        photo = Image.open(HERO / source).convert('RGB')
        if photo.width > MAX_WIDTH:
            height = round(photo.height * MAX_WIDTH / photo.width)
            photo = photo.resize((MAX_WIDTH, height), Image.LANCZOS)

        cutout = remove(photo, session=session, post_process_mask=True)
        alpha = clean(np.asarray(cutout.getchannel('A'), dtype=np.float32) / 255)
        # A one-pixel feather on the matte: a hard alpha edge reads as a
        # sticker once the layers start moving against each other.
        matte = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
        # Colour from the photo itself, not rembg's premultiplied output, so the
        # front plate's pixels are identical to the back plate's.
        front = photo.copy()
        front.putalpha(matte)

        assert front.size == photo.size
        photo.save(OUT / f'{name}-bg.jpg', quality=82, optimize=True, progressive=True)
        front.save(OUT / f'{name}-fg.webp', quality=82, method=6)
        print(f'{name}: {photo.size[0]}x{photo.size[1]}')


if __name__ == '__main__':
    main()
