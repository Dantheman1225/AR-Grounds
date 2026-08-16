import type { Coordinates } from "./types";

export type LiveRouteStatus = "loading" | "ready" | "fallback" | "error";
export type LiveWeatherStatus = "loading" | "ready" | "fallback" | "error";

export type LiveRouteSummary = {
  status: LiveRouteStatus;
  provider: string;
  sourceLabel: string;
  distanceMiles: number | null;
  durationMinutes: number | null;
  routePoints: Coordinates[];
  updatedAt: string | null;
  message: string | null;
};

export type LiveWeatherSummary = {
  status: LiveWeatherStatus;
  provider: string;
  sourceLabel: string;
  tempF: number | null;
  condition: string;
  windMph: number | null;
  precipitationChance: number | null;
  risk: string;
  updatedAt: string | null;
  message: string | null;
};

export const INTEGRATION_STACK = {
  maps: {
    visual: "OpenStreetMap raster tiles",
    routing: "OSRM route service",
    upgradePath: "Mapbox, MapTiler, or Google Routes when an API key is connected",
  },
  weather: {
    current: "Open-Meteo forecast API",
    upgradePath: "National Weather Service alerts can be layered in for official warnings",
  },
  finance: {
    current: "Grounds Command internal payment ledger",
    upgradePath: "Plaid for bank transactions, Stripe for payment collection, QuickBooks for accounting sync",
  },
} as const;

const METERS_PER_MILE = 1609.344;
const AVERAGE_DRIVE_SPEED_MPH = 46;

export function haversineMiles(origin: Coordinates, destination: Coordinates) {
  const radiusMiles = 3958.8;
  const toRadians = (value: number) => value * Math.PI / 180;
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);
  const a = Math.sin(dLat / 2) ** 2
    + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return radiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function fallbackRouteSummary(origin: Coordinates, destination: Coordinates, message: string | null = null): LiveRouteSummary {
  const miles = haversineMiles(origin, destination) * 1.32;
  return {
    status: message ? "fallback" : "loading",
    provider: "Route estimate",
    sourceLabel: "Waiting for OSRM",
    distanceMiles: Math.round(miles * 10) / 10,
    durationMinutes: Math.max(8, Math.round((miles / AVERAGE_DRIVE_SPEED_MPH) * 60)),
    routePoints: [origin, destination],
    updatedAt: null,
    message,
  };
}

export function fallbackWeatherSummary(message: string | null = null): LiveWeatherSummary {
  return {
    status: message ? "fallback" : "loading",
    provider: "Weather pending",
    sourceLabel: "Waiting for Open-Meteo",
    tempF: null,
    condition: "Checking destination",
    windMph: null,
    precipitationChance: null,
    risk: "Review before chemical work",
    updatedAt: null,
    message,
  };
}

export function weatherCodeLabel(code: number | null | undefined) {
  if (code === 0) return "Clear";
  if (code === 1 || code === 2) return "Mostly clear";
  if (code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code ?? -1)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code ?? -1)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code ?? -1)) return "Snow";
  if ([95, 96, 99].includes(code ?? -1)) return "Thunderstorms";
  return "Conditions available";
}

export async function fetchLiveRoute(origin: Coordinates, destination: Coordinates, signal?: AbortSignal): Promise<LiveRouteSummary> {
  const params = new URLSearchParams({
    originLat: String(origin.lat),
    originLng: String(origin.lng),
    destinationLat: String(destination.lat),
    destinationLng: String(destination.lng),
  });
  const response = await fetch(`/api/live/route?${params.toString()}`, { signal });
  if (!response.ok) throw new Error("route provider failed");
  return await response.json() as LiveRouteSummary;
}

export async function fetchLiveWeather(coordinates: Coordinates, signal?: AbortSignal): Promise<LiveWeatherSummary> {
  const params = new URLSearchParams({
    lat: String(coordinates.lat),
    lng: String(coordinates.lng),
  });
  const response = await fetch(`/api/live/weather?${params.toString()}`, { signal });
  if (!response.ok) throw new Error("weather provider failed");
  return await response.json() as LiveWeatherSummary;
}

export function routeFromOsrm(route: { distance?: number; duration?: number; geometry?: { coordinates?: number[][] } }): LiveRouteSummary {
  const routePoints = Array.isArray(route.geometry?.coordinates)
    ? route.geometry.coordinates
      .map(([lng, lat]) => ({ lat, lng }))
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
    : [];

  return {
    status: "ready",
    provider: "OSRM",
    sourceLabel: "OpenStreetMap road route",
    distanceMiles: typeof route.distance === "number" ? Math.round((route.distance / METERS_PER_MILE) * 10) / 10 : null,
    durationMinutes: typeof route.duration === "number" ? Math.max(1, Math.round(route.duration / 60)) : null,
    routePoints,
    updatedAt: new Date().toISOString(),
    message: null,
  };
}
