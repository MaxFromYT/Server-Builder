"""Draw a post's cover as a figure of its own subject.

WHY NOT A PHOTOGRAPH. The covers on the older posts are stock photographs
sourced from Commons: a picture of some fibre for an article about fibre. They
are fine and they are also interchangeable, because none of them says anything
the article does not. For a post whose whole point is a number, a chart of
that number is a better cover, it is unambiguously ours to publish, and it
cannot be wrong in the way a photograph of the wrong generation of hardware
can be wrong.

WHAT IT DRAWS. A titled panel in the site's own palette containing one of a
few figure types, each driven by real values passed in on the command line.
Nothing here invents a number: the caller supplies them and the article cites
where they came from.

Usage:
    python3 script/makeCoverFigure.py <slug> --kind bars --title "..." \\
        --subtitle "..." --series "label=value,unit" [--series ...]

Writes client/public/images/blog/<slug>.jpg at 1600x900.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path("client/public/images/blog")
W, H = 1600, 900

# The site's palette, converted from the HSL in client/src/index.css.
OBSIDIAN = (9, 10, 11)
GRAPHITE = (20, 22, 25)
IRON = (54, 57, 60)
ASH = (137, 140, 145)
BONE = (238, 235, 228)
SIGNAL = (196, 255, 0)

#: Font hunt, because a container may have any of these and none is certain.
FONT_DIRS = [
    "/usr/share/fonts/truetype/dejavu",
    "/usr/share/fonts/truetype/liberation",
    "/usr/share/fonts",
]


def font(size: int, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    names = (
        ["DejaVuSansMono-Bold.ttf", "DejaVuSansMono.ttf", "LiberationMono-Regular.ttf"]
        if mono
        else (
            ["DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf"]
            if bold
            else ["DejaVuSans.ttf", "LiberationSans-Regular.ttf"]
        )
    )
    for d in FONT_DIRS:
        for n in names:
            p = Path(d) / n
            if p.exists():
                return ImageFont.truetype(str(p), size)
    for p in Path("/usr/share/fonts").rglob("*.ttf"):
        return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def tracked(d: ImageDraw.ImageDraw, xy, text, f, fill, spacing=0):
    """Letter-spaced text, which the site uses for every label."""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + spacing
    return x


def grid(d: ImageDraw.ImageDraw) -> None:
    """A faint measuring grid, the same one the rack elevations sit on."""
    for x in range(0, W, 50):
        d.line([(x, 0), (x, H)], fill=(15, 17, 19), width=1)
    for y in range(0, H, 50):
        d.line([(0, y), (W, y)], fill=(15, 17, 19), width=1)


def bars(d: ImageDraw.ImageDraw, series: list[tuple[str, float, str]], top: int) -> None:
    """Horizontal bars, longest scaled to the width. The value is the point,
    so it is printed at full size and the bar is the supporting evidence."""
    if not series:
        return
    peak = max(v for _, v, _ in series) or 1
    left, right = 96, W - 96
    room = right - left
    gap = 30
    space = H - top - 120
    bar_h = min(96, (space - gap * (len(series) - 1)) // max(1, len(series)))
    # Centre the block in what is left rather than hanging it off the top.
    # With two bars and a cap on the height, aligning to the top leaves half
    # the picture empty below them and the composition falls over.
    block = bar_h * len(series) + gap * (len(series) - 1)
    y = top + max(0, (space - block) // 2)
    for label, value, unit in series:
        width = max(6, int(room * (value / peak)))
        d.rectangle([left, y, left + width, y + bar_h], fill=GRAPHITE)
        d.rectangle([left, y, left + 5, y + bar_h], fill=SIGNAL)
        d.line([(left, y + bar_h), (left + width, y + bar_h)], fill=IRON, width=1)

        tracked(d, (left + 22, y + bar_h // 2 - 17), label.upper(), font(21), BONE, 1.6)
        text = f"{value:,.0f} {unit}".strip()
        f = font(38, bold=True)
        d.text((right - d.textlength(text, font=f), y + bar_h // 2 - 26), text, font=f, fill=SIGNAL)
        y += bar_h + gap


def build(slug: str, kind: str, title: str, subtitle: str, series: list[tuple[str, float, str]],
          footer: str, plate: bool = False) -> Path:
    im = Image.new("RGB", (W, H), OBSIDIAN)
    d = ImageDraw.Draw(im)
    grid(d)

    # Signal rule and eyebrow, matching the page headers.
    d.rectangle([96, 96, 96 + 64, 99], fill=SIGNAL)
    tracked(d, (96, 124), "MAXDOUBIN.COM", font(19), ASH, 5.0)

    if plate:
        # No headline. The article page lays its own title over this image,
        # and a cover that carries a second one gives you two titles in the
        # same rectangle, which is what the first version of these did.
        tracked(d, (96, 176), subtitle.upper(), font(24), ASH, 3.0)
        bars(d, series, 250)
        d.line([(96, H - 92), (W - 96, H - 92)], fill=IRON, width=1)
        tracked(d, (96, H - 70), footer.upper(), font(18), ASH, 2.4)
        # Pull the whole thing back so white text laid over it stays legible.
        im = Image.blend(im, Image.new("RGB", (W, H), OBSIDIAN), 0.55)
        OUT.mkdir(parents=True, exist_ok=True)
        dst = OUT / f"{slug}.jpg"
        im.save(dst, "JPEG", quality=88, optimize=True, progressive=True)
        return dst

    f = font(66, bold=True)
    # Wrap the title to the panel width rather than letting it run off.
    words, line, lines = title.split(), "", []
    for w in words:
        trial = f"{line} {w}".strip()
        if d.textlength(trial, font=f) > W - 200 and line:
            lines.append(line)
            line = w
        else:
            line = trial
    lines.append(line)
    y = 176
    for ln in lines[:2]:
        d.text((96, y), ln, font=f, fill=BONE)
        y += 78

    if subtitle:
        d.text((96, y + 8), subtitle, font=font(27), fill=ASH)
        y += 56

    if kind == "bars":
        bars(d, series, y + 44)

    d.line([(96, H - 92), (W - 96, H - 92)], fill=IRON, width=1)
    tracked(d, (96, H - 70), footer.upper(), font(18), ASH, 2.4)

    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{slug}.jpg"
    im.save(dst, "JPEG", quality=88, optimize=True, progressive=True)
    return dst


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--kind", default="bars", choices=["bars"])
    ap.add_argument("--title", required=True)
    ap.add_argument("--subtitle", default="")
    ap.add_argument("--footer", default="Figures from the cited sources")
    ap.add_argument(
        "--plate",
        action="store_true",
        help="Backdrop mode: no headline, and the whole figure pulled back so "
             "the page's own title reads over it. Use for blog covers.",
    )
    ap.add_argument("--series", action="append", default=[],
                    help='"label=value,unit", repeatable')
    a = ap.parse_args()

    series = []
    for raw in a.series:
        label, rest = raw.split("=", 1)
        value, _, unit = rest.partition(",")
        series.append((label, float(value), unit))

    dst = build(a.slug, a.kind, a.title, a.subtitle, series, a.footer, a.plate)
    print(dst)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
