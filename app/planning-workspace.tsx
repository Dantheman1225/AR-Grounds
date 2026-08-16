"use client";

import {
  AlertTriangle,
  ArrowLeftRight,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Layers3,
  MapPinned,
  Maximize2,
  MousePointer2,
  Plus,
  Printer,
  Ruler,
  Sparkles,
  Trees,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type {
  AppState,
  Geometry,
  MapFeature,
  PlanDaySection,
  PlanStatus,
  PlanTool,
  PlanWorkerZone,
  Point,
  Site,
  SiteMap,
  SiteWorkPlan,
} from "../lib/types";

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 773;

const DAY_COLORS = ["#33c8ec", "#f29b38", "#a76be8", "#ebcf49", "#45ce91"];
const ZONE_COLORS = ["#1c8ee8", "#42c576", "#a260e8", "#f09a31", "#e85e85", "#35bfc5"];

type ActiveScope = "site" | "unscheduled" | string;
type DraftKind = "day" | "zone";

type PlannerProps = {
  state: AppState;
  site: Site;
  map: SiteMap;
  ownerName: string;
  fieldMode: boolean;
  onMutate: (change: (current: AppState) => AppState) => void;
  onOpenFeatures: () => void;
  onOpenWork: () => void;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function shortMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function points(geometry: Geometry) {
  return geometry.points.map((point) => `${point.x},${point.y}`).join(" ");
}

function center(geometry: Geometry): Point {
  if (!geometry.points.length) return { x: 0, y: 0 };
  return {
    x: geometry.points.reduce((sum, point) => sum + point.x, 0) / geometry.points.length,
    y: geometry.points.reduce((sum, point) => sum + point.y, 0) / geometry.points.length,
  };
}

function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index];
    const b = polygon[previous];
    const crosses = (a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || Number.EPSILON) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function clipPolygon(pointsToClip: Point[], bounds: { minX: number; maxX: number; minY: number; maxY: number }) {
  type Edge = "left" | "right" | "top" | "bottom";
  const edges: Edge[] = ["left", "right", "top", "bottom"];
  const inside = (point: Point, edge: Edge) => edge === "left" ? point.x >= bounds.minX : edge === "right" ? point.x <= bounds.maxX : edge === "top" ? point.y >= bounds.minY : point.y <= bounds.maxY;
  const intersect = (start: Point, end: Point, edge: Edge): Point => {
    if (edge === "left" || edge === "right") {
      const x = edge === "left" ? bounds.minX : bounds.maxX;
      const ratio = (x - start.x) / ((end.x - start.x) || Number.EPSILON);
      return { x, y: start.y + ratio * (end.y - start.y) };
    }
    const y = edge === "top" ? bounds.minY : bounds.maxY;
    const ratio = (y - start.y) / ((end.y - start.y) || Number.EPSILON);
    return { x: start.x + ratio * (end.x - start.x), y };
  };
  return edges.reduce((output, edge) => {
    if (!output.length) return output;
    const input = output;
    const next: Point[] = [];
    let start = input[input.length - 1];
    input.forEach((end) => {
      if (inside(end, edge)) {
        if (!inside(start, edge)) next.push(intersect(start, end, edge));
        next.push(end);
      } else if (inside(start, edge)) next.push(intersect(start, end, edge));
      start = end;
    });
    return next;
  }, pointsToClip);
}

function lineLength(pointsToMeasure: Point[]) {
  return pointsToMeasure.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - pointsToMeasure[index].x, point.y - pointsToMeasure[index].y), 0);
}

