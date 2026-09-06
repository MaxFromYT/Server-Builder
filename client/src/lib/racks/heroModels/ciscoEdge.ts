/**
 * Which node group in the Cisco enterprise edge model is which device.
 *
 * The devices live in the rack definition and the GLB's group names are the
 * device ids, so this is a filter rather than a second copy of the layout.
 * That is not a style preference: the older rack models kept their own copy
 * and drifted from their definitions twice, which is why check-rack-models
 * exists and why this table is derived rather than written out.
 */

import { ciscoEdgeRack } from "@/lib/racks/ciscoEdge";
import type { HeroPart } from "./types";

export const CISCO_EDGE_SCENERY = new Set([
  "RACK_FRAME",
  "RACK_HOLES",
  "MOUNTING_RAILS",
  "SIDE_BRACES",
  "FRAME_EDGE_HIGHLIGHTS",
  "SHELF_FEET",
  "world",
]);

export const CISCO_EDGE_PARTS: HeroPart[] = ciscoEdgeRack.devices.map((device) => ({
  group: device.id,
  device,
}));
