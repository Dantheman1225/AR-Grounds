import type { AppState, PlanDaySection, PlanWorkerZone, PwsCheck, Site, SiteMap, SiteWorkPlan } from "./types";

type SiteSeed = Omit<Site, "condition" | "lastVisit" | "nextVisit" | "notes" | "checklist"> & {
  semiImproved: boolean;
  xeriscape: boolean;
};

const status = "unassessed" as const;

function pwsChecklist(code: string, semiImproved: boolean, xeriscape: boolean): PwsCheck[] {
  const rows: Omit<PwsCheck, "id" | "status">[] = [
    {
      title: "Pre-work policing",
      clause: "PWS 5.2.4.1",
      standard: "Remove litter, debris, branches, brush, and leaves before grounds work begins.",
    },
    {
      title: "Improved mowing",
      clause: "PWS 5.2.1.1",
      standard: "Maintain 2-3 inches with no skips, gaps, rutting, or scalping.",
    },
    ...(semiImproved
      ? [{
          title: "Semi-improved mowing",
          clause: "PWS 5.2.2.1",
          standard: "Maintain 2-4 inches with no skips, gaps, rutting, or scalping.",
        }]
      : []),
    {
      title: "Edging",
      clause: "PWS 5.2.1.2 / 5.2.2.2",
      standard: "Vegetation may extend no more than 1 inch onto hard surfaces.",
    },
    {
      title: "Fixed-object trimming",
      clause: "PWS 5.2.1.3 / 5.2.2.3",
      standard: "Trim around walls, poles, trees, hydrants, guy wires, and other fixed objects to mowing height.",
    },
    {
      title: "Fence-line trimming",
      clause: "PWS 5.2.1.4 / 5.2.2.4",
      standard: "Maintain vegetation within 5 feet on both sides of fence lines.",
    },
    {
      title: "Paved and unpaved weeds",
      clause: "PWS 5.2.1.5-6 / 5.2.2.5-6",
      standard: "Remove vegetation from cracks, joints, paved areas, and designated unpaved areas.",
    },
    {
      title: "Clippings and windrows",
      clause: "PWS 5.2.1.7 / 5.2.2.7",
      standard: "Remove visible clippings, windrows, clumps, and buildup that can damage turf.",
    },
    {
      title: "Trash and debris",
      clause: "PWS 5.2.1.8 / 5.2.2.8",
      standard: "Leave maintained lawn free of all visible trash and debris.",
    },
    {
      title: "Shrubs and vines",
      clause: "PWS 5.2.1.9",
      standard: "Prune for healthy growth, clear passage, and unobstructed sight lines.",
    },
    ...(xeriscape
      ? [{
          title: "Xeriscape and rock areas",
          clause: "PWS 5.2.3.1",
          standard: "Mechanically remove weeds without disturbing plantings; remove litter, brush, leaves, and debris.",
        }]
      : []),
    {
      title: "Visit closeout",
      clause: "PWS 5.3",
      standard: "Record services, date, exceptions, and signatures on the service ticket.",
    },
  ];

  return rows.map((row, index) => ({
    ...row,
    id: `${code.toLowerCase()}-pws-${index + 1}`,
    status,
  }));
}

function map(id: string, label: string, imageUrl: string): SiteMap {
  return { id, label, imageUrl };
}