function polygonArea(pointsToMeasure: Point[]) {
  if (pointsToMeasure.length < 3) return 0;
  return Math.abs(pointsToMeasure.reduce((sum, point, index) => {
    const next = pointsToMeasure[(index + 1) % pointsToMeasure.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0) / 2);
}

function estimateFeatureHours(feature: MapFeature, feetPerMapUnit: number | null | undefined) {
  const serviceFactor = Math.max(1, feature.serviceParts.filter((part) => part.status !== "standard").length) * 0.12;
  if (feature.geometry.kind === "point") return Math.max(0.2, serviceFactor);
  if (feature.geometry.kind === "line") {
    const distance = lineLength(feature.geometry.points);
    const feet = feetPerMapUnit ? distance * feetPerMapUnit : distance * 3;
    return Math.max(serviceFactor, feet / 900 + serviceFactor);
  }
  const area = polygonArea(feature.geometry.points);
  const acres = feetPerMapUnit ? (area * feetPerMapUnit * feetPerMapUnit) / 43_560 : area / 40_000;
  return Math.max(serviceFactor, acres / 2.25 + serviceFactor);
}

function featureTouchesZone(feature: MapFeature, zonePoints: Point[]) {
  return pointInPolygon(center(feature.geometry), zonePoints) || feature.geometry.points.some((point) => pointInPolygon(point, zonePoints));
}

function statusLabel(status: PlanStatus) {
  if (status === "ready-qc") return "Ready for QC";
  if (status === "in-progress") return "In progress";
  if (status === "complete") return "Complete";
  if (status === "carryover") return "Carryover";
  return "Planned";
}

function sectionHours(plan: SiteWorkPlan, sectionId: string) {
  return plan.workerZones.filter((zone) => zone.sectionId === sectionId).reduce((sum, zone) => sum + zone.estimatedHours + zone.carryoverHours, 0);
}

function defaultPlan(site: Site, map: SiteMap): SiteWorkPlan {
  return {
    id: `plan-${site.id}-${map.id}`,
    siteId: site.id,
    mapId: map.id,
    cycleNumber: 1,
    cycleName: "Current service cycle",
    crewCapacityHoursPerDay: 28,
    loadedLaborMultiplier: 1.18,
    status: "planned",
    feetPerMapUnit: null,
    calibrationLabel: "",
    cycleHistory: [],
    daySections: [],
    workerZones: [],
    updatedAt: new Date().toISOString(),
  };
}

function metricWidth(value: number, maximum: number) {
  if (maximum <= 0) return "0%";
  return `${Math.min(100, Math.max(4, (value / maximum) * 100))}%`;
}

export default function PlanningWorkspace({
  state,
  site,
  map,
  ownerName,
  fieldMode,
  onMutate,
  onOpenFeatures,
  onOpenWork,
}: PlannerProps) {
  const plan = state.plans.find((item) => item.siteId === site.id && item.mapId === map.id) ?? defaultPlan(site, map);
  const [activeScope, setActiveScope] = useState<ActiveScope>(plan.daySections[0]?.id ?? "site");
  const [activeTool, setActiveTool] = useState<PlanTool>("zones");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(plan.workerZones[0]?.id ?? null);
  const [workloadOpen, setWorkloadOpen] = useState(false);
  const [drawKind, setDrawKind] = useState<DraftKind | null>(null);
  const [draft, setDraft] = useState<Point[]>([]);
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [showDayFill, setShowDayFill] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showFeatures, setShowFeatures] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [mapViewport, setMapViewport] = useState({ width: MAP_WIDTH, height: MAP_HEIGHT });
  const [featureDrawerOpen, setFeatureDrawerOpen] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<Point[]>([]);
  const [knownDistance, setKnownDistance] = useState("");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef(1);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const panRef = useRef<{ pointerId: number; x: number; y: number; left: number; top: number; moved: boolean; zoneId: string | null } | null>(null);
  const tapRef = useRef<{ pointerId: number; x: number; y: number; moved: boolean } | null>(null);
  const pinchRef = useRef<{ distance: number; zoom: number; contentX: number; contentY: number } | null>(null);

  const activeSection = plan.daySections.find((section) => section.id === activeScope) ?? null;
  const selectedZone = plan.workerZones.find((zone) => zone.id === selectedZoneId) ?? null;
  const visibleZones = activeSection
    ? plan.workerZones.filter((zone) => zone.sectionId === activeSection.id)
    : activeScope === "unscheduled"
      ? []
      : plan.workerZones;
  const visibleFeatures = state.features.filter((feature) => feature.siteId === site.id && feature.mapId === map.id);
  const crew = state.crew.filter((member) => member.active);
  const fitScale = Math.max(mapViewport.width / MAP_WIDTH, mapViewport.height / MAP_HEIGHT);
  const mapStage = useMemo(() => ({
    width: Math.max(1, Math.round(MAP_WIDTH * fitScale * zoom)),
    height: Math.max(1, Math.round(MAP_HEIGHT * fitScale * zoom)),
  }), [fitScale, zoom]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const measure = () => setMapViewport({ width: Math.max(1, scroll.clientWidth), height: Math.max(1, scroll.clientHeight) });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroll);
    return () => observer.disconnect();
  }, [map.id, site.id]);

  useEffect(() => {
    pointersRef.current.clear();
    panRef.current = null;
    pinchRef.current = null;
    tapRef.current = null;
    const frame = window.requestAnimationFrame(() => {
      zoomRef.current = 1;
      setZoom(1);
      const scroll = scrollRef.current;
      if (scroll) {
        scroll.scrollLeft = 0;
        scroll.scrollTop = 0;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [map.id, site.id]);

  const summary = (() => {
    const zones = activeSection ? plan.workerZones.filter((zone) => zone.sectionId === activeSection.id) : plan.workerZones;
    const estimated = zones.reduce((sum, zone) => sum + zone.estimatedHours + zone.carryoverHours, 0);
    const dayCount = activeSection ? 1 : Math.max(1, plan.daySections.length);
    const capacity = plan.crewCapacityHoursPerDay * dayCount;
    const directLabor = zones.reduce((sum, zone) => {
      const assigned = state.crew.find((member) => member.id === zone.assigneeId);
      const rate = assigned?.hourlyRate ?? 15;
      return sum + (zone.estimatedHours + zone.carryoverHours) * rate;
    }, 0);
    const loadedLabor = directLabor * plan.loadedLaborMultiplier;
    const equipment = zones.reduce((sum, zone) => sum + zone.equipmentCost, 0);
    const materials = zones.reduce((sum, zone) => sum + zone.materialsCost, 0);
    const budget = activeSection ? activeSection.budget : site.monthlyServiceValue;
    const totalCost = loadedLabor + equipment + materials;
    return {
      zones,
      estimated,
      capacity,
      directLabor,
      loadedLabor,
      equipment,
      materials,
      budget,
      totalCost,
      remainingHours: Math.max(0, capacity - estimated),
      variance: capacity - estimated,
      margin: budget - totalCost,
    };
  })();

  function writePlan(nextPlan: SiteWorkPlan) {
    onMutate((current) => ({
      ...current,
      plans: current.plans.some((item) => item.id === nextPlan.id)
        ? current.plans.map((item) => item.id === nextPlan.id ? { ...nextPlan, updatedAt: new Date().toISOString() } : item)
        : [...current.plans, { ...nextPlan, updatedAt: new Date().toISOString() }],
    }));
  }

  function patchPlan(patch: Partial<SiteWorkPlan>) {
    writePlan({ ...plan, ...patch });
  }

  function patchSection(sectionId: string, patch: Partial<PlanDaySection>) {
    patchPlan({ daySections: plan.daySections.map((section) => section.id === sectionId ? { ...section, ...patch } : section) });
  }

  function patchZone(zoneId: string, patch: Partial<PlanWorkerZone>) {
    patchPlan({ workerZones: plan.workerZones.map((zone) => zone.id === zoneId ? { ...zone, ...patch } : zone) });
  }

  function pointFromClient(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(MAP_WIDTH, ((clientX - rect.left) / rect.width) * MAP_WIDTH)),
      y: Math.max(0, Math.min(MAP_HEIGHT, ((clientY - rect.top) / rect.height) * MAP_HEIGHT)),
    };
  }

  function addMapPoint(clientX: number, clientY: number) {
    const point = pointFromClient(clientX, clientY);
    if (!point) return;
    if (drawKind) {
      setDraft((current) => [...current, point]);
      return;
    }
    if (activeTool === "measure") {
      setMeasurePoints((current) => {
        if (current.length >= 2) {
          setKnownDistance("");
          return [point];
        }
        return [...current, point];
      });
    }
  }

  function zoneIdFromTarget(target: EventTarget | null) {
    return target instanceof Element ? target.closest("[data-zone-id]")?.getAttribute("data-zone-id") ?? null : null;
  }

  function setZoomAt(nextValue: number, clientX?: number, clientY?: number) {
    const scroll = scrollRef.current;
    const current = zoomRef.current;
    const next = Math.max(1, Math.min(3.5, nextValue));
    if (!scroll || Math.abs(next - current) < 0.001) return;
    const rect = scroll.getBoundingClientRect();
    const localX = (clientX ?? (rect.left + rect.width / 2)) - rect.left;
    const localY = (clientY ?? (rect.top + rect.height / 2)) - rect.top;
    const contentX = scroll.scrollLeft + localX;
    const contentY = scroll.scrollTop + localY;
    const ratio = next / current;
    zoomRef.current = next;
    setZoom(next);
    window.requestAnimationFrame(() => {
      scroll.scrollLeft = contentX * ratio - localX;
      scroll.scrollTop = contentY * ratio - localY;
    });
  }

  function handleMapPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const touchLike = event.pointerType !== "mouse";
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (touchLike) {
      event.preventDefault();
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (touchLike && pointersRef.current.size >= 2) {
      const [first, second] = [...pointersRef.current.values()].slice(0, 2);
      const rect = scroll.getBoundingClientRect();
      const midpoint = { x: (first.x + second.x) / 2 - rect.left, y: (first.y + second.y) / 2 - rect.top };
      pinchRef.current = {
        distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
        zoom: zoomRef.current,
        contentX: scroll.scrollLeft + midpoint.x,
        contentY: scroll.scrollTop + midpoint.y,
      };
      panRef.current = null;
      tapRef.current = null;
      return;
    }

    if (!drawKind && (activeTool === "pan" || (touchLike && activeTool !== "measure"))) {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
      panRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: scroll.scrollLeft,
        top: scroll.scrollTop,
        moved: false,
        zoneId: zoneIdFromTarget(event.target),
      };
      return;
    }

    if (touchLike) {
      tapRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
      return;
    }

    addMapPoint(event.clientX, event.clientY);
  }

  function handleMapPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (pointersRef.current.has(event.pointerId)) pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pinch = pinchRef.current;
    const scroll = scrollRef.current;
    if (pinch && scroll && pointersRef.current.size >= 2) {
      event.preventDefault();
      const [first, second] = [...pointersRef.current.values()].slice(0, 2);
      const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
      const next = Math.max(1, Math.min(3.5, pinch.zoom * (distance / pinch.distance)));
      const rect = scroll.getBoundingClientRect();
      const localX = (first.x + second.x) / 2 - rect.left;
      const localY = (first.y + second.y) / 2 - rect.top;
      const ratio = next / pinch.zoom;
      zoomRef.current = next;
      setZoom(next);
      window.requestAnimationFrame(() => {
        scroll.scrollLeft = pinch.contentX * ratio - localX;
        scroll.scrollTop = pinch.contentY * ratio - localY;
      });
      return;
    }

    const pan = panRef.current;
    if (pan && scroll && pan.pointerId === event.pointerId) {
      event.preventDefault();
      const deltaX = event.clientX - pan.x;
      const deltaY = event.clientY - pan.y;
      if (Math.hypot(deltaX, deltaY) > 5) pan.moved = true;
      scroll.scrollLeft = pan.left - deltaX;
      scroll.scrollTop = pan.top - deltaY;
      return;
    }

    const tap = tapRef.current;
    if (tap?.pointerId === event.pointerId && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 8) tap.moved = true;
  }

  function finishMapPointer(event: ReactPointerEvent<SVGSVGElement>) {
    const wasPinching = Boolean(pinchRef.current);
    pointersRef.current.delete(event.pointerId);
    if (wasPinching) {
      pinchRef.current = null;
      tapRef.current = null;
      panRef.current = null;
      const scroll = scrollRef.current;
      const remaining = [...pointersRef.current.entries()][0];
      if (scroll && remaining && !drawKind && activeTool !== "measure") {
        panRef.current = { pointerId: remaining[0], x: remaining[1].x, y: remaining[1].y, left: scroll.scrollLeft, top: scroll.scrollTop, moved: true, zoneId: null };
      }
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }

    const pan = panRef.current;
    if (pan?.pointerId === event.pointerId) {
      if (!pan.moved && pan.zoneId && activeTool !== "pan") {
        setSelectedZoneId(pan.zoneId);
        if (activeTool === "assign") setWorkloadOpen(true);
      }
      panRef.current = null;
    }

    const tap = tapRef.current;
    if (tap?.pointerId === event.pointerId) {
      if (!tap.moved) addMapPoint(event.clientX, event.clientY);
      tapRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function cancelMapPointer(event: ReactPointerEvent<SVGSVGElement>) {
    pointersRef.current.delete(event.pointerId);
    if (panRef.current?.pointerId === event.pointerId) panRef.current = null;
    if (tapRef.current?.pointerId === event.pointerId) tapRef.current = null;
    pinchRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function beginDrawing(kind: DraftKind) {
    if (kind === "zone" && !activeSection) {
      window.alert("Select a day before drawing a worker zone.");
      return;
    }
    setActiveTool("zones");
    setDrawKind(kind);
    setDraft([]);
    setSelectedZoneId(null);
  }

  function finishDrawing() {
    if (!drawKind || draft.length < 3) return;
    if (drawKind === "day") {
      const sequence = plan.daySections.length + 1;
      const section: PlanDaySection = {
        id: makeId("day"),
        name: `Day ${sequence}`,
        sequence,
        color: DAY_COLORS[(sequence - 1) % DAY_COLORS.length],
        geometry: { kind: "polygon", points: draft },
        scheduledDate: null,
        status: "planned",
        targetHours: plan.crewCapacityHoursPerDay,
        budget: site.monthlyServiceValue / Math.max(1, sequence),
        notes: "",
      };
      writePlan({ ...plan, daySections: [...plan.daySections, section] });
      setActiveScope(section.id);
    } else if (activeSection) {
      const siblings = plan.workerZones.filter((zone) => zone.sectionId === activeSection.id);
      const code = `D${activeSection.sequence}-${String.fromCharCode(65 + siblings.length)}`;
      const zone: PlanWorkerZone = {
        id: makeId("zone"), sectionId: activeSection.id, code, name: "New worker zone", assigneeId: null, assigneeName: "Unassigned",
        color: ZONE_COLORS[siblings.length % ZONE_COLORS.length], geometry: { kind: "polygon", points: draft }, estimatedHours: 0,
        carryoverHours: 0, budget: 0, equipmentCost: 0, materialsCost: 0, featureIds: [], status: "planned", notes: "",
      };
      writePlan({ ...plan, workerZones: [...plan.workerZones, zone] });
      setSelectedZoneId(zone.id);
      setWorkloadOpen(true);
    }
    setDrawKind(null);
    setDraft([]);
  }

  function balanceByLabor() {
    const targetSections = activeSection ? [activeSection] : plan.daySections;
    let nextZones = [...plan.workerZones];
    targetSections.forEach((section) => {
      const zones = nextZones.filter((zone) => zone.sectionId === section.id);
      if (!zones.length) return;
      const work = visibleFeatures
        .filter((feature) => featureTouchesZone(feature, section.geometry.points))
        .map((feature) => ({ feature, hours: estimateFeatureHours(feature, plan.feetPerMapUnit) }))
        .sort((a, b) => b.hours - a.hours);
      if (!work.length) {
        const total = zones.reduce((sum, zone) => sum + zone.estimatedHours, 0);
        const share = Math.round((total / zones.length) * 10) / 10;
        nextZones = nextZones.map((zone, index) => zone.sectionId === section.id
          ? { ...zone, estimatedHours: index === zones.length - 1 ? Math.max(0, Math.round((total - share * (zones.length - 1)) * 10) / 10) : share }
          : zone);
        return;
      }
      const buckets = zones.map((zone) => ({ zone, hours: 0, featureIds: [] as string[] }));
      work.forEach(({ feature, hours }) => {
        const bucket = [...buckets].sort((a, b) => a.hours - b.hours)[0];
        bucket.featureIds.push(feature.id);
        bucket.hours += hours;
      });
      const byId = new Map(buckets.map((bucket) => [bucket.zone.id, bucket]));
      nextZones = nextZones.map((zone) => {
        const bucket = byId.get(zone.id);
        return bucket ? { ...zone, featureIds: bucket.featureIds, estimatedHours: Math.round(bucket.hours * 10) / 10 } : zone;
      });
    });
    patchPlan({ workerZones: nextZones });
  }

  function deleteZone(zoneId: string) {
    if (!window.confirm("Delete this worker zone? Its mapped site features will remain.")) return;
    patchPlan({ workerZones: plan.workerZones.filter((zone) => zone.id !== zoneId) });
    setSelectedZoneId(null);
  }

  function splitIntoFour(section: PlanDaySection) {
    const xs = section.geometry.points.map((point) => point.x);
    const ys = section.geometry.points.map((point) => point.y);
    if (!xs.length || !ys.length) return;
    const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
    const midX = (minX + maxX) / 2; const midY = (minY + maxY) / 2;
    const rectangles = [
      { minX, maxX: midX, minY, maxY: midY },
      { minX: midX, maxX, minY, maxY: midY },
      { minX, maxX: midX, minY: midY, maxY },
      { minX: midX, maxX, minY: midY, maxY },
    ];
    const existing = plan.workerZones.filter((zone) => zone.sectionId !== section.id);
    const hours = Math.round((section.targetHours / 4) * 10) / 10;
    const names = crew.length ? crew.slice(0, 4) : [];
    const zones = rectangles.map((bounds, index) => ({ bounds, index, points: clipPolygon(section.geometry.points, bounds) }))
      .filter((item) => item.points.length >= 3)
      .map(({ index, points: clipped }): PlanWorkerZone => {
        const featureIds = visibleFeatures.filter((feature) => featureTouchesZone(feature, clipped)).map((feature) => feature.id);
        const mappedHours = featureIds.reduce((sum, id) => {
          const feature = visibleFeatures.find((item) => item.id === id);
          return sum + (feature ? estimateFeatureHours(feature, plan.feetPerMapUnit) : 0);
        }, 0);
        return {
          id: makeId("zone"), sectionId: section.id, code: `D${section.sequence}-${String.fromCharCode(65 + index)}`,
          name: ["Northwest", "Northeast", "Southwest", "Southeast"][index], assigneeId: names[index]?.id ?? null,
          assigneeName: names[index]?.name.split(" ")[0] ?? `Crew ${index + 1}`, color: ZONE_COLORS[index], geometry: { kind: "polygon", points: clipped },
          estimatedHours: Math.round((mappedHours || hours) * 10) / 10, carryoverHours: 0, budget: section.budget / Math.max(1, rectangles.length), equipmentCost: 0, materialsCost: 0,
          featureIds, status: "planned", notes: "",
        };
      });
    patchPlan({ workerZones: [...existing, ...zones] });
    setSelectedZoneId(zones[0]?.id ?? null);
  }

  function startNewCycle() {
    if (!window.confirm(`Close Cycle ${plan.cycleNumber} and start the next service cycle? The current totals will be kept in cycle history.`)) return;
    const now = new Date();
    const snapshot = {
      cycleNumber: plan.cycleNumber,
      cycleName: plan.cycleName,
      closedAt: now.toISOString(),
      status: plan.status,
      estimatedHours: plan.workerZones.reduce((sum, zone) => sum + zone.estimatedHours + zone.carryoverHours, 0),
      completedZones: plan.workerZones.filter((zone) => zone.status === "complete").length,
      totalZones: plan.workerZones.length,
    };
    patchPlan({
      cycleNumber: plan.cycleNumber + 1,
      cycleName: `${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })} service cycle`,
      status: "planned",
      cycleHistory: [...(plan.cycleHistory ?? []), snapshot].slice(-12),
      daySections: plan.daySections.map((section) => ({ ...section, status: "planned" })),
      workerZones: plan.workerZones.map((zone) => ({ ...zone, status: "planned", carryoverHours: zone.status === "complete" ? 0 : zone.carryoverHours })),
    });
  }

  function calibrateMeasurement() {
    if (measurePoints.length !== 2) return;
    const units = Math.hypot(measurePoints[1].x - measurePoints[0].x, measurePoints[1].y - measurePoints[0].y);
    const feet = Number(knownDistance);
    if (!units || !Number.isFinite(feet) || feet <= 0) return;
    patchPlan({ feetPerMapUnit: feet / units, calibrationLabel: `${feet.toFixed(1)} ft over ${units.toFixed(1)} map units` });
  }

  const tools: Array<{ key: PlanTool; label: string; icon: typeof MousePointer2 }> = [
    { key: "pan", label: "Pan", icon: MousePointer2 },
    { key: "zones", label: "Zones", icon: MapPinned },
    { key: "features", label: "Features", icon: Trees },
    { key: "assign", label: "Assign", icon: UserPlus },
    { key: "measure", label: "Measure", icon: Ruler },
    { key: "layers", label: "Layers", icon: Layers3 },
  ];

  function chooseTool(tool: PlanTool) {
    if (tool === "features") {
      setActiveTool("features");
      setFeatureDrawerOpen(true);
      setLayersOpen(false);
      setOverviewOpen(false);
      return;
    }
    setActiveTool(tool);
    setFeatureDrawerOpen(false);
    if (tool === "measure") setMeasurePoints([]);
    if (tool === "assign") setWorkloadOpen(true);
    if (tool === "layers") setLayersOpen((current) => !current);
  }

  return (
    <main className={cx("gc-plan", fieldMode && "field-mode")}>
      <header className="gc-plan-head">
        <div className="gc-cycle-copy">
          <button type="button" aria-label="Close this cycle and start a new service cycle" title="Close cycle and preserve its totals" onClick={startNewCycle}><Sparkles size={17} /></button>
          <div><strong>Cycle {String(plan.cycleNumber).padStart(2, "0")}</strong><span>{plan.daySections.length} days</span><span>{plan.daySections.reduce((sum, section) => sum + sectionHours(plan, section.id), 0).toFixed(1)} crew-hrs</span>{(plan.cycleHistory?.length ?? 0) > 0 && <span>{plan.cycleHistory?.length} archived</span>}</div>
        </div>
        <nav className="gc-plan-tabs" aria-label="Map workdays">
          <button type="button" className={activeScope === "site" ? "active" : ""} onClick={() => setActiveScope("site")}>Entire site</button>
          {[...plan.daySections].sort((a, b) => a.sequence - b.sequence).map((section) => (
            <button type="button" key={section.id} className={activeScope === section.id ? "active" : ""} onClick={() => { setActiveScope(section.id); setSelectedZoneId(plan.workerZones.find((zone) => zone.sectionId === section.id)?.id ?? null); }}>{section.name}</button>
          ))}
          <button type="button" className={activeScope === "unscheduled" ? "active" : ""} onClick={() => setActiveScope("unscheduled")}>Unscheduled</button>
        </nav>
        <div className="gc-plan-head-actions">
          <button type="button" onClick={onOpenWork}><ClipboardList size={17} /><span>Open work</span></button>
          <button type="button" onClick={() => window.print()}><Printer size={17} /><span>Print / PDF</span></button>
        </div>
      </header>

      <div className="gc-plan-layout">
        <section className="gc-plan-map-panel">
          <div className="gc-plan-map-scroll" ref={scrollRef}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              preserveAspectRatio="none"
              className={cx("gc-planning-map", drawKind && "drawing", activeTool === "pan" && "panning")}
              style={{ width: mapStage.width, height: mapStage.height }}
              onPointerDown={handleMapPointerDown}
              onPointerMove={handleMapPointerMove}
              onPointerUp={finishMapPointer}
              onPointerCancel={cancelMapPointer}
              aria-label={`${site.code} ${map.label} multi-day work plan`}
            >
              <image href={map.imageUrl} width={MAP_WIDTH} height={MAP_HEIGHT} preserveAspectRatio="none" />
              <rect width={MAP_WIDTH} height={MAP_HEIGHT} className="gc-map-dim" />

              {plan.daySections.map((section) => {
                const focused = activeScope === "site" || activeScope === section.id;
                const sectionCenter = center(section.geometry);
                return (
                  <g key={section.id} className={cx("gc-day-shape", focused && "focused")}>
                    <polygon points={points(section.geometry)} fill={section.color} fillOpacity={showDayFill ? (focused ? 0.24 : 0.08) : 0} stroke={section.color} strokeWidth={focused ? 5 : 2} strokeOpacity={focused ? 1 : 0.35} vectorEffect="non-scaling-stroke" />
                    {showLabels && (activeScope === "site" || !showZones || activeScope !== section.id) && <text x={sectionCenter.x} y={sectionCenter.y} textAnchor="middle" className="gc-day-label">{section.name.toUpperCase()}</text>}
                  </g>
                );
              })}

              {showZones && visibleZones.map((zone) => {
                const zoneCenter = center(zone.geometry);
                const selected = zone.id === selectedZoneId;
                return (
                  <g key={zone.id} data-zone-id={zone.id} className={cx("gc-zone-shape", selected && "selected")} onPointerDown={(event) => { if (event.pointerType !== "mouse" || drawKind || activeTool === "pan" || activeTool === "measure") return; event.stopPropagation(); setSelectedZoneId(zone.id); if (activeTool === "assign") setWorkloadOpen(true); }}>
                    <polygon points={points(zone.geometry)} fill={zone.color} fillOpacity={selected ? 0.32 : 0.16} stroke={zone.color} strokeWidth={selected ? 5 : 3} strokeOpacity={0.95} vectorEffect="non-scaling-stroke" />
                    {showLabels && (
                      <g transform={`translate(${zoneCenter.x - 64}, ${zoneCenter.y - 28})`}>
                        <rect width="128" height="56" rx="8" fill="#0c3d83" stroke="#86d7ff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                        <text x="64" y="23" textAnchor="middle" className="gc-zone-label top">{zone.code} · {zone.assigneeName.toUpperCase()}</text>
                        <text x="64" y="44" textAnchor="middle" className="gc-zone-label">{(zone.estimatedHours + zone.carryoverHours).toFixed(1)}H</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {showFeatures && visibleFeatures.map((feature) => <PlannerFeature key={feature.id} feature={feature} />)}

              {measurePoints.length > 0 && (
                <g className="gc-plan-measure">
                  {measurePoints.length === 2 && <line x1={measurePoints[0].x} y1={measurePoints[0].y} x2={measurePoints[1].x} y2={measurePoints[1].y} />}
                  {measurePoints.map((point, index) => <circle key={`measure-${index}`} cx={point.x} cy={point.y} r="9" />)}
                  {measurePoints.length === 2 && (() => {
                    const distance = Math.hypot(measurePoints[1].x - measurePoints[0].x, measurePoints[1].y - measurePoints[0].y);
                    const midpoint = { x: (measurePoints[0].x + measurePoints[1].x) / 2, y: (measurePoints[0].y + measurePoints[1].y) / 2 };
                    const label = plan.feetPerMapUnit ? `${(distance * plan.feetPerMapUnit).toFixed(1)} ft` : `${distance.toFixed(0)} map units`;
                    return <g transform={`translate(${midpoint.x - 64},${midpoint.y - 21})`}><rect width="128" height="42" rx="8" /><text x="64" y="26" textAnchor="middle">{label}</text></g>;
                  })()}
                </g>
              )}

              {draft.length > 0 && (
                <g>
                  <polygon points={draft.map((point) => `${point.x},${point.y}`).join(" ")} fill="#4fc877" fillOpacity="0.18" stroke="#66f29a" strokeWidth="5" strokeDasharray="13 9" vectorEffect="non-scaling-stroke" />
                  {draft.map((point, index) => <circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r="7" fill="#eaffef" stroke="#188748" strokeWidth="4" />)}
                </g>
              )}
            </svg>
          </div>

          {site.code === "AR024" && (
            <div className="gc-exclusion-note">
              <AlertTriangle size={15} />
              <div><strong>53-acre no-work scope safeguard</strong><span>Only drawn service sections and their mapped work are counted. Verify the exclusion boundary against the source site plan before adding a new section.</span></div>
            </div>
          )}

          {drawKind && (
            <div className="gc-plan-draw-banner">
              <div><strong>Drawing a {drawKind === "day" ? "day section" : "worker zone"}</strong><span>Tap around its outside edge, then finish the shape.</span></div>
              <button type="button" onClick={() => setDraft((current) => current.slice(0, -1))}>Undo point</button>
              <button type="button" className="finish" onClick={finishDrawing} disabled={draft.length < 3}><Check size={16} /> Finish</button>
              <button type="button" onClick={() => { setDrawKind(null); setDraft([]); }} aria-label="Cancel drawing"><X size={18} /></button>
            </div>
          )}

          {!fieldMode && overviewOpen && plan.daySections.length > 0 && (
            <aside className="gc-plan-overview">
              <header><strong>{plan.daySections.length}-day overview</strong><button type="button" onClick={() => setOverviewOpen(false)} aria-label="Close overview"><X size={14} /></button></header>
              <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
                <image href={map.imageUrl} width={MAP_WIDTH} height={MAP_HEIGHT} preserveAspectRatio="none" />
                {plan.daySections.map((section) => {
                  const sectionCenter = center(section.geometry);
                  return <g key={section.id}><polygon points={points(section.geometry)} fill={section.color} fillOpacity="0.42" stroke={section.color} strokeWidth="8" /><text x={sectionCenter.x} y={sectionCenter.y} textAnchor="middle">{section.name.toUpperCase()}</text></g>;
                })}
              </svg>
            </aside>
          )}

          {!fieldMode && !overviewOpen && <button type="button" className="gc-overview-reopen" onClick={() => setOverviewOpen(true)}><Maximize2 size={16} /> Overview</button>}

          <div className="gc-map-zoom">
            <button type="button" aria-label="Zoom map in" onClick={() => setZoomAt(zoomRef.current + 0.25)}>+</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Zoom map out" onClick={() => setZoomAt(zoomRef.current - 0.25)}>−</button>
          </div>

          <div className="gc-map-toolbox">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return <button type="button" key={tool.key} className={activeTool === tool.key ? "active" : ""} onClick={() => chooseTool(tool.key)}><Icon size={19} /><span>{tool.label}</span></button>;
            })}
            <button type="button" className="more" onClick={() => setLayersOpen((current) => !current)}><Plus size={20} /><span>More</span></button>
          </div>

          {layersOpen && (
            <div className="gc-layer-popover">
              <header><strong>Map layers</strong><button type="button" onClick={() => setLayersOpen(false)}><X size={15} /></button></header>
              <label><input type="checkbox" checked={showDayFill} onChange={(event) => setShowDayFill(event.target.checked)} /> Day sections</label>
              <label><input type="checkbox" checked={showZones} onChange={(event) => setShowZones(event.target.checked)} /> Worker zones</label>
              <label><input type="checkbox" checked={showFeatures} onChange={(event) => setShowFeatures(event.target.checked)} /> Site features</label>
              <label><input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} /> Labels</label>
            </div>
          )}

          {featureDrawerOpen && (
            <aside className="gc-map-feature-drawer" aria-label="Mapped site features">
              <header><div><span>Map features</span><strong>{visibleFeatures.length} on {map.label}</strong></div><button type="button" onClick={() => setFeatureDrawerOpen(false)} aria-label="Close mapped features"><X size={17} /></button></header>
              <p>Feature overlays stay on this map while you pan, pinch, measure, and assign work.</p>
              <div>
                {visibleFeatures.length ? visibleFeatures.slice(0, 8).map((feature) => (
                  <article key={feature.id}><i /><span><strong>{feature.code} · {feature.name}</strong><small>{feature.featureType.replaceAll("-", " ")} · {feature.serviceParts.length} work item{feature.serviceParts.length === 1 ? "" : "s"}</small></span></article>
                )) : <p className="empty">No mapped features yet.</p>}
              </div>
              <button type="button" className="open-editor" onClick={onOpenFeatures}><Trees size={17} /> Add or edit mapped features</button>
            </aside>
          )}

          {!fieldMode && activeTool === "zones" && !drawKind && (
            <div className="gc-zone-actions">
              <button type="button" onClick={() => beginDrawing("day")}><CalendarDays size={16} /> Draw day section</button>
              <button type="button" onClick={() => beginDrawing("zone")} disabled={!activeSection}><Users size={16} /> Draw worker zone</button>
              {activeSection && <button type="button" onClick={() => splitIntoFour(activeSection)}><ArrowLeftRight size={16} /> Split day × 4</button>}
            </div>
          )}

          {activeTool === "measure" && !drawKind && (
            <div className="gc-measure-hint"><Ruler size={16} /><span>{measurePoints.length === 0 ? "Tap the first point" : measurePoints.length === 1 ? "Tap the second point" : plan.feetPerMapUnit ? `Calibrated · ${plan.calibrationLabel || `${plan.feetPerMapUnit.toFixed(3)} ft/unit`}` : "Enter the known real-world distance to calibrate"}</span>{measurePoints.length === 2 && !plan.feetPerMapUnit && <label><input type="number" min="0.1" step="0.1" value={knownDistance} onChange={(event) => setKnownDistance(event.target.value)} placeholder="Known feet" aria-label="Known distance in feet" /><button type="button" onClick={calibrateMeasurement} disabled={!Number(knownDistance)}>Calibrate</button></label>}{measurePoints.length > 0 && <button type="button" onClick={() => { setMeasurePoints([]); setKnownDistance(""); }}>Clear</button>}{plan.feetPerMapUnit && <button type="button" onClick={() => patchPlan({ feetPerMapUnit: null, calibrationLabel: "" })}>Reset scale</button>}</div>
          )}
        </section>

        <WorkloadPanel
          className={workloadOpen ? "mobile-open" : ""}
          plan={plan}
          site={site}
          activeSection={activeSection}
          selectedZone={selectedZone}
          summary={summary}
          zones={summary.zones}
          features={visibleFeatures}
          crew={crew}
          ownerName={ownerName}
          fieldMode={fieldMode}
          onClose={() => setWorkloadOpen(false)}
          onSelectZone={(zoneId) => setSelectedZoneId(zoneId)}
          onPatchSection={patchSection}
          onPatchZone={patchZone}
          onDeleteZone={deleteZone}
          onBalance={balanceByLabor}
        />
      </div>

      <button type="button" className="gc-mobile-workload-bar" onClick={() => setWorkloadOpen(true)}>
        <span>{activeSection?.name ?? "Site"}</span><strong>{summary.estimated.toFixed(1)} / {summary.capacity.toFixed(1)}H</strong><ChevronRight size={18} />
      </button>
    </main>
  );
}

function PlannerFeature({ feature }: { feature: MapFeature }) {
  const featureCenter = center(feature.geometry);
  if (feature.geometry.kind === "line") return <polyline points={points(feature.geometry)} fill="none" stroke="#e745bc" strokeWidth="4" strokeDasharray="10 8" vectorEffect="non-scaling-stroke" />;
  if (feature.geometry.kind === "polygon") return <polygon points={points(feature.geometry)} fill="#3ad480" fillOpacity="0.15" stroke="#3ad480" strokeWidth="3" strokeDasharray="7 6" vectorEffect="non-scaling-stroke" />;
  return <g transform={`translate(${featureCenter.x},${featureCenter.y})`} className="gc-plan-feature"><circle r="13" fill="#0d5d32" stroke="#d6ffdf" strokeWidth="3" /><Trees x={-8} y={-8} width="16" height="16" color="#ffffff" /></g>;
}

type WorkloadSummary = {
  estimated: number;
  capacity: number;
  directLabor: number;
  loadedLabor: number;
  equipment: number;
  materials: number;
  budget: number;
  totalCost: number;
  remainingHours: number;
  variance: number;
  margin: number;
};

function WorkloadPanel({
  className,
  plan,
  site,
  activeSection,
  selectedZone,
  summary,
  zones,
  features,
  crew,
  fieldMode,
  onClose,
  onSelectZone,
  onPatchSection,
  onPatchZone,
  onDeleteZone,
  onBalance,
}: {
  className?: string;
  plan: SiteWorkPlan;
  site: Site;
  activeSection: PlanDaySection | null;
  selectedZone: PlanWorkerZone | null;
  summary: WorkloadSummary;
  zones: PlanWorkerZone[];
  features: MapFeature[];
  crew: AppState["crew"];
  ownerName: string;
  fieldMode: boolean;
  onClose: () => void;
  onSelectZone: (zoneId: string) => void;
  onPatchSection: (sectionId: string, patch: Partial<PlanDaySection>) => void;
  onPatchZone: (zoneId: string, patch: Partial<PlanWorkerZone>) => void;
  onDeleteZone: (zoneId: string) => void;
  onBalance: () => void;
}) {
  return (
    <aside className={cx("gc-workload", className)}>
      <header>
        <div><p>{site.code} · {activeSection?.name ?? "Entire site"}</p><h2>{activeSection?.name ?? "Cycle"} workload</h2></div>
        <button type="button" onClick={onClose} aria-label="Close workload"><X size={20} /></button>
      </header>

      <div className="gc-workload-scroll">
        {activeSection && !fieldMode && (
          <div className="gc-day-settings">
            <label><span>Work date</span><input type="date" value={activeSection.scheduledDate ?? ""} onChange={(event) => onPatchSection(activeSection.id, { scheduledDate: event.target.value || null })} /></label>
            <label><span>Day status</span><select value={activeSection.status} onChange={(event) => onPatchSection(activeSection.id, { status: event.target.value as PlanStatus })}><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="ready-qc">Ready for QC</option><option value="complete">Complete</option><option value="carryover">Carryover</option></select></label>
          </div>
        )}

        <div className="gc-workload-metrics">
          <Metric label="Crew capacity" value={`${summary.capacity.toFixed(1)}H`} amount={summary.capacity} maximum={summary.capacity} />
          <Metric label="Estimated" value={`${summary.estimated.toFixed(1)}H`} amount={summary.estimated} maximum={summary.capacity} />
          {!fieldMode && <Metric label="Loaded labor" value={money(summary.loadedLabor)} amount={summary.loadedLabor} maximum={summary.budget} />}
          <Metric label="Remaining" value={`${summary.remainingHours.toFixed(1)}H`} amount={summary.remainingHours} maximum={summary.capacity} />
        </div>

        {!fieldMode && (
          <div className="gc-cost-strip">
            <div><span>Day / cycle budget</span><strong>{money(summary.budget)}</strong></div>
            <div><span>Equipment + material</span><strong>{money(summary.equipment + summary.materials)}</strong></div>
            <div><span>Forecast margin</span><strong className={summary.margin < 0 ? "danger" : ""}>{money(summary.margin)}</strong></div>
          </div>
        )}

        <section className="gc-zone-list">
          <header><span>Zone / crew</span><span>Est. hrs</span></header>
          {zones.length === 0 ? <div className="gc-plan-empty"><MapPinned size={28} /><strong>No worker zones yet.</strong><span>Select a day and use Zones to draw or split it.</span></div> : zones.map((zone) => (
            <button type="button" key={zone.id} className={selectedZone?.id === zone.id ? "active" : ""} onClick={() => onSelectZone(zone.id)}>
              <i style={{ background: zone.color }} />
              <div><strong>{zone.code} · {zone.assigneeName}</strong><span>{zone.name} · {statusLabel(zone.status)}</span><b><em style={{ width: metricWidth(zone.estimatedHours + zone.carryoverHours, plan.crewCapacityHoursPerDay / Math.max(1, zones.length)) }} /></b></div>
              <span>{(zone.estimatedHours + zone.carryoverHours).toFixed(1)}H</span>
              <ChevronRight size={17} />
            </button>
          ))}
        </section>

        {selectedZone && zones.some((zone) => zone.id === selectedZone.id) && (
          <section className="gc-zone-editor">
            <header><div><span>Edit assignment</span><strong>{selectedZone.code} · {selectedZone.name}</strong></div><i style={{ background: selectedZone.color }} /></header>
            <div className="gc-zone-editor-grid">
              <label><span>Zone name</span><input value={selectedZone.name} onChange={(event) => onPatchZone(selectedZone.id, { name: event.target.value })} /></label>
              <label><span>Worker</span><select value={selectedZone.assigneeId ?? ""} onChange={(event) => { const member = crew.find((item) => item.id === event.target.value); onPatchZone(selectedZone.id, { assigneeId: member?.id ?? null, assigneeName: member?.name ?? "Unassigned" }); }}><option value="">Unassigned</option>{crew.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
              <label><span>Estimated hours</span><input type="number" step="0.1" min="0" value={selectedZone.estimatedHours} onChange={(event) => onPatchZone(selectedZone.id, { estimatedHours: Number(event.target.value) || 0 })} /></label>
              <label><span>Carryover hours</span><input type="number" step="0.1" min="0" value={selectedZone.carryoverHours} onChange={(event) => onPatchZone(selectedZone.id, { carryoverHours: Number(event.target.value) || 0 })} /></label>
              {!fieldMode && <><label><span>Zone budget</span><input type="number" step="0.01" min="0" value={selectedZone.budget} onChange={(event) => onPatchZone(selectedZone.id, { budget: Number(event.target.value) || 0 })} /></label><label><span>Equipment cost</span><input type="number" step="0.01" min="0" value={selectedZone.equipmentCost} onChange={(event) => onPatchZone(selectedZone.id, { equipmentCost: Number(event.target.value) || 0 })} /></label><label><span>Material cost</span><input type="number" step="0.01" min="0" value={selectedZone.materialsCost} onChange={(event) => onPatchZone(selectedZone.id, { materialsCost: Number(event.target.value) || 0 })} /></label></>}
              <label><span>Status</span><select value={selectedZone.status} onChange={(event) => onPatchZone(selectedZone.id, { status: event.target.value as PlanStatus })}><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="ready-qc">Ready for QC</option><option value="complete">Complete</option><option value="carryover">Carryover</option></select></label>
              <label className="wide"><span>Work notes / what remains</span><textarea rows={3} value={selectedZone.notes} onChange={(event) => onPatchZone(selectedZone.id, { notes: event.target.value })} placeholder="Exact work, equipment, access, carryover..." /></label>
            </div>
            <div className="gc-zone-features">
              <header><div><span>Mapped work</span><strong>{selectedZone.featureIds.length} features assigned</strong></div><small>Features may be shared when work crosses a zone boundary.</small></header>
              {features.length === 0 ? (
                <p>No mapped features yet. Use the Features tool to add trees, edges, areas, hazards, and access points.</p>
              ) : (
                <div>
                  {features.map((feature) => {
                    const assigned = selectedZone.featureIds.includes(feature.id);
                    const shared = plan.workerZones.filter((zone) => zone.featureIds.includes(feature.id)).length > (assigned ? 1 : 0);
                    return (
                      <button
                        type="button"
                        key={feature.id}
                        className={assigned ? "assigned" : ""}
                        aria-pressed={assigned}
                        disabled={fieldMode}
                        onClick={() => onPatchZone(selectedZone.id, { featureIds: assigned ? selectedZone.featureIds.filter((id) => id !== feature.id) : [...selectedZone.featureIds, feature.id] })}
                      >
                        <span>{assigned ? <Check size={14} /> : <Plus size={14} />}</span>
                        <div><strong>{feature.code} · {feature.name}</strong><small>{feature.featureType.replaceAll("-", " ")} · {feature.serviceParts.length} work items</small></div>
                        {shared && <em>Shared</em>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {!fieldMode && <button type="button" className="gc-zone-delete" onClick={() => onDeleteZone(selectedZone.id)}>Delete zone</button>}
          </section>
        )}

        <div className={cx("gc-capacity-warning", summary.variance < 0 ? "over" : "under")}>
          {summary.variance < 0 ? <AlertTriangle size={19} /> : <Check size={19} />}
          <div><strong>{summary.variance < 0 ? "Overload" : "Crew has room"}</strong><span>{Math.abs(summary.variance).toFixed(1)} crew-hours {summary.variance < 0 ? "over capacity" : "remaining"}.</span></div>
        </div>

        {!fieldMode && <button type="button" className="gc-balance-button" onClick={onBalance}><ArrowLeftRight size={20} /> Balance mapped work by labor</button>}
        <button type="button" className="gc-print-button" onClick={() => window.print()}><Printer size={20} /> Print / PDF</button>

        {!fieldMode && (
          <section className="gc-cost-breakdown">
            <header><strong>Forecast cost breakdown</strong><span>{shortMoney(summary.totalCost)}</span></header>
            <dl><div><dt>Direct labor</dt><dd>{money(summary.directLabor)}</dd></div><div><dt>Loaded labor</dt><dd>{money(summary.loadedLabor)}</dd></div><div><dt>Equipment</dt><dd>{money(summary.equipment)}</dd></div><div><dt>Materials</dt><dd>{money(summary.materials)}</dd></div><div className="total"><dt>Remaining margin</dt><dd>{money(summary.margin)}</dd></div></dl>
          </section>
        )}
      </div>
    </aside>
  );
}

function Metric({ label, value, amount, maximum }: { label: string; value: string; amount: number; maximum: number }) {
  return <article><span>{label}</span><strong>{value}</strong><i><b style={{ width: metricWidth(amount, maximum) }} /></i></article>;
}
