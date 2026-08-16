export type WorkStatus =
  | "unassessed"
  | "recovery"
  | "in-progress"
  | "ready-qc"
  | "standard"
  | "blocked";

export type Priority = "low" | "normal" | "high" | "urgent";
export type WorkCycle = "recovery" | "recurring" | "both";
export type ChemicalPolicy = "allowed" | "review" | "prohibited";
export type ReadinessStatus = "missing" | "in-progress" | "ready" | "not-applicable";
export type RecordStatus = "draft" | "ready" | "submitted";
export type VisitStatus =
  | "planned"
  | "checked-in"
  | "in-progress"
  | "completed-exceptions"
  | "ready-qc"
  | "closed"
  | "cancelled";
export type VisitKind = "recovery" | "recurring" | "corrective" | "inspection";
export type CrewRole = "owner" | "crew-lead" | "worker" | "specialty";
export type TimeEntryType = "travel" | "production" | "break";
export type ProofKind = "arrival" | "before" | "after" | "overview" | "exception" | "damage";
export type QcStatus = "not-started" | "pending" | "passed" | "rejected";
export type TicketStatus = "draft" | "ready" | "signed" | "submitted";
export type AcceptanceStatus = "not-reviewed" | "accepted" | "deficiency";
export type PaymentStatus =
  | "draft"
  | "submitted-to-amb"
  | "awaiting-government"
  | "government-paid"
  | "paid-to-grounds"
  | "disputed";

export type InventoryKind = "equipment" | "material" | "ppe";
export type InventoryStatus = "ready" | "service-due" | "out-of-service" | "restock";

export type PlanStatus = "planned" | "in-progress" | "ready-qc" | "complete" | "carryover";
export type PlanTool = "pan" | "zones" | "features" | "assign" | "measure" | "layers";

export type FeatureGroup =
  | "objects"
  | "lines-edges"
  | "ground-areas"
  | "problems-hazards"
  | "operations-access";

export type FeatureType =
  | "tree"
  | "bush-group"
  | "pole"
  | "sign"
  | "hydrant"
  | "guy-wire"
  | "utility-unit"
  | "drain-inlet"
  | "fence"
  | "sidewalk"
  | "curb-edge"
  | "building-perimeter"
  | "road-shoulder"
  | "retaining-wall"
  | "access-route"
  | "turf-area"
  | "ditch"
  | "parking-lot"
  | "gravel-lot"
  | "vehicle-row"
  | "building"
  | "patio-pad"
  | "slope-bank"
  | "rock-bed"
  | "thick-weeds"
  | "hole-soft-ground"
  | "standing-water"
  | "erosion-ruts"
  | "fallen-debris"
  | "wildlife-zone"
  | "weed-control-zone"
  | "blocked-access"
  | "staging-area"
  | "equipment-entry"
  | "qc-photo-point"
  | "no-mow-zone"
  | "custom-feature";

export type Point = { x: number; y: number };
export type Coordinates = { lat: number; lng: number };

export type Geometry = {
  kind: "point" | "line" | "polygon";
  points: Point[];
};

export type SiteMap = {
  id: string;
  label: string;
  imageUrl: string;
};

export type PwsCheck = {
  id: string;
  title: string;
  clause: string;
  standard: string;
  status: WorkStatus;
};

export type Site = {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  coordinates: Coordinates;
  monthlyServiceValue: number;
  condition: WorkStatus;
  lastVisit: string | null;
  nextVisit: string | null;
  notes: string;
  maps: SiteMap[];
  checklist: PwsCheck[];
};

export type ServicePart = {
  id: string;
  label: string;
  action: string;
  status: WorkStatus;
  equipment: string;
  method: string;
};