const seeds: SiteSeed[] = [
  {
    id: "ar002",
    code: "AR002",
    name: "BG William O. Darby USARC",
    city: "Barling / Fort Smith",
    address: "101 Fort St, Barling, AR 72923 / 1150 Custer Blvd, Fort Smith, AR 72916",
    coordinates: { lat: 35.3478, lng: -94.3677 },
    monthlyServiceValue: 1812.04,
    semiImproved: true,
    xeriscape: false,
    maps: [
      map("ar002-barling", "Barling USARC", "/maps/ar002-barling.jpg"),
      map("ar002-mep", "Fort Smith MEP", "/maps/ar002-fort-smith-mep.jpg"),
    ],
  },
  {
    id: "ar019",
    code: "AR019",
    name: "Charles L. Gillihand USARC",
    city: "Harrison",
    address: "601 Sherman Ave, Harrison, AR 72601",
    coordinates: { lat: 36.2362, lng: -93.1079 },
    monthlyServiceValue: 1812.04,
    semiImproved: true,
    xeriscape: false,
    maps: [map("ar019-main", "Harrison USARC", "/maps/ar019-harrison.jpg")],
  },
  {
    id: "ar024",
    code: "AR024",
    name: "Maurice L. Britt USARC",
    city: "North Little Rock",
    address: "8000 Camp Robinson Rd, North Little Rock, AR 72118",
    coordinates: { lat: 34.8185, lng: -92.316 },
    monthlyServiceValue: 2047.62,
    semiImproved: true,
    xeriscape: true,
    maps: [map("ar024-main", "Camp Robinson", "/maps/ar024-camp-robinson.jpg")],
  },
  {
    id: "ar025",
    code: "AR025",
    name: "Oscar C. Finkbeiner USARC",
    city: "Little Rock",
    address: "1201 Bond St, Little Rock, AR 72202",
    coordinates: { lat: 34.7332, lng: -92.2906 },
    monthlyServiceValue: 1497.94,
    semiImproved: false,
    xeriscape: false,
    maps: [map("ar025-main", "Little Rock USARC", "/maps/ar025-little-rock.jpg")],
  },
  {
    id: "ar032",
    code: "AR032",
    name: "Russellville USARC",
    city: "Russellville",
    address: "2500 E Second St, Russellville, AR 72801",
    coordinates: { lat: 35.28, lng: -93.124 },
    monthlyServiceValue: 1812.04,
    semiImproved: true,
    xeriscape: false,
    maps: [map("ar032-main", "Russellville USARC", "/maps/ar032-russellville.jpg")],
  },
  {
    id: "ar047",
    code: "AR047",
    name: "Eldridge-Harrington USARC",
    city: "Conway",
    address: "1350 Thomas G Wilson Dr, Conway, AR 72032",
    coordinates: { lat: 35.0774, lng: -92.4289 },
    monthlyServiceValue: 1812.04,
    semiImproved: true,
    xeriscape: false,
    maps: [map("ar047-main", "Conway USARC", "/maps/ar047-conway.jpg")],
  },
  {
    id: "ar064",
    code: "AR064",
    name: "Arkadelphia AFRC",
    city: "Arkadelphia",
    address: "234 McClelland Blvd, Arkadelphia, AR 71923",
    coordinates: { lat: 34.1194, lng: -93.0541 },
    monthlyServiceValue: 2047.62,
    semiImproved: true,
    xeriscape: true,
    maps: [map("ar064-main", "Arkadelphia AFRC", "/maps/ar064-arkadelphia.jpg")],
  },
  {
    id: "ar066",
    code: "AR066",
    name: "El Dorado AFRC",
    city: "El Dorado",
    address: "418 N Calion Rd, El Dorado, AR 71730",
    coordinates: { lat: 33.217, lng: -92.6523 },
    monthlyServiceValue: 2047.62,
    semiImproved: true,
    xeriscape: true,
    maps: [map("ar066-main", "El Dorado AFRC", "/maps/ar066-el-dorado.jpg")],
  },
  {
    id: "ar069",
    code: "AR069",
    name: "Johnathan M. Cheatham AFRC",
    city: "Hot Springs",
    address: "2161 Albert Pike Rd, Hot Springs, AR 71913",
    coordinates: { lat: 34.5171, lng: -93.1002 },
    monthlyServiceValue: 2047.62,
    semiImproved: true,
    xeriscape: true,
    maps: [map("ar069-main", "Hot Springs AFRC", "/maps/ar069-hot-springs.jpg")],
  },
  {
    id: "ar071",
    code: "AR071",
    name: "Jonesboro AFRC",
    city: "Jonesboro",
    address: "6109 CW Post Rd, Jonesboro, AR 72401",
    coordinates: { lat: 35.8267, lng: -90.7036 },
    monthlyServiceValue: 2047.62,
    semiImproved: true,
    xeriscape: true,
    maps: [map("ar071-main", "Jonesboro AFRC", "/maps/ar071-jonesboro.jpg")],
  },
];

const planTimestamp = "2026-08-10T00:00:00.000Z";

