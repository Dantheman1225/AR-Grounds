import type {
  ChemicalPolicy,
  FeatureGroup,
  FeatureType,
  Geometry,
  MapFeature,
  ServicePart,
  WorkCycle,
} from "./types";

export type GeometryKind = Geometry["kind"];

export type FeaturePreset = {
  type: FeatureType;
  label: string;
  shortLabel: string;
  prefix: string;
  group: FeatureGroup;
  geometry: GeometryKind;
  color: string;
  description: string;
  cycle: WorkCycle;
  temporary: boolean;
  chemicalPolicy: ChemicalPolicy;
  pwsClauses: string[];
  equipment: string[];
  serviceParts: Array<Omit<ServicePart, "id" | "status">>;
};

const part = (
  label: string,
  action: string,
  equipment: string,
  method = "",
): Omit<ServicePart, "id" | "status"> => ({ label, action, equipment, method });

export const GROUP_META: Record<FeatureGroup, { label: string; description: string }> = {
  objects: { label: "Objects", description: "Trees, bushes, poles, signs, utilities, and fixed hazards." },
  "lines-edges": { label: "Lines & edges", description: "Fences, sidewalks, curbs, walls, shoulders, and routes." },
  "ground-areas": { label: "Ground areas", description: "Turf, ditches, lots, slopes, buildings, patios, and beds." },
  "problems-hazards": { label: "Problems & hazards", description: "Recovery brush, holes, water, erosion, wildlife, and blocked work." },
  "operations-access": { label: "Operations & access", description: "Staging, equipment entry, QC points, and restricted areas." },
};

export const EQUIPMENT_OPTIONS = [
  "Zero-turn mower",
  "Walk-behind mower",
  "Push mower",
  "String trimmer",
  "Blade brush cutter",
  "Bush hog / tractor",
  "Remote slope mower",
  "Hand tools",
  "Edger",
  "Backpack blower",
  "Approved herbicide",
  "Specialty operator",
  "No equipment",
];

