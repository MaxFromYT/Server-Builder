"""Assemble the hand modelled devices into rack models.

The four racks added to the gallery from hardware modelled here shipped
without an authored model, so their detail pages fell back to the procedural
renderer: correct boxes in correct positions, drawn from the rack definition,
and nothing like the devices themselves. The detailed geometry existed the
whole time and nothing put it in a frame.

This is the step that was missing. Every device already knows how to draw
itself into a rack at a given height, because that is the signature the
preview harness has always called: `build(rack, z)`. So a rack model is that
call, once per device, at the height the definition says, inside a frame.

The composition is shared and the geometry is not. Each device still draws
its own jacks, cages, lamps and materials from its own photographs; this file
only decides what goes where, which is exactly the part a rack elevation is
allowed to have an opinion about.

Positions come from the same RackDefinition the page renders, read out of the
published dataset rather than restated here. A generator that keeps its own
copy of the layout is how the older rack models drifted from their
definitions twice, and check-rack-models exists because of it.

Usage: python3 script/models/build_modelled_racks.py [slug ...]
"""

from __future__ import annotations

import importlib
import inspect
import json
import sys
from pathlib import Path

sys.path.insert(0, "script/models")
sys.path.insert(0, "script/models/devices")

from _device import Device  # noqa: E402
from build_enterprise_base import EnterpriseRack, export_glb  # noqa: E402

OUT_DIR = Path("client/public/models")
CATALOGUE = Path("client/public/data/own-catalogue.json")

# Which rack definition each model is built from, and what the frame looks
# like. Finish is per vendor because a MikroTik stack in a white studio frame
# and a Dell row in a black cabinet are different rooms, and drawing both the
# same was the single biggest inaccuracy in the first pass of this library.
RACKS: dict[str, dict] = {
    "cisco-edge-16u": {
        "file": "ciscoEdge",
        "units": 16,
        "frame": "nexus_black",
        "note": "A 16U Cisco enterprise edge: an ASR on the circuit, an ISR 4451-X behind it, a Firepower, a Nexus spine and two Catalyst access switches.",
    },
    "juniper-mx-24u": {
        "file": "juniperMx",
        "units": 24,
        "frame": "nexus_black",
        "note": "A 24U Juniper provider edge: an MX240 card chassis, an MX204, a QFX5120 leaf, EX4400 and EX4300 access, and an SRX1500.",
    },
    "dell-row-24u": {
        "file": "dellRow",
        "units": 24,
        "frame": "nexus_black",
        "note": "A 24U Dell row: an 84 bay PowerVault under three generations of PowerEdge, with an S5248F-ON on top of the rack.",
    },
    "mikrotik-crs-12u": {
        "file": "mikrotikCrs",
        "units": 12,
        "frame": "nexus_black_dark",
        "note": "A 12U MikroTik stack: five Cloud Router Switches that look alike from a distance and share no geometry at all.",
    },
}


def device_index() -> dict[str, tuple[str, type[Device]]]:
    """Every modelled device, keyed by the node name its GLB group carries.

    Keyed on `dev.slug` rather than the module name because that is the name
    the rack definitions use as a device id, and keeping those two in step is
    what lets check-rack-models compare the shipped model against the
    published dataset at all.
    """
    out: dict[str, tuple[str, type[Device]]] = {}
    for path in sorted(Path("script/models/devices").glob("*.py")):
        if path.stem.startswith("_"):
            continue
        mod = importlib.import_module(path.stem)
        for _, obj in inspect.getmembers(mod, inspect.isclass):
            if issubclass(obj, Device) and obj is not Device and obj.__module__ == path.stem:
                slug = obj().slug
                if slug:
                    out[slug] = (path.stem, obj)
    return out


def rack_devices(slug: str) -> list[dict]:
    """The device list the site actually renders, in top to bottom order.

    The published dataset is one flat list of devices tagged with their
    rack and their position in it, rather than a rack holding devices, so
    this filters and sorts rather than looking a rack up. Sorting on
    `position` explicitly instead of trusting file order, because the whole
    point of reading the dataset is not to depend on how it was written.
    """
    data = json.loads(Path("dist/public/data/rack-library.json").read_text())
    rows = [d for d in data["devices"] if d.get("rack") == slug]
    if not rows:
        raise SystemExit(f"{slug} is not in the published rack dataset")
    return sorted(rows, key=lambda d: d["position"])


class ModelledRack(EnterpriseRack):
    """A frame with hand modelled devices mounted in it."""

    def __init__(self, units: int, frame: str) -> None:
        self.units = units
        self.frame_material = frame
        self.rail_material = frame
        super().__init__()

    def compose(self, devices: list[dict], index: dict[str, tuple[str, type[Device]]]) -> None:
        self.build_frame()
        at = 0
        for spec in devices:
            u = int(spec["u"])
            if spec.get("family") == "blank":
                # Blanking panels have no device module and should not: they
                # are sheet steel, and the frame already knows how to press
                # one. Drawing them matters because an undrawn unit is a hole
                # in the model that the elevation says is covered.
                self.build_blank(self.u_centre(at, u), u, spec["id"])
                at += u
                continue
            entry = index.get(spec["id"])
            if entry is None:
                # A device in the definition with no model behind it would
                # otherwise be a silent hole. Better to know which.
                print(f"    no model for {spec['id']}, leaving {u}U empty")
                at += u
                continue
            _, cls = entry
            cls().build(self, self.u_centre(at, u))
            at += u


def build(slug: str, index: dict[str, tuple[str, type[Device]]]) -> None:
    cfg = RACKS[slug]
    devices = rack_devices(slug)
    rack = ModelledRack(cfg["units"], cfg["frame"])
    rack.parts.clear()
    rack.compose(devices, index)
    scene = rack.to_scene()
    out = OUT_DIR / f"{slug}.glb"
    export_glb(scene, out)
    tris = sum(len(g.faces) for g in scene.geometry.values())
    size = out.stat().st_size / 1024 / 1024
    print(f"ok   {slug:18s} {tris:>8,} tris  {size:>5.1f}MB  {len(scene.geometry)} groups")


def main() -> int:
    wanted = [a for a in sys.argv[1:] if not a.startswith("-")] or list(RACKS)
    index = device_index()
    print(f"{len(index)} modelled devices available\n")
    for slug in wanted:
        if slug not in RACKS:
            print(f"skip {slug}: not a modelled rack")
            continue
        build(slug, index)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