const starterInventory: AppState["inventory"] = [
  { id: "inventory-zero-turn", name: "Zero-turn mower", kind: "equipment", quantity: 2, unit: "units", status: "ready", siteId: null, assigneeId: null, serviceDueDate: null, notes: "", createdAt: planTimestamp, updatedAt: planTimestamp },
  { id: "inventory-trimmer", name: "String trimmer", kind: "equipment", quantity: 5, unit: "units", status: "service-due", siteId: null, assigneeId: null, serviceDueDate: null, notes: "One unit needs service details.", createdAt: planTimestamp, updatedAt: planTimestamp },
  { id: "inventory-blower", name: "Backpack blower", kind: "equipment", quantity: 3, unit: "units", status: "ready", siteId: null, assigneeId: null, serviceDueDate: null, notes: "", createdAt: planTimestamp, updatedAt: planTimestamp },
  { id: "inventory-fuel-line", name: "Fuel and trimmer line", kind: "material", quantity: 2.5, unit: "crew-days", status: "restock", siteId: null, assigneeId: null, serviceDueDate: null, notes: "Restock before the next multi-site route.", createdAt: planTimestamp, updatedAt: planTimestamp },
  { id: "inventory-ppe", name: "PPE kit", kind: "ppe", quantity: 4, unit: "kits", status: "ready", siteId: null, assigneeId: "crew-danny", serviceDueDate: null, notes: "", createdAt: planTimestamp, updatedAt: planTimestamp },
  { id: "inventory-hand-tools", name: "Hand tools", kind: "equipment", quantity: 12, unit: "tools", status: "ready", siteId: null, assigneeId: null, serviceDueDate: null, notes: "", createdAt: planTimestamp, updatedAt: planTimestamp },
];

const campSections: PlanDaySection[] = [
  {
    id: "ar024-day-1",
    name: "Day 1",
    sequence: 1,
    color: "#33c8ec",
    geometry: { kind: "polygon", points: [{ x: 34, y: 32 }, { x: 557, y: 48 }, { x: 742, y: 222 }, { x: 699, y: 354 }, { x: 388, y: 410 }, { x: 92, y: 348 }] },
    scheduledDate: null,
    status: "planned",
    targetHours: 28,
    budget: 682.54,
    notes: "North and central improved grounds. Start with litter, obstacles, and primary turf lanes.",
  },
  {
    id: "ar024-day-2",
    name: "Day 2",
    sequence: 2,
    color: "#f29b38",
    geometry: { kind: "polygon", points: [{ x: 388, y: 410 }, { x: 699, y: 354 }, { x: 867, y: 331 }, { x: 972, y: 690 }, { x: 722, y: 748 }, { x: 436, y: 673 }] },
    scheduledDate: null,
    status: "planned",
    targetHours: 28,
    budget: 682.54,
    notes: "East and southeast grounds, drainage corridor, perimeter and heavy-growth recovery.",
  },
  {
    id: "ar024-day-3",
    name: "Day 3",
    sequence: 3,
    color: "#a76be8",
    geometry: { kind: "polygon", points: [{ x: 92, y: 348 }, { x: 388, y: 410 }, { x: 436, y: 673 }, { x: 722, y: 748 }, { x: 713, y: 766 }, { x: 159, y: 766 }] },
    scheduledDate: null,
    status: "planned",
    targetHours: 28,
    budget: 682.54,
    notes: "West and south grounds, final detail work, carryover, and cycle closeout.",
  },
];