export const FEATURE_PRESETS: FeaturePreset[] = [
  {
    type: "tree", label: "Tree", shortLabel: "TR", prefix: "T", group: "objects", geometry: "point", color: "#2f6b45",
    description: "Tree trunk, root flare, low limbs, and surrounding turf.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["PWS 5.2.1.3", "PWS 5.2.1.9"], equipment: ["String trimmer", "Hand tools"],
    serviceParts: [part("Base", "Trim to adjacent mowing height without bark contact.", "String trimmer"), part("Low limbs / clearance", "Prune only as allowed; maintain passage and sight lines.", "Hand tools"), part("Cleanup", "Remove clippings, suckers, and debris.", "Backpack blower")],
  },
  {
    type: "bush-group", label: "Bush / group", shortLabel: "BU", prefix: "B", group: "objects", geometry: "point", color: "#3f7f4f",
    description: "One bush or a grouped cluster with a shared work card.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["PWS 5.2.1.3", "PWS 5.2.1.9"], equipment: ["String trimmer", "Hand tools"],
    serviceParts: [part("Bases", "Trim grass and weeds around every base.", "String trimmer"), part("Canopy / shape", "Prune for healthy growth and required clearances.", "Hand tools"), part("Vines / weeds", "Remove vines and visible weeds mechanically.", "Hand tools"), part("Cleanup", "Remove all cuttings and debris.", "Backpack blower")],
  },
  {
    type: "pole", label: "Pole", shortLabel: "PO", prefix: "PO", group: "objects", geometry: "point", color: "#64736d",
    description: "Light, utility, flag, or other pole requiring fixed-object trimming.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.3", "PWS 5.2.2.3"], equipment: ["String trimmer"],
    serviceParts: [part("Base", "Trim to adjacent mowing height without striking the pole.", "String trimmer"), part("Cleanup", "Remove clippings from nearby hard surfaces.", "Backpack blower")],
  },
  {
    type: "sign", label: "Sign", shortLabel: "SG", prefix: "SG", group: "objects", geometry: "point", color: "#4f7180",
    description: "Signpost, sign base, and visibility clearance.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.3"], equipment: ["String trimmer"],
    serviceParts: [part("Posts / base", "Trim grass and weeds around all posts.", "String trimmer"), part("Sight line", "Remove vegetation blocking the sign.", "Hand tools"), part("Cleanup", "Blow sign pad and nearby pavement clean.", "Backpack blower")],
  },
  {
    type: "hydrant", label: "Hydrant", shortLabel: "HY", prefix: "HY", group: "objects", geometry: "point", color: "#b64a3c",
    description: "Hydrant with a damage-safe trimming buffer.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["PWS 5.2.1.3"], equipment: ["String trimmer", "Hand tools"],
    serviceParts: [part("Base", "Trim to mowing height without contact damage.", "String trimmer"), part("Access clearance", "Keep operating area unobstructed.", "Hand tools")],
  },
  {
    type: "guy-wire", label: "Guy wire / anchor", shortLabel: "GW", prefix: "GW", group: "objects", geometry: "point", color: "#db7d35",
    description: "Guy wire, ground anchor, and visible avoidance buffer.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.3"], equipment: ["String trimmer", "Hand tools"],
    serviceParts: [part("Anchor", "Hand-clear vegetation immediately around the anchor.", "Hand tools"), part("Wire path", "Trim carefully along the full wire with no contact.", "String trimmer"), part("Visibility buffer", "Keep the wire and anchor visible to operators.", "Hand tools")],
  },
  {
    type: "utility-unit", label: "Utility / AC unit", shortLabel: "UT", prefix: "UT", group: "objects", geometry: "point", color: "#636b74",
    description: "Transformer, utility cabinet, AC unit, bollard, or similar fixed object.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["PWS 5.2.1.3"], equipment: ["String trimmer", "Hand tools"],
    serviceParts: [part("Perimeter", "Trim vegetation without striking equipment or lines.", "String trimmer"), part("Service access", "Keep doors, vents, and access panels clear.", "Hand tools"), part("Cleanup", "Remove clippings from the unit and pad.", "Backpack blower")],
  },
  {
    type: "drain-inlet", label: "Drain / inlet", shortLabel: "DR", prefix: "DR", group: "objects", geometry: "point", color: "#2986a3",
    description: "Drain, inlet, manhole, or culvert opening.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["PWS 5.2.1.3", "PWS 5.2.4.1"], equipment: ["String trimmer", "Hand tools"],
    serviceParts: [part("Opening", "Clear vegetation without pushing debris into drainage.", "Hand tools"), part("Perimeter", "Trim to adjacent mowing height.", "String trimmer"), part("Debris", "Remove visible blockage and report major obstruction.", "Hand tools")],
  },
  {
    type: "fence", label: "Fence", shortLabel: "FE", prefix: "F", group: "lines-edges", geometry: "line", color: "#cf5e92",
    description: "Fence line with separate inside, outside, fabric, and gate work.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.4", "PWS 5.2.2.4"], equipment: ["String trimmer", "Blade brush cutter"],
    serviceParts: [part("Inside 5-foot strip", "Maintain vegetation within 5 feet on the inside.", "String trimmer"), part("Outside 5-foot strip", "Maintain vegetation within 5 feet on the outside.", "String trimmer"), part("Fence fabric / vines", "Remove vines and vegetation growing through the fence.", "Hand tools"), part("Gates / corners", "Clear gate swings, posts, corners, and access points.", "String trimmer")],
  },
  {
    type: "sidewalk", label: "Sidewalk", shortLabel: "SW", prefix: "SW", group: "lines-edges", geometry: "line", color: "#7c6fc1",
    description: "Sidewalk path with both edges, cracks, joints, and blow-clean work.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.2", "PWS 5.2.1.5"], equipment: ["Edger", "String trimmer", "Backpack blower"],
    serviceParts: [part("Left edge", "Edge vegetation to no more than 1 inch over pavement.", "Edger"), part("Right edge", "Edge vegetation to no more than 1 inch over pavement.", "Edger"), part("Cracks / joints", "Remove vegetation from cracks and joints.", "Hand tools"), part("Surface cleanup", "Blow the full walking surface clean.", "Backpack blower")],
  },
  {
    type: "curb-edge", label: "Curb / pavement edge", shortLabel: "CE", prefix: "CE", group: "lines-edges", geometry: "line", color: "#9555b5",
    description: "Curb, gutter, drive edge, or road edge requiring edging and cleanup.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.2", "PWS 5.2.1.5"], equipment: ["Edger", "String trimmer", "Backpack blower"],
    serviceParts: [part("Turf edge", "Edge vegetation to the paved boundary.", "Edger"), part("Gutter / cracks", "Remove weeds and accumulated vegetation.", "Hand tools"), part("Cleanup", "Blow clippings and soil off pavement.", "Backpack blower")],
  },
  {
    type: "building-perimeter", label: "Building perimeter", shortLabel: "BP", prefix: "BP", group: "lines-edges", geometry: "line", color: "#8b6248",
    description: "Foundation run, doors, utilities, and loading edges around a building.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["PWS 5.2.1.3", "PWS 5.2.1.5"], equipment: ["String trimmer", "Backpack blower"],
    serviceParts: [part("Foundation", "Trim vegetation along the full foundation without damage.", "String trimmer"), part("Doors / loading areas", "Keep thresholds and access clear.", "Hand tools"), part("Cracks / joints", "Remove vegetation from adjoining concrete joints.", "Hand tools"), part("Cleanup", "Blow walls, pads, and entrances clean.", "Backpack blower")],
  },
  {
    type: "road-shoulder", label: "Road shoulder", shortLabel: "RS", prefix: "RS", group: "lines-edges", geometry: "line", color: "#8b795d",
    description: "Road shoulder, swale edge, or long roadside trimming run.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.1", "PWS 5.2.1.2"], equipment: ["Zero-turn mower", "String trimmer"],
    serviceParts: [part("Shoulder", "Mow or trim the full shoulder to the applicable height.", "Zero-turn mower"), part("Road edge", "Keep vegetation off paved travel surface.", "String trimmer"), part("Cleanup", "Remove clippings, litter, and windrows.", "Backpack blower")],
  },
  {
    type: "retaining-wall", label: "Wall / retaining wall", shortLabel: "WL", prefix: "W", group: "lines-edges", geometry: "line", color: "#7a685c",
    description: "Wall base, top edge, joints, and adjacent slope.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.3", "PWS 5.2.1.5"], equipment: ["String trimmer", "Hand tools"],
    serviceParts: [part("Base", "Trim vegetation along the full base.", "String trimmer"), part("Top edge", "Clear overgrowth from the wall edge.", "Hand tools"), part("Joints / vines", "Remove weeds and vines from joints and face.", "Hand tools")],
  },
  {
    type: "access-route", label: "Equipment route", shortLabel: "RT", prefix: "RT", group: "lines-edges", geometry: "line", color: "#3c6e72",
    description: "Approved route for mowers, trailers, or specialty equipment.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["Operations"], equipment: ["No equipment"],
    serviceParts: [part("Route", "Keep route open and verify clearance before entry.", "No equipment"), part("Surface check", "Confirm ground, width, overhead, and turn clearance.", "No equipment")],
  },
  {
    type: "turf-area", label: "Turf / mowing area", shortLabel: "TU", prefix: "M", group: "ground-areas", geometry: "polygon", color: "#5b9c55",
    description: "Improved or semi-improved turf with mowing, detail, and cleanup work.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.1", "PWS 5.2.2.1"], equipment: ["Zero-turn mower"],
    serviceParts: [part("Main turf", "Mow to the applicable 2-3 or 2-4 inch standard.", "Zero-turn mower"), part("Tight areas", "Finish areas the mower cannot reach.", "String trimmer"), part("Clippings / windrows", "Remove visible clumps and damaging buildup.", "Backpack blower"), part("Litter", "Police litter before and after mowing.", "Hand tools")],
  },
  {
    type: "ditch", label: "Ditch", shortLabel: "DI", prefix: "D", group: "ground-areas", geometry: "polygon", color: "#2386a6",
    description: "Full ditch footprint with separate banks, bottom, drainage, and access.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["PWS 5.2.1.1-4", "PWS 5.2.4.1"], equipment: ["Blade brush cutter", "Remote slope mower"],
    serviceParts: [part("Road-side bank", "Cut the near bank to the assigned standard.", "Blade brush cutter"), part("Bottom", "Cut the ditch bottom; clear trash and obstruction.", "Remote slope mower"), part("Far bank", "Cut the far bank using approved safe equipment.", "Remote slope mower"), part("Culverts / inlets", "Clear vegetation without pushing debris into drainage.", "Hand tools"), part("Trash / debris", "Remove visible litter, limbs, and cut material.", "Hand tools")],
  },
  {
    type: "parking-lot", label: "Parking lot", shortLabel: "PK", prefix: "P", group: "ground-areas", geometry: "polygon", color: "#5f6571",
    description: "Paved parking area with perimeter, islands, cracks, vehicles, and cleanup.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.2", "PWS 5.2.1.5", "PWS 5.2.4.1"], equipment: ["Edger", "String trimmer", "Backpack blower"],
    serviceParts: [part("Perimeter / curbs", "Edge and trim the complete paved boundary.", "Edger"), part("Islands", "Trim and edge every island and median.", "String trimmer"), part("Cracks / joints", "Remove vegetation from all active cracks and joints.", "Hand tools"), part("Parked vehicles", "Detail accessible areas without damage; record blocked spots.", "String trimmer"), part("Litter / cleanup", "Remove litter and blow pavement clean.", "Backpack blower")],
  },
  {
    type: "gravel-lot", label: "Gravel / unpaved lot", shortLabel: "GR", prefix: "G", group: "ground-areas", geometry: "polygon", color: "#8a806a",
    description: "Gravel or designated unpaved area requiring weed and litter control.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.6", "PWS 5.2.2.6"], equipment: ["Blade brush cutter", "Hand tools"],
    serviceParts: [part("Surface weeds", "Remove grass and weeds from designated unpaved surface.", "Blade brush cutter"), part("Perimeter", "Trim adjoining turf and edges.", "String trimmer"), part("Vehicle / equipment obstacles", "Detail accessible areas and record blocked work.", "String trimmer"), part("Litter", "Remove all visible litter and debris.", "Hand tools")],
  },
  {
    type: "vehicle-row", label: "Vehicle row", shortLabel: "VR", prefix: "V", group: "ground-areas", geometry: "polygon", color: "#596d7b",
    description: "Stored vehicles or equipment requiring careful detail work around and between units.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.3", "PWS 5.2.1.5-6"], equipment: ["String trimmer", "Hand tools"],
    serviceParts: [part("Vehicle perimeters", "Trim accessible grass around every vehicle without damage.", "String trimmer"), part("Between vehicles", "Clear reachable weeds and record inaccessible strips.", "Hand tools"), part("Under vehicles", "Perform only approved reachable work; do not move vehicles.", "Hand tools"), part("Surface weeds", "Remove active gravel or pavement weeds.", "Hand tools"), part("Cleanup", "Remove clippings and debris from the row.", "Backpack blower")],
  },
  {
    type: "building", label: "Building", shortLabel: "BL", prefix: "BL", group: "ground-areas", geometry: "polygon", color: "#80614c",
    description: "Complete building footprint with perimeter, entrances, utilities, and cleanup.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["PWS 5.2.1.3", "PWS 5.2.1.5"], equipment: ["String trimmer", "Backpack blower"],
    serviceParts: [part("Foundation perimeter", "Trim the full exterior foundation.", "String trimmer"), part("Entrances / loading", "Keep doors, ramps, and loading areas clear.", "Hand tools"), part("Utility side", "Detail safely around units, lines, and cabinets.", "String trimmer"), part("Concrete joints", "Remove weeds from adjoining joints and cracks.", "Hand tools"), part("Final cleanup", "Blow walls, entrances, and pads clean.", "Backpack blower")],
  },
  {
    type: "patio-pad", label: "Patio / concrete pad", shortLabel: "PA", prefix: "PA", group: "ground-areas", geometry: "polygon", color: "#9a7d70",
    description: "Patio, slab, equipment pad, or hard-surface section.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.2", "PWS 5.2.1.5"], equipment: ["String trimmer", "Hand tools", "Backpack blower"],
    serviceParts: [part("Perimeter", "Trim and edge the full outside boundary.", "String trimmer"), part("Cracks / joints", "Remove all visible vegetation.", "Hand tools"), part("Obstacles", "Detail around furniture, equipment, or anchors.", "String trimmer"), part("Surface cleanup", "Blow the entire surface clean.", "Backpack blower")],
  },
  {
    type: "slope-bank", label: "Slope / bank", shortLabel: "SL", prefix: "S", group: "ground-areas", geometry: "polygon", color: "#9a6b37",
    description: "Slope with separate dry/wet equipment and safety instructions.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["PWS 5.2.1.1", "PWS 5.2.2.1"], equipment: ["Walk-behind mower", "String trimmer"],
    serviceParts: [part("Dry-ground method", "Use only the supervisor-approved dry-ground equipment class.", "Walk-behind mower"), part("Wet-ground method", "Reassess after rain; downgrade equipment or block work.", "String trimmer"), part("Top / transition", "Cut the crest and transition strip evenly.", "String trimmer"), part("Bottom / runoff", "Clear the toe without rutting or scalping.", "String trimmer")],
  },
  {
    type: "rock-bed", label: "Rock / mulch bed", shortLabel: "RB", prefix: "X", group: "ground-areas", geometry: "polygon", color: "#8d735d",
    description: "Xeriscape, rock, mulch, or ornamental bed with protected plantings.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["PWS 5.2.3.1"], equipment: ["Hand tools"],
    serviceParts: [part("Weeds", "Mechanically remove weeds without disturbing plantings.", "Hand tools"), part("Protected plants", "Avoid damage and report unidentified plant material.", "Hand tools"), part("Border", "Define the bed edge and remove encroaching turf.", "Hand tools"), part("Litter / debris", "Remove visible litter, leaves, and brush.", "Hand tools")],
  },
  {
    type: "thick-weeds", label: "Thick weeds / brush", shortLabel: "TW", prefix: "R", group: "problems-hazards", geometry: "polygon", color: "#d55b32",
    description: "Temporary recovery area that needs heavier equipment before routine maintenance.", cycle: "recovery", temporary: true, chemicalPolicy: "review",
    pwsClauses: ["PWS 5.2.1.1", "Scope / method review"], equipment: ["Blade brush cutter", "Bush hog / tractor"],
    serviceParts: [part("Initial knockdown", "Cut dense growth with approved heavy equipment.", "Blade brush cutter"), part("Woody stems", "Measure and flag stems requiring scope or method review.", "Bush hog / tractor"), part("Cut material", "Remove or disperse cut material without windrows.", "Hand tools"), part("After-clear plan", "Convert the area to recurring mowing or trimming after QC.", "String trimmer")],
  },
  {
    type: "hole-soft-ground", label: "Hole / soft ground", shortLabel: "HZ", prefix: "H", group: "problems-hazards", geometry: "point", color: "#bd3f45",
    description: "Hole, void, soft shoulder, or unstable ground requiring an avoidance buffer.", cycle: "recovery", temporary: true, chemicalPolicy: "prohibited",
    pwsClauses: ["Safety / damage reporting"], equipment: ["No equipment"],
    serviceParts: [part("Avoidance buffer", "Keep people and equipment outside the marked buffer.", "No equipment"), part("Report", "Record severity, location, and responsible contact.", "No equipment"), part("Resolution", "Keep active until repaired or formally cleared.", "No equipment")],
  },
  {
    type: "standing-water", label: "Wet / standing water", shortLabel: "WT", prefix: "WT", group: "problems-hazards", geometry: "polygon", color: "#2d86b3",
    description: "Wet, muddy, flooded, or consistently saturated ground.", cycle: "recovery", temporary: true, chemicalPolicy: "prohibited",
    pwsClauses: ["Safety / drainage"], equipment: ["No equipment"],
    serviceParts: [part("Wet area", "Keep rut-causing equipment out until conditions improve.", "No equipment"), part("Drainage check", "Record standing water, blockage, and likely cause.", "Hand tools"), part("Return plan", "Set a dry-ground reassessment date.", "No equipment")],
  },
  {
    type: "erosion-ruts", label: "Ruts / erosion / rocks", shortLabel: "ER", prefix: "ER", group: "problems-hazards", geometry: "polygon", color: "#a05c42",
    description: "Ruts, washout, exposed rock, or eroded ground affecting safe mowing.", cycle: "recovery", temporary: true, chemicalPolicy: "prohibited",
    pwsClauses: ["Safety / damage reporting"], equipment: ["No equipment"],
    serviceParts: [part("Hazard area", "Mark and avoid unsafe ground.", "No equipment"), part("Mowing impact", "Define what can still be safely maintained.", "String trimmer"), part("Report / resolution", "Document condition and track corrective direction.", "No equipment")],
  },
  {
    type: "fallen-debris", label: "Fallen limb / debris", shortLabel: "DB", prefix: "DB", group: "problems-hazards", geometry: "point", color: "#9b6a3f",
    description: "Temporary limb, pile, windrow, or debris obstruction.", cycle: "recovery", temporary: true, chemicalPolicy: "prohibited",
    pwsClauses: ["PWS 5.2.4.1", "PWS 5.2.1.7-8"], equipment: ["Hand tools"],
    serviceParts: [part("Removal", "Remove the obstruction or document why it cannot be moved.", "Hand tools"), part("Underlying area", "Finish mowing or trimming after removal.", "String trimmer"), part("Cleanup", "Leave no visible cut material or litter.", "Backpack blower")],
  },
  {
    type: "wildlife-zone", label: "Nest / wildlife restriction", shortLabel: "NW", prefix: "NW", group: "problems-hazards", geometry: "polygon", color: "#7a5aa8",
    description: "Protected nest, habitat, or temporary environmental restriction.", cycle: "recovery", temporary: true, chemicalPolicy: "prohibited",
    pwsClauses: ["MBTA / environmental restriction"], equipment: ["No equipment"],
    serviceParts: [part("Protection buffer", "Do not disturb the marked zone.", "No equipment"), part("Direction", "Record the authority, restriction, and review date.", "No equipment"), part("Return plan", "Resume only after the restriction is formally cleared.", "No equipment")],
  },
  {
    type: "weed-control-zone", label: "Pesticide / weed zone", shortLabel: "WZ", prefix: "WZ", group: "problems-hazards", geometry: "polygon", color: "#a660c0",
    description: "Mapped weed-control zone with product rules, application records, and timers.", cycle: "recurring", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["PWS pesticide requirements", "Product label controls"], equipment: ["Approved herbicide", "Hand tools"],
    serviceParts: [part("Eligibility review", "Confirm label, site, IPMP, applicator, buffers, and weather.", "No equipment"), part("Application", "Treat only when all approval checks pass.", "Approved herbicide"), part("Results inspection", "Inspect effectiveness on the product-based date.", "No equipment"), part("Mechanical fallback", "Create a mechanical task if treatment is prohibited or fails.", "Hand tools")],
  },
  {
    type: "blocked-access", label: "Blocked / locked access", shortLabel: "BA", prefix: "BA", group: "problems-hazards", geometry: "point", color: "#9c3540",
    description: "Gate, vehicle, lock, or access condition preventing work.", cycle: "recovery", temporary: true, chemicalPolicy: "prohibited",
    pwsClauses: ["Access / exception record"], equipment: ["No equipment"],
    serviceParts: [part("Blocked work", "Identify the exact area and work prevented.", "No equipment"), part("Contact / notice", "Record who was notified and when.", "No equipment"), part("Return plan", "Set the next attempt or written-direction follow-up.", "No equipment")],
  },
  {
    type: "staging-area", label: "Staging / unloading", shortLabel: "ST", prefix: "ST", group: "operations-access", geometry: "polygon", color: "#3c6062",
    description: "Trailer parking, unloading, fueling, or crew staging footprint.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["Operations"], equipment: ["No equipment"],
    serviceParts: [part("Staging footprint", "Keep clear for safe unloading and equipment movement.", "No equipment"), part("Entry / exit", "Confirm turning and ramp clearance.", "No equipment"), part("Closeout", "Remove crew debris and leave the area clean.", "Backpack blower")],
  },
  {
    type: "equipment-entry", label: "Equipment entry / gate", shortLabel: "EN", prefix: "EN", group: "operations-access", geometry: "point", color: "#397376",
    description: "Gate or access point with width and equipment-fit notes.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["Operations"], equipment: ["No equipment"],
    serviceParts: [part("Opening width", "Record usable width and height.", "No equipment"), part("Surface / turn", "Verify approach, turn radius, and ground condition.", "No equipment"), part("Access status", "Record key, escort, or lock requirements.", "No equipment")],
  },
  {
    type: "qc-photo-point", label: "QC photo point", shortLabel: "QC", prefix: "QC", group: "operations-access", geometry: "point", color: "#3d6aa5",
    description: "Repeatable overview location for before, after, or verification photos.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["QC evidence"], equipment: ["No equipment"],
    serviceParts: [part("Photo", "Capture the required view from this exact point.", "No equipment"), part("Review", "Confirm the image proves the intended condition.", "No equipment")],
  },
  {
    type: "no-mow-zone", label: "No-mow / restricted area", shortLabel: "NM", prefix: "NM", group: "operations-access", geometry: "polygon", color: "#5c5961",
    description: "Permanent or temporary zone where routine equipment must not enter.", cycle: "recurring", temporary: false, chemicalPolicy: "prohibited",
    pwsClauses: ["Site restriction"], equipment: ["No equipment"],
    serviceParts: [part("Boundary", "Keep all unapproved equipment outside the marked boundary.", "No equipment"), part("Permitted work", "Record any hand work or approved exception.", "Hand tools")],
  },
  {
    type: "custom-feature", label: "Custom feature", shortLabel: "CU", prefix: "C", group: "operations-access", geometry: "point", color: "#526c8e",
    description: "A field-verified item that does not fit another preset.", cycle: "both", temporary: false, chemicalPolicy: "review",
    pwsClauses: ["Custom / field note"], equipment: ["No equipment"],
    serviceParts: [part("Required work", "Define the exact work and completion standard.", "No equipment")],
  },
];

