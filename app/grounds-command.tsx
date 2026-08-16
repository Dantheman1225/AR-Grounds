"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Car,
  ClipboardList,
  CloudRain,
  CreditCard,
  FileText,
  FlaskConical,
  HardHat,
  Home,
  Lock,
  MapPinned,
  MapPin,
  Menu,
  Moon,
  Navigation,
  Package,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  SquareCheckBig,
  Timer,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  EQUIPMENT_OPTIONS,
  FEATURE_PRESETS,
  GROUP_META,
  PRESET_BY_TYPE,
  featureDefaults,
  type FeaturePreset,
} from "../lib/feature-presets";
import { INITIAL_STATE } from "../lib/initial-state";
import {
  fetchLiveRoute,
  fetchLiveWeather,
  fallbackRouteSummary,
  fallbackWeatherSummary,
  INTEGRATION_STACK,
  type LiveRouteSummary,
  type LiveWeatherSummary,
} from "../lib/live-integrations";
import OperationsV3, { ServiceTicketPrint } from "./operations-v3";
import PlanningWorkspace from "./planning-workspace";
import { InventoryView, ReportsView } from "./support-views";
import type {
  AppState,
  Coordinates,
  FeatureGroup,
  Geometry,
  ManualTask,
  MapFeature,
  PesticideApplication,
  PesticideProduct,
  Point,
  Priority,
  ServicePart,
  Site,
  WorkCycle,
  WorkStatus,
} from "../lib/types";

type View = "command" | "visits" | "schedule" | "map" | "features" | "work" | "crew" | "inventory" | "treatments" | "reports" | "finance" | "settings";
type LayerMode = "features" | "work" | "status" | "equipment" | "treatments";
type InspectorTab = "details" | "work" | "treatment";
type WorkFilter = "open" | "all" | "ready-qc" | "blocked";
type PrintMode = "visible" | "recovery" | "recurring" | "equipment" | "treatments";
type SaveStatus = "loading" | "saving" | "saved" | "error";
type Notice = { message: string; tone?: "success" | "warning" | "error" };
type CommandNotification = { id: string; title: string; detail: string; view: View; tone?: "warning" | "error" };
type ProfileMode = "owner" | "field";
// Later role pass: add "secretary" as a simplified admin view for schedules, documents, packets, messages, and action items.
type HomeActionItem = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  tone: "danger" | "warning" | "info";
  icon: LucideIcon;
  view: View;
  siteId?: string;
  visitId?: string;
};

type NavItem = {
  key: View;
  label: string;
  icon: LucideIcon;
  fieldVisible?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { key: "command", label: "Home", icon: Home, fieldVisible: true },
  { key: "visits", label: "Operations", icon: ClipboardList, fieldVisible: true },
  { key: "schedule", label: "Schedule", icon: CalendarDays, fieldVisible: true },
  { key: "crew", label: "Crews", icon: Users, fieldVisible: true },
  { key: "map", label: "Map", icon: MapPinned, fieldVisible: true },
  { key: "work", label: "Work", icon: SquareCheckBig, fieldVisible: true },
  { key: "inventory", label: "Inventory", icon: Package, fieldVisible: true },
  { key: "treatments", label: "Chemicals", icon: FlaskConical, fieldVisible: true },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "finance", label: "Payments", icon: CreditCard },
  { key: "settings", label: "Settings", icon: Settings },
];

const VALID_VIEWS = new Set<View>([...NAV_ITEMS.map((item) => item.key), "features"]);

function readRoute(): { view: View; siteId: string | null; mapId: string | null } {
  if (typeof window === "undefined") return { view: "command", siteId: null, mapId: null };
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [viewPart, query = ""] = raw.split("?");
  const savedDefault = window.localStorage.getItem("grounds-command.default-view") as View | null;
  const fallback = savedDefault && VALID_VIEWS.has(savedDefault) ? savedDefault : "command";
  const view = VALID_VIEWS.has(viewPart as View) ? viewPart as View : fallback;
  const params = new URLSearchParams(query);
  return { view, siteId: params.get("site"), mapId: params.get("map") };
}

function routeHash(view: View, siteId: string, mapId: string) {
  const params = new URLSearchParams({ site: siteId, map: mapId });
  return `#/${view}?${params.toString()}`;
}

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 773;

const STATUS_OPTIONS: WorkStatus[] = [
  "unassessed",
  "recovery",
  "in-progress",
  "ready-qc",
  "standard",
  "blocked",
];

const STATUS_META: Record<WorkStatus, { label: string; color: string; short: string }> = {
  unassessed: { label: "Unassessed", color: "#718078", short: "UN" },
  recovery: { label: "Recovery required", color: "#dc6539", short: "RC" },
  "in-progress": { label: "In progress", color: "#df9f31", short: "IP" },
  "ready-qc": { label: "Ready for QC", color: "#397fb6", short: "QC" },
  standard: { label: "PWS standard", color: "#2f8551", short: "OK" },
  blocked: { label: "Blocked", color: "#ad3e47", short: "BL" },
};

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  low: { label: "Low", color: "#7d8982" },
  normal: { label: "Normal", color: "#557066" },
  high: { label: "High", color: "#d77d2e" },
  urgent: { label: "Urgent", color: "#b33b46" },
};

const CYCLE_META: Record<WorkCycle, { label: string; color: string }> = {
  recovery: { label: "Recovery", color: "#db6538" },
  recurring: { label: "Recurring", color: "#3b8150" },
  both: { label: "Recovery → recurring", color: "#3d7195" },
};

const GROUP_ORDER: FeatureGroup[] = [
  "objects",
  "lines-edges",
  "ground-areas",
  "problems-hazards",
  "operations-access",
];

const LAYER_META: Record<LayerMode, { label: string; description: string }> = {
  features: { label: "Site features", description: "What physically exists" },
  work: { label: "Required work", description: "Recovery vs recurring" },
  status: { label: "Visit status", description: "Current completion state" },
  equipment: { label: "Equipment", description: "Primary method needed" },
  treatments: { label: "Pesticides", description: "Chemical eligibility" },
};

const EQUIPMENT_COLORS: Record<string, string> = {
  "Zero-turn mower": "#4f9657",
  "Walk-behind mower": "#6a9f5d",
  "Push mower": "#7eaa62",
  "String trimmer": "#c99532",
  "Blade brush cutter": "#d46f35",
  "Bush hog / tractor": "#a95835",
  "Remote slope mower": "#6d56a4",
  "Hand tools": "#7e6a52",
  Edger: "#a459af",
  "Backpack blower": "#4d83a0",
  "Approved herbicide": "#9d59b4",
  "Specialty operator": "#815485",
  "No equipment": "#737c78",
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return prefix + "-" + crypto.randomUUID();
  }
  return prefix + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function percent(complete: number, total: number) {
  return total ? Math.round((complete / total) * 100) : 0;
}

function geometryCenter(geometry: Geometry): Point {
  if (!geometry.points.length) return { x: 0, y: 0 };
  return {
    x: geometry.points.reduce((sum, point) => sum + point.x, 0) / geometry.points.length,
    y: geometry.points.reduce((sum, point) => sum + point.y, 0) / geometry.points.length,
  };
}

function formatDate(value: string | null | undefined, includeTime = false) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, includeTime
    ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const HOME_MAP_WIDTH = 760;
const HOME_MAP_HEIGHT = 286;
const OSM_TILE_SIZE = 256;

type TileSpec = {
  key: string;
  src: string;
  left: number;
  top: number;
};

type HomeMapModel = {
  tiles: TileSpec[];
  path: string;
  pins: Array<{ key: string; label: string; x: number; y: number; tone: "start" | "finish" }>;
};