const campZones: PlanWorkerZone[] = [
  {
    id: "ar024-d1-a", sectionId: "ar024-day-1", code: "D1-A", name: "Northwest", assigneeId: "crew-danny", assigneeName: "Danny", color: "#1c8ee8",
    geometry: { kind: "polygon", points: [{ x: 34, y: 32 }, { x: 286, y: 40 }, { x: 326, y: 217 }, { x: 80, y: 206 }] }, estimatedHours: 6.4, carryoverHours: 0, budget: 162.8, equipmentCost: 12, materialsCost: 8, featureIds: [], status: "planned", notes: "Turf, fixed-object trim, litter, and north access edge.",
  },
  {
    id: "ar024-d1-b", sectionId: "ar024-day-1", code: "D1-B", name: "Northeast", assigneeId: null, assigneeName: "Crew 2", color: "#42c576",
    geometry: { kind: "polygon", points: [{ x: 286, y: 40 }, { x: 557, y: 48 }, { x: 742, y: 222 }, { x: 512, y: 238 }, { x: 326, y: 217 }] }, estimatedHours: 7, carryoverHours: 0, budget: 173.2, equipmentCost: 14, materialsCost: 6, featureIds: [], status: "planned", notes: "Mowing lanes, obstacles, perimeter trim, and blow-off.",
  },
  {
    id: "ar024-d1-c", sectionId: "ar024-day-1", code: "D1-C", name: "Southwest", assigneeId: null, assigneeName: "Crew 3", color: "#a260e8",
    geometry: { kind: "polygon", points: [{ x: 80, y: 206 }, { x: 326, y: 217 }, { x: 388, y: 410 }, { x: 92, y: 348 }] }, estimatedHours: 6.8, carryoverHours: 0, budget: 169.8, equipmentCost: 10, materialsCost: 9, featureIds: [], status: "planned", notes: "Building edges, turf islands, detailed trimming, and inspection points.",
  },
  {
    id: "ar024-d1-d", sectionId: "ar024-day-1", code: "D1-D", name: "Southeast", assigneeId: null, assigneeName: "Crew 4", color: "#f09a31",
    geometry: { kind: "polygon", points: [{ x: 326, y: 217 }, { x: 512, y: 238 }, { x: 742, y: 222 }, { x: 699, y: 354 }, { x: 388, y: 410 }] }, estimatedHours: 7.3, carryoverHours: 0, budget: 176.74, equipmentCost: 16, materialsCost: 8, featureIds: [], status: "planned", notes: "Vehicle-row detail, southern turf, treatment review, and blow-off.",
  },
  {
    id: "ar024-d2-a", sectionId: "ar024-day-2", code: "D2-A", name: "East campus", assigneeId: "crew-danny", assigneeName: "Danny", color: "#1c8ee8",
    geometry: { kind: "polygon", points: [{ x: 699, y: 354 }, { x: 867, y: 331 }, { x: 922, y: 508 }, { x: 659, y: 532 }] }, estimatedHours: 7.1, carryoverHours: 0, budget: 176, equipmentCost: 18, materialsCost: 10, featureIds: [], status: "planned", notes: "East grounds and site features.",
  },
  {
    id: "ar024-d2-b", sectionId: "ar024-day-2", code: "D2-B", name: "Drainage", assigneeId: null, assigneeName: "Crew 2", color: "#42c576",
    geometry: { kind: "polygon", points: [{ x: 659, y: 532 }, { x: 922, y: 508 }, { x: 972, y: 690 }, { x: 722, y: 748 }] }, estimatedHours: 7.4, carryoverHours: 0, budget: 178, equipmentCost: 22, materialsCost: 12, featureIds: [], status: "planned", notes: "Ditch flow, brush edge, and southeast perimeter.",
  },
  {
    id: "ar024-d2-c", sectionId: "ar024-day-2", code: "D2-C", name: "Central east", assigneeId: null, assigneeName: "Crew 3", color: "#a260e8",
    geometry: { kind: "polygon", points: [{ x: 388, y: 410 }, { x: 699, y: 354 }, { x: 659, y: 532 }, { x: 531, y: 556 }] }, estimatedHours: 6.6, carryoverHours: 0, budget: 162.54, equipmentCost: 13, materialsCost: 8, featureIds: [], status: "planned", notes: "Central east mowing and detail.",
  },
  {
    id: "ar024-d2-d", sectionId: "ar024-day-2", code: "D2-D", name: "South central", assigneeId: null, assigneeName: "Crew 4", color: "#f09a31",
    geometry: { kind: "polygon", points: [{ x: 388, y: 410 }, { x: 531, y: 556 }, { x: 659, y: 532 }, { x: 722, y: 748 }, { x: 436, y: 673 }] }, estimatedHours: 6.9, carryoverHours: 0, budget: 166, equipmentCost: 17, materialsCost: 8, featureIds: [], status: "planned", notes: "South central mowing, edging, and treatment points.",
  },
  {
    id: "ar024-d3-a", sectionId: "ar024-day-3", code: "D3-A", name: "West campus", assigneeId: "crew-danny", assigneeName: "Danny", color: "#1c8ee8",
    geometry: { kind: "polygon", points: [{ x: 92, y: 348 }, { x: 388, y: 410 }, { x: 405, y: 543 }, { x: 136, y: 551 }] }, estimatedHours: 6.7, carryoverHours: 0, budget: 165, equipmentCost: 12, materialsCost: 7, featureIds: [], status: "planned", notes: "West campus detail.",
  },
  {
    id: "ar024-d3-b", sectionId: "ar024-day-3", code: "D3-B", name: "West perimeter", assigneeId: null, assigneeName: "Crew 2", color: "#42c576",
    geometry: { kind: "polygon", points: [{ x: 136, y: 551 }, { x: 405, y: 543 }, { x: 436, y: 673 }, { x: 159, y: 766 }] }, estimatedHours: 6.9, carryoverHours: 0, budget: 168, equipmentCost: 14, materialsCost: 8, featureIds: [], status: "planned", notes: "West perimeter and fence line.",
  },
  {
    id: "ar024-d3-c", sectionId: "ar024-day-3", code: "D3-C", name: "Southwest", assigneeId: null, assigneeName: "Crew 3", color: "#a260e8",
    geometry: { kind: "polygon", points: [{ x: 405, y: 543 }, { x: 584, y: 611 }, { x: 622, y: 742 }, { x: 436, y: 673 }] }, estimatedHours: 7.2, carryoverHours: 0, budget: 174.54, equipmentCost: 16, materialsCost: 9, featureIds: [], status: "planned", notes: "Southwest turf and close detail.",
  },
  {
    id: "ar024-d3-d", sectionId: "ar024-day-3", code: "D3-D", name: "Closeout", assigneeId: null, assigneeName: "Crew 4", color: "#f09a31",
    geometry: { kind: "polygon", points: [{ x: 405, y: 543 }, { x: 436, y: 673 }, { x: 622, y: 742 }, { x: 722, y: 748 }, { x: 584, y: 611 }] }, estimatedHours: 7.2, carryoverHours: 0, budget: 175, equipmentCost: 15, materialsCost: 8, featureIds: [], status: "planned", notes: "Carryover, QC sweep, and cycle closeout.",
  },
];

