import { featureDefaults, PRESET_BY_TYPE } from "./feature-presets";
import { INITIAL_STATE } from "./initial-state";
import type {
  AppState,
  FeatureType,
  LegacyAnnotationCategory,
  LegacyAppState,
  LegacyV2AppState,
  MapFeature,
  Site,
} from "./types";

const LEGACY_TYPE_MAP: Record<LegacyAnnotationCategory, FeatureType> = {
  section: "custom-feature",
  obstacle: "hole-soft-ground",
  ditch: "ditch",
  hill: "slope-bank",
  mowing: "turf-area",
  edging: "curb-edge",
  fence: "fence",
  shrub: "bush-group",
  "paved-weeds": "parking-lot",
  staging: "staging-area",
  note: "custom-feature",
};

function mergeSites(candidateSites: Partial<Site>[] | undefined): Site[] {
  const byId = new Map((candidateSites ?? []).map((site) => [site.id, site]));
  return INITIAL_STATE.sites.map((seed) => {
    const saved = byId.get(seed.id);
    if (!saved) return seed;
    return {
      ...seed,
      ...saved,
      nextVisit: saved.nextVisit ?? null,
      coordinates: saved.coordinates ?? seed.coordinates,
      maps: Array.isArray(saved.maps) && saved.maps.length ? saved.maps : seed.maps,
      checklist: Array.isArray(saved.checklist) && saved.checklist.length ? saved.checklist : seed.checklist,
    };
  });
}

function normalizeFeature(feature: Partial<MapFeature>, index: number): MapFeature | null {
  if (!feature.id || !feature.siteId || !feature.mapId || !feature.geometry || !feature.featureType) return null;
  const preset = PRESET_BY_TYPE[feature.featureType];
  if (!preset) return null;
  const now = feature.updatedAt ?? feature.createdAt ?? new Date().toISOString();
  const base = featureDefaults(preset, feature.id, feature.siteId, feature.mapId, feature.geometry, index + 1, now);
  return {
    ...base,
    ...feature,
    code: feature.code || base.code,
    name: feature.name || base.name,
    serviceParts: Array.isArray(feature.serviceParts) && feature.serviceParts.length ? feature.serviceParts : base.serviceParts,
    equipment: Array.isArray(feature.equipment) ? feature.equipment : base.equipment,
    pwsClauses: Array.isArray(feature.pwsClauses) ? feature.pwsClauses : base.pwsClauses,
  };
}

function fromV1(state: LegacyAppState): AppState {
  const features = state.annotations.map((annotation, index) => {
    const featureType = LEGACY_TYPE_MAP[annotation.category] ?? "custom-feature";
    const preset = PRESET_BY_TYPE[featureType];
    const base = featureDefaults(
      preset,
      annotation.id,
      annotation.siteId,
      annotation.mapId,
      annotation.geometry,
      index + 1,
      annotation.updatedAt || annotation.createdAt,
    );
    return {
      ...base,
      name: annotation.label,
      status: annotation.status,
      priority: annotation.priority,
      notes: annotation.notes,
      serviceParts: base.serviceParts.map((part) => ({ ...part, status: annotation.status })),
      createdAt: annotation.createdAt,
      updatedAt: annotation.updatedAt,
    };
  });

  return {
    version: 3,
    sites: mergeSites(state.sites as Partial<Site>[]),
    features,
    tasks: state.tasks.map((task) => ({
      id: task.id,
      siteId: task.siteId,
      title: task.title,
      featureType: LEGACY_TYPE_MAP[task.category] ?? "custom-feature",
      status: task.status,
      priority: task.priority,
      notes: task.notes,
      equipment: "",
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })),
    products: [],
    applications: [],
    readiness: INITIAL_STATE.readiness,
    crew: INITIAL_STATE.crew,
    visits: [],
    timeEntries: [],
    proofs: [],
    serviceTickets: [],
    payments: [],
    inventory: INITIAL_STATE.inventory,
    plans: INITIAL_STATE.plans,
    updatedAt: state.updatedAt,
  };
}