function projectWorld(point: Coordinates, zoom: number) {
  const lat = clamp(point.lat, -85.05112878, 85.05112878);
  const sinLat = Math.sin(lat * Math.PI / 180);
  const scale = OSM_TILE_SIZE * 2 ** zoom;
  return {
    x: ((point.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function buildHomeMapModel(origin: Coordinates, destination: Coordinates, routePoints: Coordinates[]): HomeMapModel {
  const points = routePoints.length > 1 ? routePoints : [origin, destination];
  let bestZoom = 7;
  for (let zoom = 12; zoom >= 6; zoom -= 1) {
    const projected = points.map((point) => projectWorld(point, zoom));
    const minX = Math.min(...projected.map((point) => point.x));
    const maxX = Math.max(...projected.map((point) => point.x));
    const minY = Math.min(...projected.map((point) => point.y));
    const maxY = Math.max(...projected.map((point) => point.y));
    if (maxX - minX <= HOME_MAP_WIDTH - 128 && maxY - minY <= HOME_MAP_HEIGHT - 92) {
      bestZoom = zoom;
      break;
    }
  }

  const projected = points.map((point) => projectWorld(point, bestZoom));
  const minX = Math.min(...projected.map((point) => point.x));
  const maxX = Math.max(...projected.map((point) => point.x));
  const minY = Math.min(...projected.map((point) => point.y));
  const maxY = Math.max(...projected.map((point) => point.y));
  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const topLeft = { x: center.x - HOME_MAP_WIDTH / 2, y: center.y - HOME_MAP_HEIGHT / 2 };
  const tileMinX = Math.floor(topLeft.x / OSM_TILE_SIZE);
  const tileMaxX = Math.floor((topLeft.x + HOME_MAP_WIDTH) / OSM_TILE_SIZE);
  const tileMinY = Math.floor(topLeft.y / OSM_TILE_SIZE);
  const tileMaxY = Math.floor((topLeft.y + HOME_MAP_HEIGHT) / OSM_TILE_SIZE);
  const tileLimit = 2 ** bestZoom;
  const tiles: TileSpec[] = [];

  for (let x = tileMinX; x <= tileMaxX; x += 1) {
    for (let y = tileMinY; y <= tileMaxY; y += 1) {
      if (y < 0 || y >= tileLimit) continue;
      const wrappedX = ((x % tileLimit) + tileLimit) % tileLimit;
      tiles.push({
        key: `${bestZoom}-${wrappedX}-${y}`,
        src: `https://tile.openstreetmap.org/${bestZoom}/${wrappedX}/${y}.png`,
        left: Math.round(x * OSM_TILE_SIZE - topLeft.x),
        top: Math.round(y * OSM_TILE_SIZE - topLeft.y),
      });
    }
  }

  const toScreen = (point: Coordinates) => {
    const world = projectWorld(point, bestZoom);
    return {
      x: clamp(world.x - topLeft.x, 0, HOME_MAP_WIDTH),
      y: clamp(world.y - topLeft.y, 0, HOME_MAP_HEIGHT),
    };
  };
  const path = points.map((point, index) => {
    const screen = toScreen(point);
    return `${index === 0 ? "M" : "L"} ${screen.x.toFixed(1)} ${screen.y.toFixed(1)}`;
  }).join(" ");
  const originScreen = toScreen(origin);
  const destinationScreen = toScreen(destination);

  return {
    tiles,
    path,
    pins: [
      { key: "origin", label: "Start", x: originScreen.x, y: originScreen.y, tone: "start" },
      { key: "destination", label: "Next", x: destinationScreen.x, y: destinationScreen.y, tone: "finish" },
    ],
  };
}

function formatDistance(value: number | null) {
  return value === null ? "Checking" : `${value.toFixed(value >= 100 ? 0 : 1)} mi`;
}

function formatDuration(value: number | null) {
  return value === null ? "Checking" : `${value} min`;
}

function etaFromDuration(value: number | null) {
  if (value === null) return "Checking";
  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + value);
  return eta.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function weatherTemp(value: number | null) {
  return value === null ? "Checking" : `${value}°F`;
}

function providerTime(value: string | null) {
  return value ? `Updated ${formatDate(value, true)}` : "Awaiting live provider";
}

function HomeRouteMap({ origin, destination, route }: { origin: Site; destination: Site; route: LiveRouteSummary }) {
  const model = useMemo(
    () => buildHomeMapModel(origin.coordinates, destination.coordinates, route.routePoints),
    [destination.coordinates, origin.coordinates, route.routePoints],
  );

  return (
    <div className="gc-route-map" role="img" aria-label={`Route map from ${origin.city} to ${destination.city}`}>
      <div className="gc-map-tiles" aria-hidden="true">
        {model.tiles.map((tile) => (
          <img
            alt=""
            draggable={false}
            key={tile.key}
            src={tile.src}
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
        <svg className="gc-map-route" viewBox={`0 0 ${HOME_MAP_WIDTH} ${HOME_MAP_HEIGHT}`} preserveAspectRatio="none">
          <path className="shadow" d={model.path} />
          <path d={model.path} />
        </svg>
        {model.pins.map((pin) => (
          <span
            className={cx("gc-map-pin", pin.tone)}
            key={pin.key}
            style={{ left: pin.x, top: pin.y } as CSSProperties}
          >
            <i />
            <b>{pin.label}</b>
          </span>
        ))}
      </div>
      <div className={cx("gc-map-source", route.status)}>
        <strong>{route.provider}</strong>
        <span>{route.message ?? route.sourceLabel}</span>
      </div>
      <a className="gc-map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
    </div>
  );
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function addTime(value: string, amount: number | null, unit: "hours" | "days") {
  if (amount === null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setTime(date.getTime() + amount * (unit === "days" ? 86_400_000 : 3_600_000));
  return date.toISOString();
}

function siteProgress(site: Site) {
  const complete = site.checklist.filter((item) => item.status === "standard").length;
  return { complete, total: site.checklist.length, percent: percent(complete, site.checklist.length) };
}

function featureLabel(feature: MapFeature) {
  return feature.code + " · " + feature.name;
}

function featureColor(feature: MapFeature, mode: LayerMode) {
  if (mode === "features") return PRESET_BY_TYPE[feature.featureType].color;
  if (mode === "work") return CYCLE_META[feature.cycle].color;
  if (mode === "status") return STATUS_META[feature.status].color;
  if (mode === "equipment") return EQUIPMENT_COLORS[feature.equipment[0] || "No equipment"] || "#64726c";
  if (feature.chemicalPolicy === "allowed") return "#408c57";
  if (feature.chemicalPolicy === "review") return "#b17a2d";
  return "#9b3f47";
}

function featureOpacity(feature: MapFeature, mode: LayerMode) {
  if (mode === "treatments" && feature.featureType !== "weed-control-zone" && feature.chemicalPolicy === "prohibited") {
    return 0.14;
  }
  return 1;
}

function applicationTimers(application: PesticideApplication, product?: PesticideProduct) {
  return {
    keepOutUntil: addTime(application.appliedAt, product?.keepOutHours ?? null, "hours"),
    rainfastAt: addTime(application.appliedAt, product?.rainfastHours ?? null, "hours"),
    inspectAt: addTime(application.appliedAt, product?.inspectionDays ?? null, "days"),
    retreatAt: addTime(application.appliedAt, product?.earliestRetreatmentDays ?? null, "days"),
    plannedAt: application.plannedServiceAt,
  };
}

function dueLabel(application: PesticideApplication, product?: PesticideProduct) {
  const timers = applicationTimers(application, product);
  const now = Date.now();
  if (application.effectiveness === "pending" && timers.inspectAt && new Date(timers.inspectAt).getTime() <= now) {
    return { label: "Inspection due", tone: "danger" };
  }
  if (timers.plannedAt && new Date(timers.plannedAt).getTime() <= now) {
    return { label: "Planned service due", tone: "danger" };
  }
  if (timers.inspectAt) return { label: "Inspect " + formatDate(timers.inspectAt), tone: "warning" };
  return { label: "No inspection timer", tone: "muted" };
}

function StatusPill({ status, compact = false }: { status: WorkStatus; compact?: boolean }) {
  const meta = STATUS_META[status];
  return (
    <span className={cx("gc-status-pill", compact && "compact")} style={{ "--tone": meta.color } as CSSProperties}>
      <span>{compact ? meta.short : ""}</span>
      {!compact && meta.label}
    </span>
  );
}

function StatusSelect({
  value,
  onChange,
  compact = false,
  label = "Status",
}: {
  value: WorkStatus;
  onChange: (status: WorkStatus) => void;
  compact?: boolean;
  label?: string;
}) {
  return (
    <label className={cx("gc-select-wrap", compact && "compact")}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as WorkStatus)}>
        {STATUS_OPTIONS.map((status) => (
          <option value={status} key={status}>{STATUS_META[status].label}</option>
        ))}
      </select>
    </label>
  );
}

function FeatureShapes({
  features,
  layerMode,
  selectedId,
  onSelect,
  interactive = true,
}: {
  features: MapFeature[];
  layerMode: LayerMode;
  selectedId?: string | null;
  onSelect?: (feature: MapFeature) => void;
  interactive?: boolean;
}) {
  return (
    <>
      {features.map((feature, index) => {
        const preset = PRESET_BY_TYPE[feature.featureType];
        const color = featureColor(feature, layerMode);
        const center = geometryCenter(feature.geometry);
        const points = feature.geometry.points.map((point) => point.x + "," + point.y).join(" ");
        const selected = feature.id === selectedId;
        const opacity = featureOpacity(feature, layerMode);
        return (
          <g
            key={feature.id}
            className={cx("gc-map-shape", interactive && "interactive", selected && "selected")}
            opacity={opacity}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            onPointerDown={interactive ? (event) => {
              event.stopPropagation();
              onSelect?.(feature);
            } : undefined}
            onKeyDown={interactive ? (event) => {
              if (event.key === "Enter" || event.key === " ") onSelect?.(feature);
            } : undefined}
          >
            <title>{featureLabel(feature)}</title>
            {feature.geometry.kind === "polygon" && (
              <polygon
                points={points}
                fill={color}
                fillOpacity={selected ? 0.34 : 0.2}
                stroke={selected ? "#132b20" : color}
                strokeWidth={selected ? 7 : 4}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {feature.geometry.kind === "line" && (
              <>
                <polyline
                  points={points}
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity="0.85"
                  strokeWidth={selected ? 14 : 11}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <polyline
                  points={points}
                  fill="none"
                  stroke={selected ? "#132b20" : color}
                  strokeWidth={selected ? 9 : 7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}
            {feature.geometry.kind === "point" && (
              <>
                <circle cx={center.x} cy={center.y} r={selected ? 25 : 22} fill="#ffffff" stroke={selected ? "#132b20" : color} strokeWidth={selected ? 7 : 5} vectorEffect="non-scaling-stroke" />
                <circle cx={center.x} cy={center.y} r="16" fill={color} />
                <text x={center.x} y={center.y + 4} textAnchor="middle" className="gc-pin-code">{preset.shortLabel}</text>
              </>
            )}
            {feature.geometry.kind !== "point" && (
              <g className="gc-shape-label">
                <rect x={center.x - 28} y={center.y - 15} width="56" height="30" rx="15" fill="#ffffff" stroke={color} strokeWidth="3" />
                <text x={center.x} y={center.y + 4} textAnchor="middle">{feature.code || index + 1}</text>
              </g>
            )}
            {feature.priority === "urgent" && (
              <circle cx={center.x + 23} cy={center.y - 22} r="8" fill="#b33b46" stroke="#ffffff" strokeWidth="3" />
            )}
          </g>
        );
      })}
    </>
  );
}

function FeatureLibrary({
  activePreset,
  onChoose,
  search,
  onSearch,
  onClose,
  className,
}: {
  activePreset: FeaturePreset | null;
  onChoose: (preset: FeaturePreset) => void;
  search: string;
  onSearch: (value: string) => void;
  onClose?: () => void;
  className?: string;
}) {
  const query = search.trim().toLowerCase();
  return (
    <aside className={cx("gc-feature-library", className)}>
      <div className="gc-panel-heading">
        <div>
          <p className="gc-eyebrow">Advanced editor</p>
          <h2>Add a site feature</h2>
        </div>
        <div className="gc-panel-heading-actions">
          <span className="gc-count">{FEATURE_PRESETS.length}</span>
          {onClose && <button type="button" className="gc-mobile-palette-close" onClick={onClose} aria-label="Close feature library">×</button>}
        </div>
      </div>
      <label className="gc-search">
        <span>⌕</span>
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search tree, fence, ditch..." />
      </label>
      <div className="gc-preset-groups">
        {GROUP_ORDER.map((group) => {
          const presets = FEATURE_PRESETS.filter((preset) => preset.group === group)
            .filter((preset) => !query || (preset.label + " " + preset.description).toLowerCase().includes(query));
          if (!presets.length) return null;
          return (
            <details key={group} open={query ? true : group === "objects" || group === "ground-areas"}>
              <summary>
                <span>{GROUP_META[group].label}</span>
                <small>{presets.length}</small>
              </summary>
              <div className="gc-preset-grid">
                {presets.map((preset) => (
                  <button
                    type="button"
                    key={preset.type}
                    className={cx("gc-preset-button", activePreset?.type === preset.type && "active")}
                    onClick={() => onChoose(preset)}
                    title={preset.description}
                  >
                    <span style={{ "--preset": preset.color } as CSSProperties}>{preset.shortLabel}</span>
                    <strong>{preset.label}</strong>
                    <small>{preset.geometry === "point" ? "Stamp" : preset.geometry === "line" ? "Trace" : "Area"}</small>
                  </button>
                ))}
              </div>
            </details>
          );
        })}
      </div>
      <div className="gc-library-tip">
        <strong>Fast capture</strong>
        <p>Place the real feature now. Add measurements, exact methods, and special restrictions in its inspector.</p>
      </div>
    </aside>
  );
}

function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product: PesticideProduct | null;
  onClose: () => void;
  onSave: (product: PesticideProduct) => void;
}) {
  const [form, setForm] = useState<PesticideProduct>(() => product ?? {
    id: makeId("product"),
    brandName: "",
    activeIngredient: "",
    epaRegistrationNumber: "",
    labelUrl: "",
    sdsUrl: "",
    approvedStatus: "unverified",
    restrictedUse: false,
    permittedSites: "",
    targetWeeds: "",
    applicationRate: "",
    earliestRetreatmentDays: null,
    inspectionDays: null,
    keepOutHours: null,
    rainfastHours: null,
    annualLimit: "",
    ppe: "",
    weatherRestrictions: "",
    notes: "",
    updatedAt: new Date().toISOString(),
  });

  const setNumber = (key: "earliestRetreatmentDays" | "inspectionDays" | "keepOutHours" | "rainfastHours", value: string) => {
    setForm((current) => ({ ...current, [key]: value === "" ? null : Number(value) }));
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.brandName.trim() || !form.epaRegistrationNumber.trim()) return;
    onSave({ ...form, brandName: form.brandName.trim(), epaRegistrationNumber: form.epaRegistrationNumber.trim(), updatedAt: new Date().toISOString() });
  }

  return (
    <div className="gc-modal-backdrop" onPointerDown={onClose}>
      <form className="gc-modal gc-modal-wide" onSubmit={submit} onPointerDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <p className="gc-eyebrow">Product library</p>
            <h2>{product ? "Edit pesticide product" : "Add pesticide product"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="gc-safety-callout">
          <strong>Enter these values from the current product label.</strong>
          <span>The app uses them for reminders only. The label, IPMP, site approval, and applicator certification still control every application.</span>
        </div>
        <div className="gc-form-grid two">
          <label><span>Brand name *</span><input value={form.brandName} onChange={(event) => setForm({ ...form, brandName: event.target.value })} /></label>
          <label><span>EPA registration number *</span><input value={form.epaRegistrationNumber} onChange={(event) => setForm({ ...form, epaRegistrationNumber: event.target.value })} /></label>
          <label><span>Active ingredient</span><input value={form.activeIngredient} onChange={(event) => setForm({ ...form, activeIngredient: event.target.value })} /></label>
          <label><span>Army / IPMP status</span><select value={form.approvedStatus} onChange={(event) => setForm({ ...form, approvedStatus: event.target.value as PesticideProduct["approvedStatus"] })}><option value="unverified">Unverified</option><option value="approved">Approved</option><option value="not-approved">Not approved</option></select></label>
          <label><span>Current label URL</span><input type="url" value={form.labelUrl} onChange={(event) => setForm({ ...form, labelUrl: event.target.value })} /></label>
          <label><span>SDS URL</span><input type="url" value={form.sdsUrl} onChange={(event) => setForm({ ...form, sdsUrl: event.target.value })} /></label>
          <label><span>Permitted sites / surfaces</span><input value={form.permittedSites} onChange={(event) => setForm({ ...form, permittedSites: event.target.value })} /></label>
          <label><span>Target weeds</span><input value={form.targetWeeds} onChange={(event) => setForm({ ...form, targetWeeds: event.target.value })} /></label>
          <label><span>Label application rate</span><input value={form.applicationRate} onChange={(event) => setForm({ ...form, applicationRate: event.target.value })} /></label>
          <label><span>Annual / seasonal limit</span><input value={form.annualLimit} onChange={(event) => setForm({ ...form, annualLimit: event.target.value })} /></label>
          <label><span>Results inspection after (days)</span><input type="number" min="0" value={form.inspectionDays ?? ""} onChange={(event) => setNumber("inspectionDays", event.target.value)} /></label>
          <label><span>Earliest retreatment after (days)</span><input type="number" min="0" value={form.earliestRetreatmentDays ?? ""} onChange={(event) => setNumber("earliestRetreatmentDays", event.target.value)} /></label>
          <label><span>Keep-out / re-entry (hours)</span><input type="number" min="0" value={form.keepOutHours ?? ""} onChange={(event) => setNumber("keepOutHours", event.target.value)} /></label>
          <label><span>Rainfast period (hours)</span><input type="number" min="0" value={form.rainfastHours ?? ""} onChange={(event) => setNumber("rainfastHours", event.target.value)} /></label>
          <label><span>Required PPE</span><input value={form.ppe} onChange={(event) => setForm({ ...form, ppe: event.target.value })} /></label>
          <label><span>Weather restrictions</span><input value={form.weatherRestrictions} onChange={(event) => setForm({ ...form, weatherRestrictions: event.target.value })} /></label>
        </div>
        <label className="gc-check-row"><input type="checkbox" checked={form.restrictedUse} onChange={(event) => setForm({ ...form, restrictedUse: event.target.checked })} /><span>Restricted-use product</span></label>
        <label className="gc-full-field"><span>Notes</span><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <footer>
          <button type="button" className="gc-button secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="gc-button primary" disabled={!form.brandName.trim() || !form.epaRegistrationNumber.trim()}>Save product</button>
        </footer>
      </form>
    </div>
  );
}

function ApplicationModal({
  feature,
  products,
  onClose,
  onSave,
}: {
  feature: MapFeature;
  products: PesticideProduct[];
  onClose: () => void;
  onSave: (application: PesticideApplication) => void;
}) {
  const now = toLocalDateTime(new Date().toISOString());
  const [form, setForm] = useState({
    productId: products[0]?.id ?? "",
    appliedAt: now,
    applicator: "",
    licenseNumber: "",
    targetWeeds: "",
    rate: "",
    totalQuantity: "",
    treatedArea: feature.measurement,
    equipment: "",
    temperature: "",
    wind: "",
    rainConditions: "",
    notes: "",
    record1532Status: "draft" as PesticideApplication["record1532Status"],
    plannedServiceAt: "",
  });
  const selectedProduct = products.find((product) => product.id === form.productId);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.productId || !form.applicator.trim() || !form.licenseNumber.trim()) return;
    onSave({
      id: makeId("application"),
      siteId: feature.siteId,
      mapId: feature.mapId,
      featureId: feature.id,
      productId: form.productId,
      appliedAt: fromLocalDateTime(form.appliedAt),
      applicator: form.applicator.trim(),
      licenseNumber: form.licenseNumber.trim(),
      targetWeeds: form.targetWeeds.trim(),
      rate: form.rate.trim(),
      totalQuantity: form.totalQuantity.trim(),
      treatedArea: form.treatedArea.trim(),
      equipment: form.equipment.trim(),
      temperature: form.temperature.trim(),
      wind: form.wind.trim(),
      rainConditions: form.rainConditions.trim(),
      notes: form.notes.trim(),
      record1532Status: form.record1532Status,
      effectiveness: "pending",
      plannedServiceAt: form.plannedServiceAt ? fromLocalDateTime(form.plannedServiceAt) : null,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="gc-modal-backdrop" onPointerDown={onClose}>
      <form className="gc-modal gc-modal-wide" onSubmit={submit} onPointerDown={(event) => event.stopPropagation()}>
        <header>
          <div><p className="gc-eyebrow">Treatment record</p><h2>{featureLabel(feature)}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="gc-safety-callout">
          <strong>Recording an application is not permission to apply.</strong>
          <span>Confirm the exact label, approved site, certified applicator, weather, buffers, sensitive areas, calibration, and required reporting first.</span>
        </div>
        <div className="gc-form-grid two">
          <label><span>Product *</span><select value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}><option value="">Choose product</option>{products.map((product) => <option value={product.id} key={product.id}>{product.brandName} · {product.epaRegistrationNumber}</option>)}</select></label>
          <label><span>Applied date and time *</span><input type="datetime-local" value={form.appliedAt} onChange={(event) => setForm({ ...form, appliedAt: event.target.value })} /></label>
          <label><span>Certified applicator *</span><input value={form.applicator} onChange={(event) => setForm({ ...form, applicator: event.target.value })} /></label>
          <label><span>License number *</span><input value={form.licenseNumber} onChange={(event) => setForm({ ...form, licenseNumber: event.target.value })} /></label>
          <label><span>Target weeds</span><input value={form.targetWeeds} onChange={(event) => setForm({ ...form, targetWeeds: event.target.value })} /></label>
          <label><span>Actual rate</span><input value={form.rate} placeholder={selectedProduct?.applicationRate || "From label"} onChange={(event) => setForm({ ...form, rate: event.target.value })} /></label>
          <label><span>Total quantity used</span><input value={form.totalQuantity} onChange={(event) => setForm({ ...form, totalQuantity: event.target.value })} /></label>
          <label><span>Treated area</span><input value={form.treatedArea} onChange={(event) => setForm({ ...form, treatedArea: event.target.value })} /></label>
          <label><span>Application equipment</span><input value={form.equipment} onChange={(event) => setForm({ ...form, equipment: event.target.value })} /></label>
          <label><span>Temperature</span><input value={form.temperature} onChange={(event) => setForm({ ...form, temperature: event.target.value })} /></label>
          <label><span>Wind</span><input value={form.wind} onChange={(event) => setForm({ ...form, wind: event.target.value })} /></label>
          <label><span>Rain conditions / forecast</span><input value={form.rainConditions} onChange={(event) => setForm({ ...form, rainConditions: event.target.value })} /></label>
          <label><span>1532 record</span><select value={form.record1532Status} onChange={(event) => setForm({ ...form, record1532Status: event.target.value as PesticideApplication["record1532Status"] })}><option value="draft">Draft</option><option value="ready">Ready to submit</option><option value="submitted">Submitted</option></select></label>
          <label><span>Planned service / review</span><input type="datetime-local" value={form.plannedServiceAt} onChange={(event) => setForm({ ...form, plannedServiceAt: event.target.value })} /></label>
        </div>
        <label className="gc-full-field"><span>Conditions, buffers, or unusual notes</span><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <footer>
          <button type="button" className="gc-button secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="gc-button primary" disabled={!form.productId || !form.applicator.trim() || !form.licenseNumber.trim()}>Record application</button>
        </footer>
      </form>
    </div>
  );
}

function PrintModal({
  mode,
  onMode,
  onClose,
  onPrint,
}: {
  mode: PrintMode;
  onMode: (mode: PrintMode) => void;
  onClose: () => void;
  onPrint: () => void;
}) {
  const options: Array<{ mode: PrintMode; label: string; detail: string }> = [
    { mode: "visible", label: "Current map", detail: "Everything currently visible on this map." },
    { mode: "recovery", label: "Recovery map", detail: "Recovery features, temporary problems, and blocked work." },
    { mode: "recurring", label: "Recurring maintenance", detail: "Permanent features and repeating service work." },
    { mode: "equipment", label: "Equipment-needs map", detail: "Color-coded by each feature's primary equipment." },
    { mode: "treatments", label: "Pesticide map", detail: "Treatment zones, eligibility, and application status." },
  ];
  return (
    <div className="gc-modal-backdrop" onPointerDown={onClose}>
      <section className="gc-modal gc-print-modal" onPointerDown={(event) => event.stopPropagation()}>
        <header>
          <div><p className="gc-eyebrow">Landscape field sheet</p><h2>Print / Save PDF</h2></div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="gc-print-options">
          {options.map((option) => (
            <label className={cx(mode === option.mode && "active")} key={option.mode}>
              <input type="radio" name="print-mode" checked={mode === option.mode} onChange={() => onMode(option.mode)} />
              <span><strong>{option.label}</strong><small>{option.detail}</small></span>
            </label>
          ))}
        </div>
        <p className="gc-modal-note">The PDF includes the annotated map, matching legend, numbered work list, current location condition, and PWS progress.</p>
        <footer>
          <button type="button" className="gc-button secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="gc-button primary" onClick={onPrint}>Open print dialog</button>
        </footer>
      </section>
    </div>
  );
}

function QuickTaskForm({
  sites,
  defaultSiteId,
  onAdd,
}: {
  sites: Site[];
  defaultSiteId: string;
  onAdd: (task: Omit<ManualTask, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [title, setTitle] = useState("");
  const [siteId, setSiteId] = useState(defaultSiteId);
  const [priority, setPriority] = useState<Priority>("normal");
  const [equipment, setEquipment] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd({ siteId, title: title.trim(), featureType: "custom-feature", status: "recovery", priority, notes: "", equipment });
    setTitle("");
  }
  return (
    <form className="gc-quick-task" onSubmit={submit}>
      <div><p className="gc-eyebrow">Unmapped work</p><h2>Catch it before it gets forgotten.</h2></div>
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What still needs to be done?" />
      <select value={siteId} onChange={(event) => setSiteId(event.target.value)}>{sites.map((site) => <option value={site.id} key={site.id}>{site.code} · {site.city}</option>)}</select>
      <select value={equipment} onChange={(event) => setEquipment(event.target.value)}><option value="">Equipment</option>{EQUIPMENT_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>{Object.entries(PRIORITY_META).map(([key, value]) => <option value={key} key={key}>{value.label}</option>)}</select>
      <button className="gc-button primary" type="submit" disabled={!title.trim()}>Add task</button>
    </form>
  );
}

export default function GroundsCommand({ ownerName, todayLabel }: { ownerName: string; todayLabel: string }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const [view, setViewState] = useState<View>("command");
  const [profileMode, setProfileMode] = useState<ProfileMode>(() => typeof window !== "undefined" && window.localStorage.getItem("grounds-command.profile-mode") === "field" ? "field" : "owner");
  const [defaultView, setDefaultView] = useState<View>(() => typeof window !== "undefined" && VALID_VIEWS.has(window.localStorage.getItem("grounds-command.default-view") as View) ? window.localStorage.getItem("grounds-command.default-view") as View : "command");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [compactNavigation, setCompactNavigation] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState(INITIAL_STATE.sites[0].id);
  const [selectedMapIds, setSelectedMapIds] = useState<Record<string, string>>({});
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("details");
  const [activePreset, setActivePreset] = useState<FeaturePreset | null>(null);
  const [draftGeometry, setDraftGeometry] = useState<Geometry | null>(null);
  const [layerMode, setLayerMode] = useState<LayerMode>("features");
  const [zoom, setZoom] = useState(1);
  const [presetSearch, setPresetSearch] = useState("");
  const [featureSearch, setFeatureSearch] = useState("");
  const [workFilter, setWorkFilter] = useState<WorkFilter>("open");
  const [siteFilter, setSiteFilter] = useState("all");
  const [stampMode, setStampMode] = useState(true);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [productModal, setProductModal] = useState<PesticideProduct | "new" | null>(null);
  const [applicationFeatureId, setApplicationFeatureId] = useState<string | null>(null);
  const [printModal, setPrintModal] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("visible");
  const [printTarget, setPrintTarget] = useState<"map" | "ticket">("map");
  const [printVisitId, setPrintVisitId] = useState<string | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [historyState, setHistoryState] = useState({ undo: 0, redo: 0 });
  const mapSvgRef = useRef<SVGSVGElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuCloseRef = useRef<HTMLButtonElement | null>(null);
  const railRef = useRef<HTMLElement | null>(null);
  const notificationWrapRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef("");
  const undoRef = useRef<AppState[]>([]);
  const redoRef = useRef<AppState[]>([]);

  const setView = useCallback((next: View) => {
    setViewState(next);
    setMobileNavOpen(false);
    setNotificationsOpen(false);
    if (typeof window !== "undefined") {
      const site = state.sites.find((item) => item.id === selectedSiteId) ?? state.sites[0];
      const mapId = selectedMapIds[site.id] ?? site.maps[0]?.id ?? "";
      const nextHash = routeHash(next, site.id, mapId);
      if (window.location.hash !== nextHash) window.history.pushState({ view: next }, "", nextHash);
    }
  }, [selectedMapIds, selectedSiteId, state.sites]);

  const announce = useCallback((message: string, tone: Notice["tone"] = "success") => {
    setNotice({ message, tone });
    window.setTimeout(() => setNotice((current) => current?.message === message ? null : current), 4200);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 840px), (hover: none) and (pointer: coarse) and (max-width: 1366px)");
    const sync = () => {
      setCompactNavigation(query.matches);
      if (!query.matches) setMobileNavOpen(false);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen || !compactNavigation) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const returnFocus = previousFocus ?? menuButtonRef.current;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => menuCloseRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileNavOpen(false);
        return;
      }
      if (event.key !== "Tab" || !railRef.current) return;
      const focusable = [...railRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      returnFocus?.focus();
    };
  }, [compactNavigation, mobileNavOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!notificationWrapRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside, true);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    let active = true;
    fetch("/api/state")
      .then(async (response) => {
        if (!response.ok) throw new Error("load failed");
        return (await response.json()) as { state: AppState };
      })
      .then(({ state: loadedState }) => {
        if (!active) return;
        setState(loadedState);
        const route = readRoute();
        setViewState(route.view);
        const routedSite = route.siteId && loadedState.sites.find((site) => site.id === route.siteId);
        const site = routedSite ?? loadedState.sites[0];
        setSelectedSiteId(site?.id ?? "ar002");
        if (site && route.mapId && site.maps.some((map) => map.id === route.mapId)) {
          setSelectedMapIds((current) => ({ ...current, [site.id]: route.mapId as string }));
        }
        lastSavedRef.current = JSON.stringify(loadedState);
        setSaveStatus("saved");
      })
      .catch(() => {
        if (!active) return;
        lastSavedRef.current = JSON.stringify(INITIAL_STATE);
        setSaveStatus("error");
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => { active = false; };
  }, []);

  const persist = useCallback(async (snapshot: AppState) => {
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSavedRef.current) return true;
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: snapshot }),
      });
      if (!response.ok) throw new Error("save failed");
      lastSavedRef.current = serialized;
      setSaveStatus("saved");
      return true;
    } catch {
      setSaveStatus("error");
      return false;
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const serialized = JSON.stringify(state);
    if (serialized === lastSavedRef.current) return;
    const timer = window.setTimeout(() => void persist(state), 700);
    return () => window.clearTimeout(timer);
  }, [loaded, persist, state]);

  useEffect(() => {
    const syncFromHistory = () => {
      const route = readRoute();
      setViewState(route.view);
      if (route.siteId && state.sites.some((site) => site.id === route.siteId)) {
        setSelectedSiteId(route.siteId);
        const site = state.sites.find((item) => item.id === route.siteId);
        if (site && route.mapId && site.maps.some((map) => map.id === route.mapId)) {
          setSelectedMapIds((current) => ({ ...current, [site.id]: route.mapId as string }));
        }
      }
    };
    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, [state.sites]);

  const selectedSite = state.sites.find((site) => site.id === selectedSiteId) ?? state.sites[0];
  const selectedMapId = selectedMapIds[selectedSite.id] ?? selectedSite.maps[0].id;
  const selectedMap = selectedSite.maps.find((map) => map.id === selectedMapId) ?? selectedSite.maps[0];

  useEffect(() => {
    if (!loaded || !selectedSite || !selectedMap) return;
    const nextHash = routeHash(view, selectedSite.id, selectedMap.id);
    if (window.location.hash !== nextHash) window.history.replaceState({ view }, "", nextHash);
  }, [loaded, selectedMap, selectedSite, view]);
  const mapFeatures = state.features.filter((feature) => feature.siteId === selectedSite.id && feature.mapId === selectedMap.id);
  const selectedFeature = state.features.find((feature) => feature.id === selectedFeatureId) ?? null;
  const applicationFeature = state.features.find((feature) => feature.id === applicationFeatureId) ?? null;
  const filteredMapFeatures = mapFeatures.filter((feature) => {
    if (!featureSearch.trim()) return true;
    const query = featureSearch.toLowerCase();
    return (feature.code + " " + feature.name + " " + PRESET_BY_TYPE[feature.featureType].label + " " + feature.notes).toLowerCase().includes(query);
  });

  const metrics = useMemo(() => {
    const standardSites = state.sites.filter((site) => site.condition === "standard").length;
    const recoverySites = state.sites.filter((site) => site.condition === "recovery" || site.condition === "in-progress").length;
    const openFeatures = state.features.filter((feature) => feature.status !== "standard").length;
    const openTasks = state.tasks.filter((task) => task.status !== "standard").length;
    const blocked = state.features.filter((feature) => feature.status === "blocked").length + state.tasks.filter((task) => task.status === "blocked").length;
    const readyQc = state.features.filter((feature) => feature.status === "ready-qc").length;
    const recoveryFeatures = state.features.filter((feature) => feature.cycle === "recovery" || feature.cycle === "both").length;
    const allChecks = state.sites.flatMap((site) => site.checklist);
    const completeChecks = allChecks.filter((item) => item.status === "standard").length;
    const readinessReady = state.readiness.filter((item) => item.status === "ready").length;
    return { standardSites, recoverySites, openItems: openFeatures + openTasks, blocked, readyQc, recoveryFeatures, completeChecks, totalChecks: allChecks.length, readinessReady };
  }, [state]);

  const treatmentRows = useMemo(() => {
    return state.applications.map((application) => {
      const product = state.products.find((item) => item.id === application.productId);
      const feature = state.features.find((item) => item.id === application.featureId);
      const site = state.sites.find((item) => item.id === application.siteId);
      return { application, product, feature, site, timers: applicationTimers(application, product), due: dueLabel(application, product) };
    }).sort((a, b) => b.application.appliedAt.localeCompare(a.application.appliedAt));
  }, [state.applications, state.products, state.features, state.sites]);

  const dueTreatments = treatmentRows.filter((row) => row.due.tone === "danger");

  const homeCommand = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const activeVisit = state.visits.find((visit) => !["closed", "cancelled"].includes(visit.status) && visit.checkInAt) ?? null;
    const scheduledVisits = [...state.visits]
      .filter((visit) => !["closed", "cancelled"].includes(visit.status))
      .sort((a, b) => `${a.scheduledDate}T${a.windowStart}`.localeCompare(`${b.scheduledDate}T${b.windowStart}`));
    const nextVisit = activeVisit ?? scheduledVisits.find((visit) => visit.scheduledDate >= todayKey) ?? scheduledVisits[0] ?? null;
    const fallbackNextSite = state.sites.find((site) => site.id === "ar047") ?? state.sites.find((site) => site.condition !== "standard") ?? state.sites[0];
    const nextSite = (nextVisit && state.sites.find((site) => site.id === nextVisit.siteId)) ?? fallbackNextSite;
    const currentSite = state.sites.find((site) => site.id === "ar025") ?? state.sites[0];
    const nextMap = nextSite.maps[0];
    const activeProofs = nextVisit ? state.proofs.filter((proof) => proof.visitId === nextVisit.id) : [];
    const activeTicket = nextVisit?.serviceTicketId ? state.serviceTickets.find((ticket) => ticket.id === nextVisit.serviceTicketId) : null;
    const siteFeatures = state.features.filter((feature) => feature.siteId === nextSite.id);
    const siteOpenWork = siteFeatures.filter((feature) => feature.status !== "standard").length + state.tasks.filter((task) => task.siteId === nextSite.id && task.status !== "standard").length;
    const sitePlan = state.plans.find((plan) => plan.siteId === nextSite.id);
    const planHours = sitePlan?.daySections.reduce((sum, section) => sum + section.targetHours, 0) ?? null;
    const activeCrew = state.crew.filter((member) => member.active);
    const inventoryIssues = state.inventory.filter((item) => item.status !== "ready");
    const incompleteReadiness = state.readiness.filter((item) => item.status === "missing" || item.status === "in-progress");
    const openTickets = state.serviceTickets.filter((ticket) => ticket.status !== "submitted");
    const unsubmittedPayments = state.payments.filter((payment) => payment.status !== "paid-to-grounds" && payment.status !== "disputed");
    const completedUnpaidValue = state.visits
      .filter((visit) => ["ready-qc", "closed", "completed-exceptions"].includes(visit.status))
      .reduce((sum, visit) => sum + (state.sites.find((site) => site.id === visit.siteId)?.monthlyServiceValue ?? 0), 0);
    const expectedPayment = state.payments.reduce((sum, payment) => payment.status === "paid-to-grounds" ? sum : sum + payment.amount, 0) || completedUnpaidValue;
    const payrollPressure = inventoryIssues.length > 2 || incompleteReadiness.length > 3 || openTickets.length > 2 ? "High" : inventoryIssues.length || incompleteReadiness.length || openTickets.length ? "Moderate" : "Low";
    const workability = dueTreatments.length || nextSite.condition === "blocked" ? "Review first" : "Good to go";
    const actionItems: HomeActionItem[] = [];

    if (incompleteReadiness.length) {
      const readiness = incompleteReadiness.find((item) => item.title.toLowerCase().includes("insurance")) ?? incompleteReadiness[0];
      actionItems.push({
        id: `readiness-${readiness.id}`,
        title: readiness.title === "All-location schedule" ? "Schedule sent to AMB" : `${readiness.title} needed`,
        detail: readiness.detail,
        meta: readiness.dueDate ? `Due ${formatDate(readiness.dueDate)}` : "Open contract item",
        tone: readiness.status === "missing" ? "danger" : "warning",
        icon: FileText,
        view: "command",
      });
    }

    if (nextVisit && activeProofs.length === 0) {
      actionItems.push({
        id: `proof-${nextVisit.id}`,
        title: "Completion photos missing",
        detail: `${nextSite.code} needs proof photos tied to the visit before closeout.`,
        meta: "Visit proof",
        tone: "warning",
        icon: MapPinned,
        view: "visits",
        siteId: nextSite.id,
        visitId: nextVisit.id,
      });
    }

    if (nextVisit && !activeTicket) {
      actionItems.push({
        id: `ticket-${nextVisit.id}`,
        title: "Service ticket due",
        detail: `${nextSite.code} does not have a service ticket attached yet.`,
        meta: nextVisit.scheduledDate < todayKey ? "Overdue" : "Create after visit",
        tone: nextVisit.scheduledDate < todayKey ? "danger" : "info",
        icon: ClipboardList,
        view: "visits",
        siteId: nextSite.id,
        visitId: nextVisit.id,
      });
    }

    if (inventoryIssues.length) {
      actionItems.push({
        id: "inventory-issues",
        title: "Equipment or supplies need attention",
        detail: `${inventoryIssues.length} inventory record${inventoryIssues.length === 1 ? "" : "s"} marked service, restock, or out of service.`,
        meta: "Before route",
        tone: "warning",
        icon: Package,
        view: "inventory",
      });
    }

    if (nextSite.condition === "blocked" || siteOpenWork > 0) {
      actionItems.push({
        id: `open-work-${nextSite.id}`,
        title: siteOpenWork > 0 ? `${siteOpenWork} open work item${siteOpenWork === 1 ? "" : "s"}` : "Site status needs review",
        detail: `${nextSite.code} has work that should be checked before the crew rolls.`,
        meta: "Open map",
        tone: nextSite.condition === "blocked" ? "danger" : "info",
        icon: AlertTriangle,
        view: "map",
        siteId: nextSite.id,
      });
    }

    const cycle = state.sites.map((site) => {
      const visits = state.visits.filter((visit) => visit.siteId === site.id);
      const latestVisit = [...visits].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))[0] ?? null;
      const open = state.features.filter((feature) => feature.siteId === site.id && feature.status !== "standard").length + state.tasks.filter((task) => task.siteId === site.id && task.status !== "standard").length;
      const hasBlocked = site.condition === "blocked" || state.features.some((feature) => feature.siteId === site.id && feature.status === "blocked");
      const label = hasBlocked ? "Blocked"
        : latestVisit?.status === "closed" || site.condition === "standard" ? "Done"
        : latestVisit?.scheduledDate && latestVisit.scheduledDate < todayKey ? "Behind"
        : site.id === nextSite.id ? "Due Next"
        : open > 0 ? "Return Visit"
        : "Due";
      return { site, label, open, latestVisit };
    });

    const recentActivity = [
      ...state.proofs.map((proof) => {
        const site = state.sites.find((item) => item.id === proof.siteId);
        return { id: proof.id, title: `Photo uploaded - ${site?.code ?? "site"}`, detail: proof.note || proof.kind, at: proof.capturedAt, view: "visits" as View, siteId: proof.siteId, visitId: proof.visitId };
      }),
      ...state.serviceTickets.map((ticket) => {
        const visit = state.visits.find((item) => item.id === ticket.visitId);
        const site = visit ? state.sites.find((item) => item.id === visit.siteId) : null;
        return { id: ticket.id, title: `Service ticket ${ticket.ticketNumber}`, detail: `${site?.code ?? "Visit"} · ${ticket.status}`, at: ticket.updatedAt, view: "visits" as View, siteId: visit?.siteId, visitId: visit?.id };
      }),
      ...state.payments.map((payment) => {
        return { id: payment.id, title: `Payment ${payment.invoiceNumber || "record"}`, detail: `${formatMoney(payment.amount)} · ${payment.status.replaceAll("-", " ")}`, at: payment.updatedAt, view: "finance" as View };
      }),
      ...state.inventory.filter((item) => item.status !== "ready").map((item) => ({
        id: item.id,
        title: `${item.name} marked ${item.status.replaceAll("-", " ")}`,
        detail: item.notes || `${item.quantity} ${item.unit}`,
        at: item.updatedAt,
        view: "inventory" as View,
      })),
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);

    return {
      currentSite,
      nextSite,
      nextMap,
      nextVisit,
      route: fallbackRouteSummary(currentSite.coordinates, nextSite.coordinates),
      weather: fallbackWeatherSummary(),
      workability,
      activeCrew,
      planHours,
      actionItems: actionItems.slice(0, 5),
      cycle,
      businessPulse: { completedUnpaidValue, expectedPayment, openTickets: openTickets.length, unsubmittedPayments: unsubmittedPayments.length, payrollPressure },
      recentActivity,
      inventoryIssues,
    };
  }, [dueTreatments.length, state]);

  const routeOrigin = homeCommand.currentSite.coordinates;
  const routeDestination = homeCommand.nextSite.coordinates;
  const liveRouteKey = `${routeOrigin.lat}:${routeOrigin.lng}:${routeDestination.lat}:${routeDestination.lng}`;
  const routeFallback = useMemo(() => fallbackRouteSummary(routeOrigin, routeDestination), [routeOrigin, routeDestination]);
  const weatherFallback = useMemo(() => fallbackWeatherSummary(), []);
  const [liveRouteState, setLiveRouteState] = useState<{ key: string; route: LiveRouteSummary }>(() => ({ key: liveRouteKey, route: homeCommand.route }));
  const [liveWeatherState, setLiveWeatherState] = useState<{ key: string; weather: LiveWeatherSummary }>(() => ({ key: liveRouteKey, weather: homeCommand.weather }));

  useEffect(() => {
    const controller = new AbortController();

    void fetchLiveRoute(routeOrigin, routeDestination, controller.signal)
      .then((route) => setLiveRouteState({ key: liveRouteKey, route }))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setLiveRouteState({
            key: liveRouteKey,
            route: fallbackRouteSummary(routeOrigin, routeDestination, error instanceof Error ? "Live route provider did not respond." : "Live route unavailable."),
          });
        }
      });

    void fetchLiveWeather(routeDestination, controller.signal)
      .then((weather) => setLiveWeatherState({ key: liveRouteKey, weather }))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setLiveWeatherState({
            key: liveRouteKey,
            weather: fallbackWeatherSummary(error instanceof Error ? "Live weather provider did not respond." : "Live weather unavailable."),
          });
        }
      });

    return () => controller.abort();
  }, [liveRouteKey, routeDestination, routeOrigin]);

  const liveRoute = liveRouteState.key === liveRouteKey ? liveRouteState.route : routeFallback;
  const liveWeather = liveWeatherState.key === liveRouteKey ? liveWeatherState.weather : weatherFallback;

  const commandNotifications = useMemo<CommandNotification[]>(() => {
    const items: CommandNotification[] = [];
    if (saveStatus === "error") items.push({ id: "save-error", title: "Changes are not saving", detail: "Open Settings and retry the durable save before leaving this device.", view: "settings", tone: "error" });
    const qc = state.visits.filter((visit) => visit.status === "ready-qc" || visit.status === "completed-exceptions").length;
    if (qc) items.push({ id: "qc", title: `${qc} visit${qc === 1 ? "" : "s"} waiting for QC`, detail: "Review proof, exceptions, and closeout records.", view: "visits", tone: "warning" });
    if (dueTreatments.length) items.push({ id: "treatments", title: `${dueTreatments.length} treatment follow-up${dueTreatments.length === 1 ? "" : "s"} due`, detail: "Inspect outcomes and verify label rules before any reapplication.", view: "treatments", tone: "warning" });
    const readiness = state.readiness.filter((item) => item.status === "missing" || item.status === "in-progress").length;
    if (readiness) items.push({ id: "readiness", title: `${readiness} readiness item${readiness === 1 ? "" : "s"} incomplete`, detail: "E-Verify, personnel, badges, and the all-location schedule remain visible on Home.", view: "command", tone: "warning" });
    const paid = state.payments.filter((payment) => payment.status === "government-paid").length;
    if (paid) items.push({ id: "payment", title: `${paid} payment${paid === 1 ? "" : "s"} ready for follow-up`, detail: "Government payment is recorded; confirm Grounds payment next.", view: "finance" });
    const inventory = state.inventory.filter((item) => item.status !== "ready").length;
    if (inventory) items.push({ id: "inventory", title: `${inventory} inventory record${inventory === 1 ? "" : "s"} need attention`, detail: "Service, restock, or out-of-service status is active.", view: "inventory", tone: "warning" });
    return items;
  }, [dueTreatments.length, saveStatus, state.inventory, state.payments, state.readiness, state.visits]);

  const allWork = useMemo(() => {
    const features = state.features.map((feature) => ({
      id: feature.id,
      source: "feature" as const,
      siteId: feature.siteId,
      title: featureLabel(feature),
      type: PRESET_BY_TYPE[feature.featureType].label,
      status: feature.status,
      priority: feature.priority,
      equipment: feature.equipment[0] || "",
      notes: feature.notes,
      updatedAt: feature.updatedAt,
    }));
    const tasks = state.tasks.map((task) => ({
      id: task.id,
      source: "task" as const,
      siteId: task.siteId,
      title: task.title,
      type: "Quick task",
      status: task.status,
      priority: task.priority,
      equipment: task.equipment,
      notes: task.notes,
      updatedAt: task.updatedAt,
    }));
    const rank: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    return [...features, ...tasks]
      .filter((item) => siteFilter === "all" || item.siteId === siteFilter)
      .filter((item) => {
        if (workFilter === "all") return true;
        if (workFilter === "open") return item.status !== "standard";
        return item.status === workFilter;
      })
      .sort((a, b) => rank[a.priority] - rank[b.priority] || b.updatedAt.localeCompare(a.updatedAt));
  }, [state.features, state.tasks, siteFilter, workFilter]);

  function mutate(mutator: (current: AppState) => AppState, recordHistory = true) {
    setState((current) => {
      if (recordHistory) {
        undoRef.current = [...undoRef.current.slice(-39), current];
        redoRef.current = [];
        setHistoryState({ undo: undoRef.current.length, redo: 0 });
      }
      return { ...mutator(current), updatedAt: new Date().toISOString() };
    });
  }

  function undo() {
    const previous = undoRef.current.at(-1);
    if (!previous) return;
    setState((current) => {
      redoRef.current = [...redoRef.current.slice(-39), current];
      undoRef.current = undoRef.current.slice(0, -1);
      setHistoryState({ undo: undoRef.current.length, redo: redoRef.current.length });
      return previous;
    });
  }

  function redo() {
    const next = redoRef.current.at(-1);
    if (!next) return;
    setState((current) => {
      undoRef.current = [...undoRef.current.slice(-39), current];
      redoRef.current = redoRef.current.slice(0, -1);
      setHistoryState({ undo: undoRef.current.length, redo: redoRef.current.length });
      return next;
    });
  }

  function updateSite(siteId: string, patch: Partial<Site>, recordHistory = true) {
    mutate((current) => ({ ...current, sites: current.sites.map((site) => site.id === siteId ? { ...site, ...patch } : site) }), recordHistory);
  }

  function updateChecklist(siteId: string, checkId: string, status: WorkStatus) {
    mutate((current) => ({
      ...current,
      sites: current.sites.map((site) => site.id === siteId
        ? { ...site, checklist: site.checklist.map((check) => check.id === checkId ? { ...check, status } : check) }
        : site),
    }));
  }

  function updateFeature(featureId: string, patch: Partial<MapFeature>, recordHistory = true) {
    const now = new Date().toISOString();
    mutate((current) => ({
      ...current,
      features: current.features.map((feature) => feature.id === featureId ? { ...feature, ...patch, updatedAt: now } : feature),
    }), recordHistory);
  }

  function updateServicePart(featureId: string, partId: string, patch: Partial<ServicePart>) {
    const feature = state.features.find((item) => item.id === featureId);
    if (!feature) return;
    const parts = feature.serviceParts.map((part) => part.id === partId ? { ...part, ...patch } : part);
    let status = feature.status;
    if (patch.status) {
      if (parts.some((part) => part.status === "blocked")) status = "blocked";
      else if (parts.every((part) => part.status === "standard")) status = "ready-qc";
      else if (parts.some((part) => part.status === "in-progress" || part.status === "standard")) status = "in-progress";
      else if (parts.some((part) => part.status === "recovery")) status = "recovery";
    }
    updateFeature(featureId, { serviceParts: parts, status });
  }

  function addServicePart(featureId: string) {
    const feature = state.features.find((item) => item.id === featureId);
    if (!feature) return;
    const part: ServicePart = { id: makeId("part"), label: "Custom service part", action: "Define the exact required work.", status: "unassessed", equipment: "No equipment", method: "" };
    updateFeature(featureId, { serviceParts: [...feature.serviceParts, part] });
  }

  function deleteFeature(featureId: string) {
    if (!window.confirm("Delete this mapped feature and its attached service parts?")) return;
    mutate((current) => ({
      ...current,
      features: current.features.filter((feature) => feature.id !== featureId),
      applications: current.applications.filter((application) => application.featureId !== featureId),
    }));
    setSelectedFeatureId(null);
  }

  function updateTask(taskId: string, patch: Partial<ManualTask>) {
    mutate((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === taskId ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task) }));
  }

  function deleteTask(taskId: string) {
    mutate((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== taskId) }));
  }

  function addTask(task: Omit<ManualTask, "id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    mutate((current) => ({ ...current, tasks: [...current.tasks, { ...task, id: makeId("task"), createdAt: now, updatedAt: now }] }));
  }

  function changeProfileMode(mode: "owner" | "field") {
    setProfileMode(mode);
    setMobileNavOpen(false);
    window.localStorage.setItem("grounds-command.profile-mode", mode);
    announce(mode === "field" ? "Field navigation is active. Your current page was kept open." : "Owner navigation is active.");
  }

  function changeDefaultView(next: View) {
    setDefaultView(next);
    window.localStorage.setItem("grounds-command.default-view", next);
    announce(`${NAV_ITEMS.find((item) => item.key === next)?.label ?? "Home"} will open first on this device.`);
  }

  async function saveNow() {
    const saved = await persist(state);
    announce(saved ? "All current changes are saved." : "Grounds Command could not save. Check the connection and retry.", saved ? "success" : "error");
  }

  function chooseSite(site: Site, targetView: View = "map") {
    setSelectedSiteId(site.id);
    setSelectedFeatureId(null);
    setDraftGeometry(null);
    setActivePreset(null);
    setZoom(1);
    setView(targetView);
  }

  function openVisit(visitId: string) {
    setSelectedVisitId(visitId);
    setView("visits");
  }

  function openOperationsMap(siteId: string, featureId?: string | null) {
    const site = state.sites.find((item) => item.id === siteId);
    if (!site) return;
    chooseSite(site, featureId ? "features" : "map");
    if (featureId) setSelectedFeatureId(featureId);
  }

  function openHomeAction(item: HomeActionItem) {
    if (item.siteId) {
      const site = state.sites.find((row) => row.id === item.siteId);
      if (site && (item.view === "map" || item.view === "features")) {
        chooseSite(site, item.view);
      } else if (site) {
        setSelectedSiteId(site.id);
        setView(item.view);
      } else {
        setView(item.view);
      }
    } else {
      setView(item.view);
    }
    if (item.visitId) setSelectedVisitId(item.visitId);
  }

  function openRoute() {
    const destination = homeCommand.nextSite.address || `${homeCommand.nextSite.city}, Arkansas`;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, "_blank", "noopener,noreferrer");
  }

  function printTicket(visitId: string) {
    setPrintVisitId(visitId);
    setPrintTarget("ticket");
    window.setTimeout(() => window.print(), 80);
  }

  function choosePreset(preset: FeaturePreset) {
    setActivePreset(preset);
    setDraftGeometry(null);
    setSelectedFeatureId(null);
    setMobilePaletteOpen(false);
    if (preset.type === "weed-control-zone") setLayerMode("treatments");
  }

  function pointFromEvent(event: ReactPointerEvent<SVGSVGElement>): Point | null {
    const svg = mapSvgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * MAP_WIDTH, 0, MAP_WIDTH),
      y: clamp(((event.clientY - rect.top) / rect.height) * MAP_HEIGHT, 0, MAP_HEIGHT),
    };
  }

  function createFeature(preset: FeaturePreset, geometry: Geometry) {
    const now = new Date().toISOString();
    const sequence = state.features.filter((feature) => feature.siteId === selectedSite.id && feature.mapId === selectedMap.id && feature.featureType === preset.type).length + 1;
    const feature = featureDefaults(preset, makeId("feature"), selectedSite.id, selectedMap.id, geometry, sequence, now);
    mutate((current) => ({ ...current, features: [...current.features, feature] }));
    setSelectedFeatureId(feature.id);
    setInspectorTab("details");
    setDraftGeometry(null);
    if (!(preset.geometry === "point" && stampMode)) setActivePreset(null);
  }

  function handleMapPointer(event: ReactPointerEvent<SVGSVGElement>) {
    if (!activePreset) {
      setSelectedFeatureId(null);
      return;
    }
    event.preventDefault();
    const point = pointFromEvent(event);
    if (!point) return;
    if (activePreset.geometry === "point") {
      createFeature(activePreset, { kind: "point", points: [point] });
      return;
    }
    setDraftGeometry((current) => current && current.kind === activePreset.geometry
      ? { ...current, points: [...current.points, point] }
      : { kind: activePreset.geometry, points: [point] });
  }

  function finishDraft() {
    if (!activePreset || !draftGeometry) return;
    const minimum = draftGeometry.kind === "line" ? 2 : 3;
    if (draftGeometry.points.length < minimum) return;
    createFeature(activePreset, draftGeometry);
  }

  function cancelCapture() {
    setActivePreset(null);
    setDraftGeometry(null);
  }

  function saveProduct(product: PesticideProduct) {
    mutate((current) => ({
      ...current,
      products: current.products.some((item) => item.id === product.id)
        ? current.products.map((item) => item.id === product.id ? product : item)
        : [...current.products, product],
    }));
    setProductModal(null);
  }

  function deleteProduct(productId: string) {
    if (state.applications.some((application) => application.productId === productId)) {
      window.alert("This product is attached to an application record and cannot be deleted.");
      return;
    }
    if (!window.confirm("Delete this pesticide product from the library?")) return;
    mutate((current) => ({ ...current, products: current.products.filter((product) => product.id !== productId) }));
  }

  function saveApplication(application: PesticideApplication) {
    mutate((current) => ({
      ...current,
      applications: [...current.applications, application],
      features: current.features.map((feature) => feature.id === application.featureId ? { ...feature, status: "in-progress", updatedAt: new Date().toISOString() } : feature),
    }));
    setApplicationFeatureId(null);
  }

  function updateApplication(applicationId: string, patch: Partial<PesticideApplication>) {
    mutate((current) => ({
      ...current,
      applications: current.applications.map((application) => application.id === applicationId ? { ...application, ...patch } : application),
    }));
  }

  const printFeatures = printMode === "visible"
    ? filteredMapFeatures
    : printMode === "recovery"
      ? mapFeatures.filter((feature) => feature.cycle !== "recurring" || feature.status === "recovery" || feature.status === "blocked")
      : printMode === "recurring"
        ? mapFeatures.filter((feature) => feature.cycle !== "recovery" && !feature.temporary)
        : printMode === "treatments"
          ? mapFeatures.filter((feature) => feature.featureType === "weed-control-zone" || feature.chemicalPolicy !== "prohibited")
          : mapFeatures;

  const printLayerMode: LayerMode = printMode === "equipment" ? "equipment" : printMode === "treatments" ? "treatments" : printMode === "visible" ? layerMode : "work";

  const saveLabel = saveStatus === "loading" ? "Loading" : saveStatus === "saving" ? "Saving" : saveStatus === "saved" ? "Saved" : "Retry save";
  const currentDate = todayLabel;
  const liveRouteDistance = formatDistance(liveRoute.distanceMiles);
  const liveRouteDuration = formatDuration(liveRoute.durationMinutes);
  const liveRouteEta = etaFromDuration(liveRoute.durationMinutes);
  const liveWeatherTemp = weatherTemp(liveWeather.tempF);
  const liveWeatherDetail = liveWeather.precipitationChance === null
    ? liveWeather.condition
    : `${liveWeather.condition} · ${liveWeather.precipitationChance}% rain`;
  const selectedFeatureApplications = selectedFeature ? treatmentRows.filter((row) => row.application.featureId === selectedFeature.id) : [];
  const fieldMode = profileMode === "field";
  const visibleNav = fieldMode ? NAV_ITEMS.filter((item) => item.fieldVisible) : NAV_ITEMS;
  const viewTitle: Record<View, string> = {
    command: "Home",
    visits: "Daily operations",
    schedule: "Schedule",
    crew: "Crew readiness",
    map: "Work plan",
    features: "Advanced site features",
    work: "Recovery work",
    inventory: "Inventory",
    treatments: "Chemical control",
    reports: "Reports",
    finance: "Payment pipeline",
    settings: "Settings",
  };

  return (
    <div className={cx("gc-shell", fieldMode && "gc-field-mode")}>
      <button className={cx("gc-nav-scrim", mobileNavOpen && "open")} type="button" aria-label="Close menu" aria-hidden={!mobileNavOpen} tabIndex={mobileNavOpen ? 0 : -1} onClick={() => setMobileNavOpen(false)} />
      <aside ref={railRef} id="gc-primary-menu" className={cx("gc-rail", mobileNavOpen && "mobile-open")} aria-label="Main menu" aria-hidden={compactNavigation && !mobileNavOpen} inert={compactNavigation && !mobileNavOpen ? true : undefined}>
        <header className="gc-rail-head">
          <button className="gc-rail-brand" type="button" onClick={() => { setView("command"); setMobileNavOpen(false); }} aria-label="Grounds Command home">
            <img src="/brand/grounds-mark.jpg" alt="" />
            <span><strong>Grounds</strong><small>Command</small></span>
          </button>
          <button ref={menuCloseRef} className="gc-rail-close" type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </header>
        <div className="gc-mobile-profile">
          <div className="gc-avatar">DP</div>
          <span><strong>{ownerName}</strong><small>{fieldMode ? "Field view" : "Owner view"}</small></span>
        </div>
        <nav aria-label="Primary navigation">
          {visibleNav.map(({ key, label, icon: Icon }) => (
            <button type="button" key={key} className={view === key ? "active" : ""} onClick={() => { setView(key); setMobileNavOpen(false); }}>
              <Icon size={17} strokeWidth={2} /><small>{label}</small>
              {key === "work" && metrics.openItems > 0 && <b>{metrics.openItems}</b>}
              {key === "treatments" && dueTreatments.length > 0 && <b>{dueTreatments.length}</b>}
            </button>
          ))}
        </nav>
        <div className="gc-rail-bottom">
          <div className="gc-profile-card">
            <div className="gc-avatar">DP</div>
            <span><strong>{ownerName}</strong><small>{fieldMode ? "Field view" : "Owner view"}</small></span>
          </div>
          <div className="gc-mode-toggle" aria-label="Workspace mode">
            <button type="button" className={!fieldMode ? "active" : ""} onClick={() => changeProfileMode("owner")}><ShieldCheck size={14} />Owner</button>
            <button type="button" className={fieldMode ? "active" : ""} onClick={() => changeProfileMode("field")}><HardHat size={14} />Field</button>
          </div>
        </div>
      </aside>

      <div className="gc-main">
        <header className="gc-topbar">
          <button ref={menuButtonRef} className="gc-menu-button" type="button" onClick={() => { setNotificationsOpen(false); setMobileNavOpen((current) => !current); }} aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"} aria-controls="gc-primary-menu" aria-expanded={mobileNavOpen}><Menu size={22} /></button>
          <div className="gc-topbar-title">
            <p className="gc-eyebrow">{(view === "map" || view === "features") ? selectedSite.code + " · " + selectedMap.label : "Grounds Maintenance LLC"}</p>
            <h1>{viewTitle[view]}</h1>
          </div>
          <div className="gc-topbar-actions">
            {(view === "map" || view === "features") && (
              <label className="gc-top-site-select">
                <select aria-label="Current site" value={selectedSite.id} onChange={(event) => chooseSite(state.sites.find((site) => site.id === event.target.value) ?? selectedSite, view)}>
                  {state.sites.map((site) => <option value={site.id} key={site.id}>{site.code} · {site.city}</option>)}
                </select>
              </label>
            )}
            <button className="gc-top-icon" type="button" aria-label="Open appearance settings" title="Appearance settings" onClick={() => setView("settings")}><Moon size={17} /></button>
            <div className="gc-notification-wrap" ref={notificationWrapRef}>
              <button className="gc-top-icon" type="button" aria-label={`Notifications, ${commandNotifications.length} active`} aria-expanded={notificationsOpen} aria-controls="gc-action-center" onClick={() => { setMobileNavOpen(false); setNotificationsOpen((current) => !current); }}><Bell size={17} />{commandNotifications.length > 0 && <i />}</button>
              {notificationsOpen && <aside id="gc-action-center" className="gc-notification-panel"><header><div><p className="gc-eyebrow">Action center</p><h2>{commandNotifications.length ? `${commandNotifications.length} active` : "All clear"}</h2></div><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={16} /></button></header>{commandNotifications.length ? commandNotifications.map((item) => <button type="button" key={item.id} className={item.tone ?? ""} onClick={() => setView(item.view)}><span><strong>{item.title}</strong><small>{item.detail}</small></span><b>→</b></button>) : <p>No saved records need attention right now.</p>}</aside>}
            </div>
            <button className={cx("gc-save-state", saveStatus)} type="button" onClick={() => void saveNow()} disabled={saveStatus === "loading" || saveStatus === "saving"}><Save size={15} /><span />{saveLabel}</button>
          </div>
        </header>

        {view === "command" && (
          <main className="gc-command gc-home-command">
            <section className="gc-home-mission">
              <div className="gc-mission-main">
                <header>
                  <div>
                    <p className="gc-eyebrow">Today&apos;s mission</p>
                    <h2>{homeCommand.currentSite.city} <ArrowRight size={24} /> {homeCommand.nextSite.city}</h2>
                  </div>
                  <span className={cx("gc-workability", homeCommand.workability !== "Good to go" && "review")}>{homeCommand.workability}</span>
                </header>
                <div className="gc-mission-stats">
                  <article><MapPin size={18} /><span>Current</span><strong>{homeCommand.currentSite.city}, AR</strong><small>{currentDate}</small></article>
                  <article><Navigation size={18} /><span>Next stop</span><strong>{homeCommand.nextSite.code} · {homeCommand.nextSite.city}</strong><small>{liveRouteDistance} · {liveRouteDuration}</small></article>
                  <article><CloudRain size={18} /><span>Destination weather</span><strong>{liveWeatherTemp}</strong><small>{liveWeatherDetail}</small></article>
                  <article><Car size={18} /><span>Route source</span><strong>{liveRoute.provider}</strong><small>{providerTime(liveRoute.updatedAt)}</small></article>
                  <article><CalendarDays size={18} /><span>Rolling ETA</span><strong>{liveRouteEta}</strong><small>{homeCommand.nextVisit ? `${homeCommand.nextVisit.windowStart}-${homeCommand.nextVisit.windowEnd}` : "No visit scheduled"}</small></article>
                </div>
                <div className="gc-route-card">
                  <HomeRouteMap origin={homeCommand.currentSite} destination={homeCommand.nextSite} route={liveRoute} />
                  <div className="gc-mission-actions">
                    <button className="gc-button secondary" type="button" onClick={openRoute}><Navigation size={16} /> Start Route</button>
                    <button className="gc-button primary" type="button" onClick={() => homeCommand.nextVisit ? openVisit(homeCommand.nextVisit.id) : setView("schedule")}><SquareCheckBig size={16} /> {homeCommand.nextVisit ? "Start Visit" : "Schedule Visit"}</button>
                    <button className="gc-button light" type="button" onClick={() => chooseSite(homeCommand.nextSite)}><MapPinned size={16} /> Open Site Map</button>
                  </div>
                </div>
              </div>
              <aside className="gc-next-stop-card">
                <header><p className="gc-eyebrow">Next stop</p><h3>{homeCommand.nextSite.code} · {homeCommand.nextSite.name}</h3></header>
                <div className="gc-next-address">{homeCommand.nextSite.address}</div>
                <dl>
                  <div><dt><Phone size={14} /> Site contact</dt><dd>AMB / site POC</dd></div>
                  <div><dt><Lock size={14} /> Access status</dt><dd>Masked / secure</dd></div>
                  <div><dt><Users size={14} /> Assigned crew</dt><dd>{homeCommand.activeCrew.length || 1} active</dd></div>
                  <div><dt><CalendarDays size={14} /> Expected duration</dt><dd>{homeCommand.planHours ? `${homeCommand.planHours.toFixed(0)} crew hrs` : "2.5-3.0 hrs"}</dd></div>
                  <div><dt><CloudRain size={14} /> Weather risk</dt><dd>{liveWeather.risk}</dd></div>
                </dl>
              </aside>
            </section>

            <section className="gc-home-grid">
              <article className="gc-card gc-action-required">
                <header className="gc-home-section-head">
                  <div><p className="gc-eyebrow">Action required</p><h2>{homeCommand.actionItems.length ? `${homeCommand.actionItems.length} item${homeCommand.actionItems.length === 1 ? "" : "s"} need attention` : "Nothing blocking today"}</h2></div>
                  <span>{homeCommand.actionItems.length}</span>
                </header>
                <div className="gc-action-list">
                  {homeCommand.actionItems.length ? homeCommand.actionItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button type="button" key={item.id} className={item.tone} onClick={() => openHomeAction(item)}>
                        <i><Icon size={17} /></i>
                        <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                        <em>{item.meta}</em>
                      </button>
                    );
                  }) : <div className="gc-empty compact"><strong>Clear for now.</strong><p>Contract deliverables, proof, tickets, equipment, and blocked work will show here when they need action.</p></div>}
                </div>
              </article>

              <article className="gc-card gc-current-cycle">
                <header className="gc-home-section-head">
                  <div><p className="gc-eyebrow">Current cycle</p><h2>{state.sites.length} locations</h2></div>
                  <button type="button" onClick={() => setView("schedule")}>Schedule</button>
                </header>
                <div className="gc-cycle-list">
                  {homeCommand.cycle.map(({ site, label, open }) => (
                    <button type="button" key={site.id} onClick={() => chooseSite(site)}>
                      <span className="gc-site-code small">{site.code}</span>
                      <strong>{site.city}</strong>
                      <small>{open ? `${open} open` : "No open work"}</small>
                      <em className={label.toLowerCase().replaceAll(" ", "-")}>{label}</em>
                    </button>
                  ))}
                </div>
              </article>

              {!fieldMode && (
                <article className="gc-card gc-business-pulse">
                  <header className="gc-home-section-head">
                    <div><p className="gc-eyebrow">Business pulse</p><h2>Owner view</h2></div>
                    <Lock size={15} />
                  </header>
                  <div className="gc-pulse-grid">
                    <div><span>Unbilled / unpaid</span><strong>{formatMoney(homeCommand.businessPulse.completedUnpaidValue)}</strong><small>Completed work value</small></div>
                    <div><span>Expected payment</span><strong>{formatMoney(homeCommand.businessPulse.expectedPayment)}</strong><small>{homeCommand.businessPulse.unsubmittedPayments} open records</small></div>
                    <div><span>Packet pressure</span><strong>{homeCommand.businessPulse.openTickets}</strong><small>Tickets not submitted</small></div>
                    <div><span>Finance source</span><strong>Internal ledger</strong><small>{INTEGRATION_STACK.finance.upgradePath}</small></div>
                  </div>
                  <button type="button" className="gc-pulse-link" onClick={() => setView("finance")}>Open payment pipeline <ArrowRight size={14} /></button>
                </article>
              )}

              <article className="gc-card gc-recent-activity">
                <header className="gc-home-section-head">
                  <div><p className="gc-eyebrow">Recent activity</p><h2>Latest useful changes</h2></div>
                  <button type="button" onClick={() => setView("reports")}>Reports</button>
                </header>
                <div className="gc-activity-list">
                  {homeCommand.recentActivity.length ? homeCommand.recentActivity.map((item) => (
                    <button type="button" key={item.id} onClick={() => { if (item.visitId) setSelectedVisitId(item.visitId); if (item.siteId) setSelectedSiteId(item.siteId); setView(item.view); }}>
                      <Timer size={15} />
                      <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                      <em>{formatDate(item.at, true)}</em>
                    </button>
                  )) : <div className="gc-empty compact"><strong>No activity recorded yet.</strong><p>Photos, service tickets, payments, inventory changes, and closeouts will appear here.</p></div>}
                </div>
              </article>
            </section>
          </main>
        )}

        {(view === "visits" || view === "schedule" || view === "crew" || view === "finance") && (
          <OperationsV3
            mode={view}
            state={state}
            ownerName={ownerName}
            selectedVisitId={selectedVisitId}
            onSelectVisit={(id) => { setSelectedVisitId(id); if (id && view !== "visits") setView("visits"); }}
            onMutate={(change) => mutate(change, false)}
            onOpenMap={openOperationsMap}
            onOpenFinance={() => setView("finance")}
            onPrintTicket={printTicket}
          />
        )}

        {view === "map" && (
          <PlanningWorkspace
            key={`${selectedSite.id}-${selectedMap.id}`}
            state={state}
            site={selectedSite}
            map={selectedMap}
            ownerName={ownerName}
            fieldMode={fieldMode}
            onMutate={(change) => mutate(change, false)}
            onOpenFeatures={() => setView("features")}
            onOpenWork={() => setView("work")}
          />
        )}

        {view === "features" && (
          <main className="gc-map-view">
            <section className="gc-map-meta">
              <div className="gc-map-title">
                <div><span className="gc-site-code large">{selectedSite.code}</span></div>
                <div><h2>{selectedSite.name}</h2><p>{selectedSite.address}</p></div>
              </div>
              {selectedSite.maps.length > 1 && (
                <div className="gc-map-tabs">{selectedSite.maps.map((map) => <button type="button" key={map.id} className={map.id === selectedMap.id ? "active" : ""} onClick={() => { setSelectedMapIds((current) => ({ ...current, [selectedSite.id]: map.id })); setSelectedFeatureId(null); setDraftGeometry(null); setZoom(1); }}>{map.label}</button>)}</div>
              )}
              <div className="gc-map-meta-actions">
                <StatusSelect value={selectedSite.condition} onChange={(condition) => updateSite(selectedSite.id, { condition })} label="Location condition" />
                <button className="gc-button print" type="button" onClick={() => setPrintModal(true)}>Print / PDF</button>
              </div>
            </section>

            <section className="gc-layer-bar">
              <div className="gc-layer-modes">
                {Object.entries(LAYER_META).map(([key, meta]) => (
                  <button type="button" key={key} className={layerMode === key ? "active" : ""} onClick={() => setLayerMode(key as LayerMode)}>
                    <span>{meta.label}</span><small>{meta.description}</small>
                  </button>
                ))}
              </div>
              <div className="gc-map-utilities">
                <button type="button" onClick={undo} disabled={historyState.undo === 0} title="Undo">↶</button>
                <button type="button" onClick={redo} disabled={historyState.redo === 0} title="Redo">↷</button>
                <span />
                <button type="button" onClick={() => setZoom((value) => clamp(value - 0.25, 1, 4))}>−</button>
                <b>{Math.round(zoom * 100)}%</b>
                <button type="button" onClick={() => setZoom((value) => clamp(value + 0.25, 1, 4))}>+</button>
                <button type="button" onClick={() => setZoom(1)}>Fit</button>
              </div>
            </section>

            <div className="gc-map-workspace">
              <FeatureLibrary
                activePreset={activePreset}
                onChoose={choosePreset}
                search={presetSearch}
                onSearch={setPresetSearch}
                onClose={() => setMobilePaletteOpen(false)}
                className={mobilePaletteOpen ? "mobile-open" : ""}
              />

              <section className="gc-map-stage">
                {activePreset && (
                  <div className="gc-capture-banner" style={{ "--preset": activePreset.color } as CSSProperties}>
                    <span className="gc-capture-code">{activePreset.shortLabel}</span>
                    <div>
                      <strong>{activePreset.geometry === "point" ? "Tap each " + activePreset.label.toLowerCase() + " on the map." : activePreset.geometry === "line" ? "Tap along the full " + activePreset.label.toLowerCase() + "." : "Tap around the outside edge of the " + activePreset.label.toLowerCase() + "."}</strong>
                      <small>{activePreset.description}{draftGeometry ? " · " + draftGeometry.points.length + " points placed" : ""}</small>
                    </div>
                    {activePreset.geometry === "point" && <label className="gc-stamp-toggle"><input type="checkbox" checked={stampMode} onChange={(event) => setStampMode(event.target.checked)} /><span>Keep stamping</span></label>}
                    {draftGeometry && (
                      <div className="gc-draw-actions">
                        <button type="button" onClick={() => setDraftGeometry((current) => current ? { ...current, points: current.points.slice(0, -1) } : current)}>Undo point</button>
                        <button type="button" className="finish" onClick={finishDraft} disabled={draftGeometry.points.length < (draftGeometry.kind === "line" ? 2 : 3)}>Finish shape</button>
                      </div>
                    )}
                    <button type="button" className="gc-cancel-capture" onClick={cancelCapture}>×</button>
                  </div>
                )}

                <div className={cx("gc-map-scroll", activePreset && "capturing")}>
                  <svg
                    ref={mapSvgRef}
                    className="gc-site-map"
                    viewBox={"0 0 " + MAP_WIDTH + " " + MAP_HEIGHT}
                    style={{ width: zoom * 100 + "%" }}
                    onPointerDown={handleMapPointer}
                    aria-label={selectedSite.code + " " + selectedMap.label + " advanced annotated map"}
                  >
                    <image href={selectedMap.imageUrl} width={MAP_WIDTH} height={MAP_HEIGHT} preserveAspectRatio="none" />
                    <FeatureShapes features={filteredMapFeatures} layerMode={layerMode} selectedId={selectedFeatureId} onSelect={(feature) => { setSelectedFeatureId(feature.id); setInspectorTab("details"); setActivePreset(null); setDraftGeometry(null); }} />
                    {draftGeometry && (
                      <g className="gc-draft-shape">
                        {draftGeometry.kind === "line" ? (
                          <polyline points={draftGeometry.points.map((point) => point.x + "," + point.y).join(" ")} fill="none" stroke={activePreset?.color || "#173f2a"} strokeWidth="8" strokeDasharray="15 10" vectorEffect="non-scaling-stroke" />
                        ) : (
                          <polygon points={draftGeometry.points.map((point) => point.x + "," + point.y).join(" ")} fill={activePreset?.color || "#5a8f63"} fillOpacity="0.23" stroke={activePreset?.color || "#173f2a"} strokeWidth="6" strokeDasharray="15 10" vectorEffect="non-scaling-stroke" />
                        )}
                        {draftGeometry.points.map((point, index) => <circle key={point.x + "-" + point.y + "-" + index} cx={point.x} cy={point.y} r="8" fill="#ffffff" stroke={activePreset?.color || "#173f2a"} strokeWidth="4" />)}
                      </g>
                    )}
                  </svg>
                </div>

                <div className="gc-map-footer">
                  <span>Government site plan + field-verified Grounds overlay</span>
                  <div><button type="button" className="gc-mobile-add" onClick={() => setMobilePaletteOpen((value) => !value)}>+ Add feature</button><span>{mapFeatures.length} features · {mapFeatures.filter((feature) => feature.status !== "standard").length} open</span></div>
                </div>
              </section>

              <aside className={cx("gc-inspector", selectedFeature && "has-selection")}>
                {selectedFeature && selectedFeature.siteId === selectedSite.id && selectedFeature.mapId === selectedMap.id ? (
                  <>
                    <header className="gc-inspector-header">
                      <div className="gc-feature-badge" style={{ "--preset": PRESET_BY_TYPE[selectedFeature.featureType].color } as CSSProperties}>{PRESET_BY_TYPE[selectedFeature.featureType].shortLabel}</div>
                      <div><p>{PRESET_BY_TYPE[selectedFeature.featureType].label}</p><h2>{selectedFeature.code}</h2></div>
                      <button type="button" onClick={() => setSelectedFeatureId(null)} aria-label="Close inspector">×</button>
                    </header>
                    <div className="gc-inspector-tabs">
                      {(["details", "work", "treatment"] as InspectorTab[]).map((tab) => <button type="button" key={tab} className={inspectorTab === tab ? "active" : ""} onClick={() => setInspectorTab(tab)}>{tab === "details" ? "Feature" : tab === "work" ? "Exact work" : "Pesticides"}{tab === "work" && <span>{selectedFeature.serviceParts.filter((part) => part.status !== "standard").length}</span>}{tab === "treatment" && selectedFeatureApplications.length > 0 && <span>{selectedFeatureApplications.length}</span>}</button>)}
                    </div>
                    <div className="gc-inspector-scroll">
                      {inspectorTab === "details" && (
                        <div className="gc-inspector-section">
                          <label className="gc-inspector-name"><span>Feature name</span><input value={selectedFeature.name} onChange={(event) => updateFeature(selectedFeature.id, { name: event.target.value }, false)} /></label>
                          <div className="gc-form-grid two tight">
                            <label><span>Current status</span><select value={selectedFeature.status} onChange={(event) => updateFeature(selectedFeature.id, { status: event.target.value as WorkStatus })}>{STATUS_OPTIONS.map((status) => <option value={status} key={status}>{STATUS_META[status].label}</option>)}</select></label>
                            <label><span>Priority</span><select value={selectedFeature.priority} onChange={(event) => updateFeature(selectedFeature.id, { priority: event.target.value as Priority })}>{Object.entries(PRIORITY_META).map(([key, meta]) => <option value={key} key={key}>{meta.label}</option>)}</select></label>
                            <label><span>Work cycle</span><select value={selectedFeature.cycle} onChange={(event) => updateFeature(selectedFeature.id, { cycle: event.target.value as WorkCycle })}><option value="recovery">Recovery</option><option value="recurring">Recurring</option><option value="both">Recovery → recurring</option></select></label>
                            <label><span>Measurement / count</span><input value={selectedFeature.measurement} onChange={(event) => updateFeature(selectedFeature.id, { measurement: event.target.value }, false)} placeholder="380 ft, 18 vehicles..." /></label>
                          </div>
                          <label className="gc-full-field"><span>Frequency / after-clear plan</span><input value={selectedFeature.frequency} onChange={(event) => updateFeature(selectedFeature.id, { frequency: event.target.value }, false)} /></label>
                          <label className="gc-full-field"><span>Restrictions / safety</span><textarea rows={3} value={selectedFeature.restrictions} onChange={(event) => updateFeature(selectedFeature.id, { restrictions: event.target.value }, false)} placeholder="Dry only, hand tools around wire, gate width..." /></label>
                          <label className="gc-full-field"><span>Field notes</span><textarea rows={4} value={selectedFeature.notes} onChange={(event) => updateFeature(selectedFeature.id, { notes: event.target.value }, false)} placeholder="Condition, access, exact next step..." /></label>
                          <div className="gc-field-block">
                            <div className="gc-field-label"><span>Approved equipment / methods</span><small>Select everything that may be needed</small></div>
                            <div className="gc-equipment-chips">
                              {EQUIPMENT_OPTIONS.map((equipment) => {
                                const checked = selectedFeature.equipment.includes(equipment);
                                return <label className={checked ? "active" : ""} key={equipment}><input type="checkbox" checked={checked} onChange={() => updateFeature(selectedFeature.id, { equipment: checked ? selectedFeature.equipment.filter((item) => item !== equipment) : [...selectedFeature.equipment, equipment] })} /><span style={{ "--equipment": EQUIPMENT_COLORS[equipment] || "#64726c" } as CSSProperties} />{equipment}</label>;
                              })}
                            </div>
                          </div>
                          <div className="gc-pws-links"><span>PWS links</span>{selectedFeature.pwsClauses.map((clause) => <b key={clause}>{clause}</b>)}</div>
                          <button className="gc-delete-button" type="button" onClick={() => deleteFeature(selectedFeature.id)}>Delete mapped feature</button>
                        </div>
                      )}

                      {inspectorTab === "work" && (
                        <div className="gc-inspector-section">
                          <div className="gc-service-summary">
                            <div><span>Exact serviceable parts</span><strong>{selectedFeature.serviceParts.length}</strong></div>
                            <div><span>At standard</span><strong>{selectedFeature.serviceParts.filter((part) => part.status === "standard").length}</strong></div>
                            <div><span>Open</span><strong>{selectedFeature.serviceParts.filter((part) => part.status !== "standard").length}</strong></div>
                          </div>
                          <p className="gc-explainer">Complete each physical part separately. The whole feature only moves to Ready for QC after every part reaches standard.</p>
                          <div className="gc-service-parts">
                            {selectedFeature.serviceParts.map((part, index) => (
                              <article key={part.id}>
                                <header><span>{String(index + 1).padStart(2, "0")}</span><input value={part.label} onChange={(event) => updateServicePart(selectedFeature.id, part.id, { label: event.target.value })} /><StatusSelect compact value={part.status} onChange={(status) => updateServicePart(selectedFeature.id, part.id, { status })} label={part.label + " status"} /></header>
                                <label><span>Required action</span><textarea rows={2} value={part.action} onChange={(event) => updateServicePart(selectedFeature.id, part.id, { action: event.target.value })} /></label>
                                <div className="gc-form-grid two tight"><label><span>Equipment</span><select value={part.equipment} onChange={(event) => updateServicePart(selectedFeature.id, part.id, { equipment: event.target.value })}>{EQUIPMENT_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Method / restriction</span><input value={part.method} onChange={(event) => updateServicePart(selectedFeature.id, part.id, { method: event.target.value })} placeholder="Optional detail" /></label></div>
                              </article>
                            ))}
                          </div>
                          <button className="gc-button secondary full" type="button" onClick={() => addServicePart(selectedFeature.id)}>+ Add custom service part</button>
                          <div className="gc-qc-callout"><strong>Worker complete ≠ PWS passed.</strong><span>When every service part is complete, this feature moves to Ready for QC. You still approve it as PWS standard.</span></div>
                        </div>
                      )}

                      {inspectorTab === "treatment" && (
                        <div className="gc-inspector-section">
                          <div className="gc-chemical-policy">
                            <label><span>Chemical eligibility</span><select value={selectedFeature.chemicalPolicy} onChange={(event) => updateFeature(selectedFeature.id, { chemicalPolicy: event.target.value as MapFeature["chemicalPolicy"] })}><option value="allowed">Allowed only after checks</option><option value="review">Review required</option><option value="prohibited">Chemical prohibited</option></select></label>
                            <div className={cx("gc-policy-box", selectedFeature.chemicalPolicy)}><strong>{selectedFeature.chemicalPolicy === "allowed" ? "Eligibility marked allowed" : selectedFeature.chemicalPolicy === "review" ? "Supervisor / label review required" : "Mechanical work only"}</strong><span>This is an internal planning flag. It never overrides the product label, PWS, IPMP, site restrictions, or law.</span></div>
                          </div>
                          {selectedFeature.featureType !== "weed-control-zone" && <button className="gc-button secondary full" type="button" onClick={() => updateFeature(selectedFeature.id, { featureType: "weed-control-zone", group: "problems-hazards", chemicalPolicy: "review", pwsClauses: PRESET_BY_TYPE["weed-control-zone"].pwsClauses })}>Convert to dedicated weed-control zone</button>}
                          <div className="gc-treatment-actions">
                            <button className="gc-button primary full" type="button" disabled={selectedFeature.chemicalPolicy === "prohibited" || state.products.length === 0} onClick={() => setApplicationFeatureId(selectedFeature.id)}>Record pesticide application</button>
                            {state.products.length === 0 && <button className="gc-link-button" type="button" onClick={() => setProductModal("new")}>Add the first verified product</button>}
                          </div>
                          <div className="gc-application-history">
                            <div className="gc-field-label"><span>Application history</span><small>{selectedFeatureApplications.length} record{selectedFeatureApplications.length === 1 ? "" : "s"}</small></div>
                            {selectedFeatureApplications.length === 0 ? <div className="gc-empty compact"><strong>No application recorded.</strong><p>The zone can still be handled mechanically or held for review.</p></div> : selectedFeatureApplications.map((row) => (
                              <article key={row.application.id}>
                                <header><div><strong>{row.product?.brandName || "Unknown product"}</strong><span>{formatDate(row.application.appliedAt, true)}</span></div><em className={row.due.tone}>{row.due.label}</em></header>
                                <dl><div><dt>Applicator</dt><dd>{row.application.applicator}</dd></div><div><dt>Inspect</dt><dd>{formatDate(row.timers.inspectAt)}</dd></div><div><dt>Earliest retreatment</dt><dd>{formatDate(row.timers.retreatAt)}</dd></div><div><dt>1532</dt><dd>{row.application.record1532Status}</dd></div></dl>
                                <label><span>Result</span><select value={row.application.effectiveness} onChange={(event) => updateApplication(row.application.id, { effectiveness: event.target.value as PesticideApplication["effectiveness"] })}><option value="pending">Pending inspection</option><option value="effective">Effective</option><option value="partial">Partial</option><option value="failed">Failed</option><option value="regrowth">Regrowth</option></select></label>
                              </article>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <header className="gc-panel-heading">
                      <div><p className="gc-eyebrow">Current map</p><h2>Feature inventory</h2></div><span className="gc-count">{mapFeatures.length}</span>
                    </header>
                    <label className="gc-search inspector-search"><span>⌕</span><input value={featureSearch} onChange={(event) => setFeatureSearch(event.target.value)} placeholder="Find a feature..." /></label>
                    <div className="gc-feature-list">
                      {filteredMapFeatures.length === 0 ? <div className="gc-empty"><strong>{mapFeatures.length ? "No features match." : "Your field overlay is clean."}</strong><p>Choose a real feature from the Add panel, then stamp, trace, or outline it on the map.</p></div> : filteredMapFeatures.map((feature) => (
                        <button type="button" key={feature.id} onClick={() => { setSelectedFeatureId(feature.id); setInspectorTab("details"); }}>
                          <span className="gc-feature-list-code" style={{ "--preset": PRESET_BY_TYPE[feature.featureType].color } as CSSProperties}>{PRESET_BY_TYPE[feature.featureType].shortLabel}</span>
                          <span><strong>{featureLabel(feature)}</strong><small>{feature.measurement || PRESET_BY_TYPE[feature.featureType].label} · {CYCLE_META[feature.cycle].label}</small></span>
                          <StatusPill status={feature.status} compact />
                        </button>
                      ))}
                    </div>
                    <section className="gc-map-pws">
                      <header><div><p className="gc-eyebrow">Location standard</p><h2>PWS checklist</h2></div><span>{siteProgress(selectedSite).complete}/{siteProgress(selectedSite).total}</span></header>
                      {selectedSite.checklist.map((check) => (
                        <details key={check.id} className={check.status === "standard" ? "complete" : ""}>
                          <summary><span>{check.status === "standard" ? "✓" : ""}</span><div><strong>{check.title}</strong><small>{check.clause}</small></div><StatusSelect compact value={check.status} onChange={(status) => updateChecklist(selectedSite.id, check.id, status)} /></summary>
                          <p>{check.standard}</p>
                        </details>
                      ))}
                    </section>
                    <section className="gc-visit-fields">
                      <div className="gc-form-grid two tight"><label><span>Last visit</span><input type="date" value={selectedSite.lastVisit ?? ""} onChange={(event) => updateSite(selectedSite.id, { lastVisit: event.target.value || null })} /></label><label><span>Next visit</span><input type="date" value={selectedSite.nextVisit ?? ""} onChange={(event) => updateSite(selectedSite.id, { nextVisit: event.target.value || null })} /></label></div>
                      <label className="gc-full-field"><span>Site-level notes</span><textarea rows={3} value={selectedSite.notes} onChange={(event) => updateSite(selectedSite.id, { notes: event.target.value }, false)} /></label>
                    </section>
                  </>
                )}
              </aside>
            </div>
          </main>
        )}

        {view === "work" && (
          <main className="gc-page gc-work-view">
            <section className="gc-page-hero">
              <div><p className="gc-eyebrow">Every location · One operating list</p><h2>Open work, exact location, exact equipment.</h2><p>Mapped features stay tied to the site plan. Quick tasks catch work that has not been mapped yet.</p></div>
              <div className="gc-page-hero-stats"><div><strong>{metrics.openItems}</strong><span>Open</span></div><div><strong>{metrics.readyQc}</strong><span>Ready QC</span></div><div><strong>{metrics.blocked}</strong><span>Blocked</span></div></div>
            </section>
            <QuickTaskForm key={selectedSite.id} sites={state.sites} defaultSiteId={selectedSite.id} onAdd={addTask} />
            <section className="gc-card gc-work-card">
              <header className="gc-section-header">
                <div><p className="gc-eyebrow">Prioritized list</p><h2>{allWork.length} work item{allWork.length === 1 ? "" : "s"}</h2></div>
                <div className="gc-work-filters">
                  <select value={siteFilter} onChange={(event) => setSiteFilter(event.target.value)}><option value="all">All locations</option>{state.sites.map((site) => <option value={site.id} key={site.id}>{site.code} · {site.city}</option>)}</select>
                  <div>{(["open", "all", "ready-qc", "blocked"] as WorkFilter[]).map((filter) => <button type="button" key={filter} className={workFilter === filter ? "active" : ""} onClick={() => setWorkFilter(filter)}>{filter === "ready-qc" ? "Ready QC" : filter.charAt(0).toUpperCase() + filter.slice(1)}</button>)}</div>
                </div>
              </header>
              {allWork.length === 0 ? <div className="gc-empty large"><strong>No work matches this filter.</strong><p>Map a site feature or add an unmapped task above.</p></div> : (
                <div className="gc-work-table">
                  <div className="gc-work-head"><span>Location / work</span><span>Type</span><span>Equipment</span><span>Priority</span><span>Status</span><span /></div>
                  {allWork.map((item) => {
                    const site = state.sites.find((candidate) => candidate.id === item.siteId);
                    return (
                      <article key={item.source + "-" + item.id}>
                        <div className="gc-work-main"><span className="gc-site-code small">{site?.code}</span><div><strong>{item.title}</strong>{item.notes && <small>{item.notes}</small>}</div></div>
                        <span className="gc-work-type">{item.type}</span>
                        <span className="gc-work-equipment"><i style={{ "--equipment": EQUIPMENT_COLORS[item.equipment] || "#718078" } as CSSProperties} />{item.equipment || "Not set"}</span>
                        <span className="gc-priority" style={{ "--tone": PRIORITY_META[item.priority].color } as CSSProperties}>{PRIORITY_META[item.priority].label}</span>
                        <StatusSelect compact value={item.status} onChange={(status) => item.source === "feature" ? updateFeature(item.id, { status }) : updateTask(item.id, { status })} label={item.title + " status"} />
                        <div className="gc-work-actions">
                          {item.source === "feature" && <button type="button" onClick={() => { setSelectedSiteId(item.siteId); setSelectedFeatureId(item.id); setView("features"); }}>Locate</button>}
                          <button type="button" className="danger" onClick={() => item.source === "feature" ? deleteFeature(item.id) : deleteTask(item.id)}>Delete</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        )}

        {view === "inventory" && <InventoryView state={state} onMutate={(change) => mutate(change)} onOpenPlan={() => { const camp = state.sites.find((site) => site.id === "ar024") ?? selectedSite; chooseSite(camp, "map"); }} onNotice={announce} />}

        {view === "reports" && <ReportsView state={state} onNotice={announce} />}

        {view === "settings" && (
          <main className="gc-page gc-support-view">
            <section className="gc-page-hero compact-dark">
              <div><p className="gc-eyebrow">Workspace control</p><h2>Grounds Command settings.</h2><p>Owner controls stay separate from the simplified field workspace.</p></div>
            </section>
            <section className="gc-settings-grid">
              <article className="gc-card"><ShieldCheck size={22} /><div><strong>Workspace mode</strong><p>Owner sees labor, cost, reports, payments, and configuration. Field keeps the map, tasks, crew, and proof workflow. Switching modes no longer throws away the page you were using.</p></div><div className="gc-mode-toggle wide"><button type="button" className={!fieldMode ? "active" : ""} onClick={() => changeProfileMode("owner")}>Owner</button><button type="button" className={fieldMode ? "active" : ""} onClick={() => changeProfileMode("field")}>Field</button></div></article>
              <article className="gc-card"><Home size={22} /><div><strong>Default landing page</strong><p>Choose which working screen opens first on this device when there is no saved deep link.</p></div><select className="gc-setting-select" value={defaultView} onChange={(event) => changeDefaultView(event.target.value as View)}>{NAV_ITEMS.filter((item) => !fieldMode || item.fieldVisible).map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select></article>
              <article className="gc-card"><Moon size={22} /><div><strong>Appearance</strong><p>The current release intentionally uses one high-contrast dark theme so field legibility stays consistent. This is an indicator, not a dead switch.</p></div><span className="gc-setting-state" title="Dark theme is fixed in this release">Dark · fixed</span></article>
              <article className="gc-card"><Save size={22} /><div><strong>Automatic saving</strong><p>Map plans, assignments, visits, inventory, work, reports, and costs save after each change.</p></div><button className="gc-button secondary" type="button" onClick={() => void saveNow()}>{saveLabel}</button></article>
            </section>
          </main>
        )}

        {view === "treatments" && (
          <main className="gc-page gc-treatment-view">
            <section className="gc-page-hero treatment">
              <div><p className="gc-eyebrow">Label-driven pesticide control</p><h2>Inspect, verify eligibility, record, then monitor.</h2><p>Inspection dates, earliest retreatment, keep-out, rainfast, planned service, and 1532 status stay separate.</p></div>
              <button className="gc-button light" type="button" onClick={() => setProductModal("new")}>+ Add verified product</button>
            </section>
            <div className="gc-treatment-kpis">
              <article><span>Mapped treatment zones</span><strong>{state.features.filter((feature) => feature.featureType === "weed-control-zone").length}</strong><small>Across {new Set(state.features.filter((feature) => feature.featureType === "weed-control-zone").map((feature) => feature.siteId)).size} locations</small></article>
              <article><span>Applications recorded</span><strong>{state.applications.length}</strong><small>{state.applications.filter((application) => application.record1532Status === "submitted").length} records submitted</small></article>
              <article className={dueTreatments.length ? "danger" : ""}><span>Action due</span><strong>{dueTreatments.length}</strong><small>Inspection or planned service overdue</small></article>
              <article><span>Verified products</span><strong>{state.products.filter((product) => product.approvedStatus === "approved").length}</strong><small>{state.products.length} total products in library</small></article>
            </div>
            <div className="gc-treatment-grid">
              <section className="gc-card">
                <header className="gc-section-header"><div><p className="gc-eyebrow">Product library</p><h2>Label-controlled rules</h2></div><button className="gc-button secondary" type="button" onClick={() => setProductModal("new")}>Add product</button></header>
                {state.products.length === 0 ? <div className="gc-empty large"><strong>No pesticide product has been verified.</strong><p>Add the exact label information before recording an application. Grounds Command will not guess retreatment or safety intervals.</p><button className="gc-button primary" type="button" onClick={() => setProductModal("new")}>Add first product</button></div> : (
                  <div className="gc-product-list">
                    {state.products.map((product) => (
                      <article key={product.id}>
                        <header><div><span className={cx("gc-product-status", product.approvedStatus)}>{product.approvedStatus.replace("-", " ")}</span><h3>{product.brandName}</h3><p>{product.activeIngredient || "Active ingredient not entered"}</p></div><div className="gc-product-actions"><button type="button" onClick={() => setProductModal(product)}>Edit</button><button type="button" className="danger" onClick={() => deleteProduct(product.id)}>Delete</button></div></header>
                        <dl><div><dt>EPA Reg.</dt><dd>{product.epaRegistrationNumber}</dd></div><div><dt>Inspect</dt><dd>{product.inspectionDays === null ? "Not entered" : product.inspectionDays + " days"}</dd></div><div><dt>Earliest retreatment</dt><dd>{product.earliestRetreatmentDays === null ? "Not entered" : product.earliestRetreatmentDays + " days"}</dd></div><div><dt>Keep-out</dt><dd>{product.keepOutHours === null ? "Not entered" : product.keepOutHours + " hours"}</dd></div></dl>
                        <div className="gc-product-links">{product.labelUrl && <a href={product.labelUrl} target="_blank" rel="noreferrer">Current label</a>}{product.sdsUrl && <a href={product.sdsUrl} target="_blank" rel="noreferrer">SDS</a>}</div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
              <section className="gc-card">
                <header className="gc-section-header"><div><p className="gc-eyebrow">Timers and outcomes</p><h2>Application activity</h2></div><span className="gc-count">{treatmentRows.length}</span></header>
                {treatmentRows.length === 0 ? <div className="gc-empty large"><strong>No application has been recorded.</strong><p>Create a weed-control zone on a map, verify a product, and record only completed applications.</p></div> : (
                  <div className="gc-treatment-table">
                    {treatmentRows.map((row) => (
                      <article key={row.application.id}>
                        <header><span className="gc-site-code small">{row.site?.code}</span><div><strong>{row.feature ? featureLabel(row.feature) : "Deleted zone"}</strong><small>{row.product?.brandName || "Unknown product"} · {formatDate(row.application.appliedAt, true)}</small></div><em className={row.due.tone}>{row.due.label}</em></header>
                        <div className="gc-timer-grid"><div><span>Keep-out until</span><strong>{formatDate(row.timers.keepOutUntil, true)}</strong></div><div><span>Inspect</span><strong>{formatDate(row.timers.inspectAt)}</strong></div><div><span>Earliest retreat</span><strong>{formatDate(row.timers.retreatAt)}</strong></div><div><span>1532</span><strong>{row.application.record1532Status}</strong></div></div>
                        <footer><span>Result</span><select value={row.application.effectiveness} onChange={(event) => updateApplication(row.application.id, { effectiveness: event.target.value as PesticideApplication["effectiveness"] })}><option value="pending">Pending inspection</option><option value="effective">Effective</option><option value="partial">Partial</option><option value="failed">Failed</option><option value="regrowth">Regrowth</option></select><button type="button" onClick={() => { setSelectedSiteId(row.application.siteId); setSelectedFeatureId(row.application.featureId); setInspectorTab("treatment"); setView("features"); }}>Open zone →</button></footer>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
            <section className="gc-legal-note"><span>!</span><div><strong>The app schedules reminders, not pesticide permission.</strong><p>Never apply or reapply solely because a timer is due. Re-check the current label, product approval, site restrictions, applicator credentials, weather, buffers, sensitive areas, and required reporting every time.</p></div></section>
          </main>
        )}
      </div>

      {notice && <div className={cx("gc-command-toast", notice.tone ?? "success")} role="status"><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={15} /></button></div>}

      <section className={cx("gc-print-sheet", printTarget !== "map" && "gc-print-hidden")}>
        <header className="gc-print-header">
          <div><p>{selectedSite.code} · {selectedMap.label}</p><h1>{selectedSite.name}</h1><span>{selectedSite.address}</span></div>
          <div><img src="/brand/grounds-mark.jpg" alt="" /><span>Grounds Command<small>{printMode === "visible" ? LAYER_META[layerMode].label : printMode.charAt(0).toUpperCase() + printMode.slice(1) + " map"}</small></span></div>
        </header>
        <div className="gc-print-content">
          <div className="gc-print-map">
            <svg viewBox={"0 0 " + MAP_WIDTH + " " + MAP_HEIGHT} aria-label="Printable annotated site plan">
              <image href={selectedMap.imageUrl} width={MAP_WIDTH} height={MAP_HEIGHT} preserveAspectRatio="none" />
              <FeatureShapes features={printFeatures} layerMode={printLayerMode} interactive={false} />
            </svg>
            <div className="gc-print-legend">
              {Array.from(new Set(printFeatures.map((feature) => printLayerMode === "features" ? PRESET_BY_TYPE[feature.featureType].label : printLayerMode === "work" ? CYCLE_META[feature.cycle].label : printLayerMode === "status" ? STATUS_META[feature.status].label : printLayerMode === "equipment" ? feature.equipment[0] || "No equipment" : feature.chemicalPolicy))).slice(0, 8).map((label) => {
                const feature = printFeatures.find((item) => (printLayerMode === "features" ? PRESET_BY_TYPE[item.featureType].label : printLayerMode === "work" ? CYCLE_META[item.cycle].label : printLayerMode === "status" ? STATUS_META[item.status].label : printLayerMode === "equipment" ? item.equipment[0] || "No equipment" : item.chemicalPolicy) === label);
                return feature ? <span key={label}><i style={{ background: featureColor(feature, printLayerMode) }} />{label}</span> : null;
              })}
            </div>
          </div>
          <aside className="gc-print-work">
            <div className="gc-print-summary"><div><span>Location condition</span><strong>{STATUS_META[selectedSite.condition].label}</strong></div><div><span>PWS verified</span><strong>{siteProgress(selectedSite).complete}/{siteProgress(selectedSite).total}</strong></div><div><span>Features shown</span><strong>{printFeatures.length}</strong></div></div>
            <h2>Numbered work list</h2>
            {printFeatures.length === 0 ? <p>No mapped features match this print view.</p> : (
              <ol>
                {printFeatures.slice(0, 16).map((feature) => (
                  <li key={feature.id}><span style={{ background: featureColor(feature, printLayerMode) }}>{feature.code}</span><div><strong>{feature.name}</strong><small>{PRESET_BY_TYPE[feature.featureType].label} · {STATUS_META[feature.status].label}</small><p>{feature.serviceParts.filter((part) => part.status !== "standard").slice(0, 2).map((part) => part.label).join(" · ") || "All service parts complete"}</p><em>{feature.equipment[0] || "Equipment not set"}</em></div></li>
                ))}
              </ol>
            )}
            {printFeatures.length > 16 && <p className="gc-print-more">+{printFeatures.length - 16} additional feature{printFeatures.length - 16 === 1 ? "" : "s"} in Grounds Command.</p>}
            {selectedSite.notes && <div className="gc-print-note"><strong>Site note</strong><p>{selectedSite.notes}</p></div>}
          </aside>
        </div>
        <footer className="gc-print-footer"><span>Government site plan with Grounds Maintenance field-verified overlay</span><span>Printed {currentDate}</span></footer>
      </section>

      <ServiceTicketPrint state={state} visitId={printVisitId} active={printTarget === "ticket"} />

      {productModal && <ProductModal product={productModal === "new" ? null : productModal} onClose={() => setProductModal(null)} onSave={saveProduct} />}
      {applicationFeature && <ApplicationModal feature={applicationFeature} products={state.products} onClose={() => setApplicationFeatureId(null)} onSave={saveApplication} />}
      {printModal && <PrintModal mode={printMode} onMode={setPrintMode} onClose={() => setPrintModal(false)} onPrint={() => { setPrintModal(false); setPrintTarget("map"); window.setTimeout(() => window.print(), 80); }} />}
    </div>
  );
}