export const PRESET_BY_TYPE = Object.fromEntries(
  FEATURE_PRESETS.map((preset) => [preset.type, preset]),
) as Record<FeatureType, FeaturePreset>;

export function featureDefaults(
  preset: FeaturePreset,
  id: string,
  siteId: string,
  mapId: string,
  geometry: Geometry,
  sequence: number,
  now: string,
): MapFeature {
  const code = `${preset.prefix}-${String(sequence).padStart(2, "0")}`;
  return {
    id,
    siteId,
    mapId,
    code,
    name: preset.label,
    featureType: preset.type,
    group: preset.group,
    status: preset.cycle === "recovery" ? "recovery" : "unassessed",
    priority: preset.cycle === "recovery" ? "high" : "normal",
    cycle: preset.cycle,
    notes: "",
    geometry,
    serviceParts: preset.serviceParts.map((item, index) => ({
      ...item,
      id: `${id}-part-${index + 1}`,
      status: preset.cycle === "recovery" ? "recovery" : "unassessed",
    })),
    equipment: [...preset.equipment],
    measurement: "",
    frequency: preset.cycle === "recovery" ? "One-time recovery, then convert to recurring maintenance" : "Every service visit",
    restrictions: "",
    chemicalPolicy: preset.chemicalPolicy,
    pwsClauses: [...preset.pwsClauses],
    temporary: preset.temporary,
    createdAt: now,
    updatedAt: now,
  };
}