function fromV2(state: LegacyV2AppState): AppState {
  const features = (Array.isArray(state.features) ? state.features : [])
    .map((feature, index) => normalizeFeature(feature, index))
    .filter((feature): feature is MapFeature => Boolean(feature));
  return {
    version: 3,
    sites: mergeSites(state.sites as Partial<Site>[] | undefined),
    features,
    tasks: Array.isArray(state.tasks) ? state.tasks : [],
    products: Array.isArray(state.products) ? state.products : [],
    applications: Array.isArray(state.applications) ? state.applications : [],
    readiness: Array.isArray(state.readiness) && state.readiness.length ? state.readiness : INITIAL_STATE.readiness,
    crew: INITIAL_STATE.crew,
    visits: [],
    timeEntries: [],
    proofs: [],
    serviceTickets: [],
    payments: [],
    inventory: INITIAL_STATE.inventory,
    plans: INITIAL_STATE.plans,
    updatedAt: typeof state.updatedAt === "string" ? state.updatedAt : new Date().toISOString(),
  };
}

export function migrateAppState(value: unknown): AppState {
  if (!value || typeof value !== "object") return INITIAL_STATE;
  const version = (value as { version?: number }).version;

  if (version === 1) {
    const legacy = value as Partial<LegacyAppState>;
    if (Array.isArray(legacy.annotations) && Array.isArray(legacy.tasks)) return fromV1(value as LegacyAppState);
    return INITIAL_STATE;
  }

  if (version === 2) return fromV2(value as LegacyV2AppState);

  if (version !== 3) return INITIAL_STATE;
  const candidate = value as Partial<AppState>;

  const features = (Array.isArray(candidate.features) ? candidate.features : [])
    .map((feature, index) => normalizeFeature(feature, index))
    .filter((feature): feature is MapFeature => Boolean(feature));

  return {
    version: 3,
    sites: mergeSites(candidate.sites as Partial<Site>[] | undefined),
    features,
    tasks: Array.isArray(candidate.tasks) ? candidate.tasks : [],
    products: Array.isArray(candidate.products) ? candidate.products : [],
    applications: Array.isArray(candidate.applications) ? candidate.applications : [],
    readiness: Array.isArray(candidate.readiness) && candidate.readiness.length
      ? candidate.readiness
      : INITIAL_STATE.readiness,
    crew: Array.isArray(candidate.crew) && candidate.crew.length ? candidate.crew : INITIAL_STATE.crew,
    visits: Array.isArray(candidate.visits) ? candidate.visits : [],
    timeEntries: Array.isArray(candidate.timeEntries) ? candidate.timeEntries : [],
    proofs: Array.isArray(candidate.proofs) ? candidate.proofs : [],
    serviceTickets: Array.isArray(candidate.serviceTickets) ? candidate.serviceTickets : [],
    payments: Array.isArray(candidate.payments) ? candidate.payments : [],
    inventory: Array.isArray(candidate.inventory) ? candidate.inventory : INITIAL_STATE.inventory,
    plans: Array.isArray(candidate.plans) && candidate.plans.length ? candidate.plans : INITIAL_STATE.plans,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString(),
  };
}

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AppState>;
  return candidate.version === 3
    && Array.isArray(candidate.sites)
    && Array.isArray(candidate.features)
    && Array.isArray(candidate.tasks)
    && Array.isArray(candidate.products)
    && Array.isArray(candidate.applications)
    && Array.isArray(candidate.readiness)
    && Array.isArray(candidate.crew)
    && Array.isArray(candidate.visits)
    && Array.isArray(candidate.timeEntries)
    && Array.isArray(candidate.proofs)
    && Array.isArray(candidate.serviceTickets)
    && Array.isArray(candidate.payments)
    && (candidate.inventory === undefined || Array.isArray(candidate.inventory))
    && Array.isArray(candidate.plans);
}