const campPlan: SiteWorkPlan = {
  id: "plan-ar024-main",
  siteId: "ar024",
  mapId: "ar024-main",
  cycleNumber: 4,
  cycleName: "August service cycle",
  crewCapacityHoursPerDay: 28,
  loadedLaborMultiplier: 1.18,
  status: "planned",
  daySections: campSections,
  workerZones: campZones,
  updatedAt: planTimestamp,
};

export const INITIAL_STATE: AppState = {
  version: 3,
  sites: seeds.map(({ semiImproved, xeriscape, ...site }) => ({
    ...site,
    condition: status,
    lastVisit: null,
    nextVisit: null,
    notes: "",
    checklist: pwsChecklist(site.code, semiImproved, xeriscape),
  })),
  features: [],
  tasks: [],
  products: [],
  applications: [],
  readiness: [
    {
      id: "readiness-e-verify",
      title: "E-Verify",
      detail: "Enrollment and employee verification record requested by AMB.",
      status: "in-progress",
      dueDate: null,
      notes: "",
    },
    {
      id: "readiness-employee-list",
      title: "Employee list",
      detail: "Current roster for personnel assigned to the contract.",
      status: "in-progress",
      dueDate: null,
      notes: "",
    },
    {
      id: "readiness-key-personnel",
      title: "Key personnel",
      detail: "Primary and alternate Grounds Maintenance points of contact.",
      status: "in-progress",
      dueDate: null,
      notes: "",
    },
    {
      id: "readiness-id-badges",
      title: "Employee ID badges",
      detail: "Company photo badges for personnel entering the sites.",
      status: "in-progress",
      dueDate: null,
      notes: "",
    },
    {
      id: "readiness-schedule",
      title: "All-location schedule",
      detail: "Current schedule for all ten contract locations.",
      status: "in-progress",
      dueDate: null,
      notes: "",
    },
  ],
  crew: [
    {
      id: "crew-danny",
      name: "Danny Phillips",
      role: "owner",
      phone: "",
      hourlyRate: null,
      active: true,
      eVerify: "ready",
      badge: "in-progress",
      siteAccess: "ready",
      training: "in-progress",
      authorizedDriver: true,
      notes: "Owner and primary Grounds Maintenance point of contact.",
      createdAt: "2026-08-10T00:00:00.000Z",
      updatedAt: "2026-08-10T00:00:00.000Z",
    },
  ],
  visits: [],
  timeEntries: [],
  proofs: [],
  serviceTickets: [],
  payments: [],
  inventory: starterInventory,
  plans: [campPlan],
  updatedAt: "2026-08-10T00:00:00.000Z",
};