export type MapFeature = {
  id: string;
  siteId: string;
  mapId: string;
  code: string;
  name: string;
  featureType: FeatureType;
  group: FeatureGroup;
  status: WorkStatus;
  priority: Priority;
  cycle: WorkCycle;
  notes: string;
  geometry: Geometry;
  serviceParts: ServicePart[];
  equipment: string[];
  measurement: string;
  frequency: string;
  restrictions: string;
  chemicalPolicy: ChemicalPolicy;
  pwsClauses: string[];
  temporary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ManualTask = {
  id: string;
  siteId: string;
  title: string;
  featureType: FeatureType;
  status: WorkStatus;
  priority: Priority;
  notes: string;
  equipment: string;
  createdAt: string;
  updatedAt: string;
};

export type PesticideProduct = {
  id: string;
  brandName: string;
  activeIngredient: string;
  epaRegistrationNumber: string;
  labelUrl: string;
  sdsUrl: string;
  approvedStatus: "unverified" | "approved" | "not-approved";
  restrictedUse: boolean;
  permittedSites: string;
  targetWeeds: string;
  applicationRate: string;
  earliestRetreatmentDays: number | null;
  inspectionDays: number | null;
  keepOutHours: number | null;
  rainfastHours: number | null;
  annualLimit: string;
  ppe: string;
  weatherRestrictions: string;
  notes: string;
  updatedAt: string;
};

export type PesticideApplication = {
  id: string;
  siteId: string;
  mapId: string;
  featureId: string;
  productId: string;
  appliedAt: string;
  applicator: string;
  licenseNumber: string;
  targetWeeds: string;
  rate: string;
  totalQuantity: string;
  treatedArea: string;
  equipment: string;
  temperature: string;
  wind: string;
  rainConditions: string;
  notes: string;
  record1532Status: RecordStatus;
  effectiveness: "pending" | "effective" | "partial" | "failed" | "regrowth";
  plannedServiceAt: string | null;
  createdAt: string;
};

export type ReadinessItem = {
  id: string;
  title: string;
  detail: string;
  status: ReadinessStatus;
  dueDate: string | null;
  notes: string;
};

export type CrewMember = {
  id: string;
  name: string;
  role: CrewRole;
  phone: string;
  hourlyRate: number | null;
  active: boolean;
  eVerify: ReadinessStatus;
  badge: ReadinessStatus;
  siteAccess: ReadinessStatus;
  training: ReadinessStatus;
  authorizedDriver: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CapturedLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: string;
};

export type VisitAssignment = {
  id: string;
  sourceType: "feature" | "task" | "pws" | "custom";
  sourceId: string | null;
  title: string;
  assigneeIds: string[];
  status: WorkStatus;
  notes: string;
};

export type Visit = {
  id: string;
  siteId: string;
  scheduledDate: string;
  windowStart: string;
  windowEnd: string;
  lunchStart: string;
  lunchEnd: string;
  kind: VisitKind;
  status: VisitStatus;
  crewIds: string[];
  assignments: VisitAssignment[];
  checkInAt: string | null;
  startWorkAt: string | null;
  completedAt: string | null;
  checkOutAt: string | null;
  checkInLocation: CapturedLocation | null;
  checkOutLocation: CapturedLocation | null;
  exceptionNotes: string;
  qcStatus: QcStatus;
  qcNotes: string;
  qcAt: string | null;
  serviceTicketId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type TimeEntry = {
  id: string;
  visitId: string;
  siteId: string;
  crewMemberId: string;
  type: TimeEntryType;
  startAt: string;
  endAt: string | null;
  corrected: boolean;
  correctionReason: string;
  notes: string;
};

export type ProofRecord = {
  id: string;
  visitId: string;
  siteId: string;
  assignmentId: string | null;
  kind: ProofKind;
  objectKey: string;
  filename: string;
  contentType: string;
  note: string;
  location: CapturedLocation | null;
  capturedAt: string;
};

export type ServiceTicket = {
  id: string;
  visitId: string;
  ticketNumber: string;
  status: TicketStatus;
  servicesSummary: string;
  exceptions: string;
  contractorSignedBy: string;
  contractorSignedAt: string | null;
  governmentSignedBy: string;
  governmentSignedAt: string | null;
  acceptanceStatus: AcceptanceStatus;
  submittedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentRecord = {
  id: string;
  visitId: string;
  serviceTicketId: string;
  invoiceNumber: string;
  amount: number;
  status: PaymentStatus;
  invoicedAt: string | null;
  governmentPaidAt: string | null;
  paidToGroundsAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  kind: InventoryKind;
  quantity: number;
  unit: string;
  status: InventoryStatus;
  siteId: string | null;
  assigneeId: string | null;
  serviceDueDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PlanCycleSnapshot = {
  cycleNumber: number;
  cycleName: string;
  closedAt: string;
  status: PlanStatus;
  estimatedHours: number;
  completedZones: number;
  totalZones: number;
};

export type PlanDaySection = {
  id: string;
  name: string;
  sequence: number;
  color: string;
  geometry: Geometry;
  scheduledDate: string | null;
  status: PlanStatus;
  targetHours: number;
  budget: number;
  notes: string;
};

export type PlanWorkerZone = {
  id: string;
  sectionId: string;
  code: string;
  name: string;
  assigneeId: string | null;
  assigneeName: string;
  color: string;
  geometry: Geometry;
  estimatedHours: number;
  carryoverHours: number;
  budget: number;
  equipmentCost: number;
  materialsCost: number;
  featureIds: string[];
  status: PlanStatus;
  notes: string;
};

export type SiteWorkPlan = {
  id: string;
  siteId: string;
  mapId: string;
  cycleNumber: number;
  cycleName: string;
  crewCapacityHoursPerDay: number;
  loadedLaborMultiplier: number;
  status: PlanStatus;
  feetPerMapUnit?: number | null;
  calibrationLabel?: string;
  cycleHistory?: PlanCycleSnapshot[];
  daySections: PlanDaySection[];
  workerZones: PlanWorkerZone[];
  updatedAt: string;
};

export type AppState = {
  version: 3;
  sites: Site[];
  features: MapFeature[];
  tasks: ManualTask[];
  products: PesticideProduct[];
  applications: PesticideApplication[];
  readiness: ReadinessItem[];
  crew: CrewMember[];
  visits: Visit[];
  timeEntries: TimeEntry[];
  proofs: ProofRecord[];
  serviceTickets: ServiceTicket[];
  payments: PaymentRecord[];
  inventory: InventoryItem[];
  plans: SiteWorkPlan[];
  updatedAt: string;
};

export type LegacyV2AppState = Omit<
  AppState,
  "version" | "crew" | "visits" | "timeEntries" | "proofs" | "serviceTickets" | "payments" | "inventory" | "plans"
> & {
  version: 2;
};

// Legacy V1 names are kept only so the migration can read an older saved blob.
export type LegacyAnnotationCategory =
  | "section"
  | "obstacle"
  | "ditch"
  | "hill"
  | "mowing"
  | "edging"
  | "fence"
  | "shrub"
  | "paved-weeds"
  | "staging"
  | "note";

export type LegacyMapAnnotation = {
  id: string;
  siteId: string;
  mapId: string;
  label: string;
  category: LegacyAnnotationCategory;
  status: WorkStatus;
  priority: Priority;
  notes: string;
  geometry: Geometry;
  createdAt: string;
  updatedAt: string;
};

export type LegacyAppState = {
  version: 1;
  sites: Array<Omit<Site, "nextVisit">>;
  annotations: LegacyMapAnnotation[];
  tasks: Array<Omit<ManualTask, "featureType" | "equipment"> & { category: LegacyAnnotationCategory }>;
  updatedAt: string;
};
