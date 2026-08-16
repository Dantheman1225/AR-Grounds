import { fallbackRouteSummary, routeFromOsrm, type LiveRouteSummary } from "../../../../lib/live-integrations";
import type { Coordinates } from "../../../../lib/types";

function coordinateFromParams(url: URL, prefix: "origin" | "destination"): Coordinates | null {
  const lat = Number(url.searchParams.get(`${prefix}Lat`));
  const lng = Number(url.searchParams.get(`${prefix}Lng`));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = coordinateFromParams(url, "origin");
  const destination = coordinateFromParams(url, "destination");

  if (!origin || !destination) {
    return Response.json({ error: "Valid origin and destination coordinates are required." }, { status: 400 });
  }

  const upstream = new URL(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`);
  upstream.searchParams.set("overview", "full");
  upstream.searchParams.set("geometries", "geojson");
  upstream.searchParams.set("steps", "false");

  try {
    const response = await fetch(upstream, {
      headers: { "accept": "application/json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error("OSRM route request failed");
    const body = await response.json() as { code?: string; routes?: Array<{ distance?: number; duration?: number; geometry?: { coordinates?: number[][] } }> };
    const route = body.routes?.[0];
    if (body.code !== "Ok" || !route) throw new Error("OSRM did not return a route");
    const summary = routeFromOsrm(route);
    const payload: LiveRouteSummary = {
      ...summary,
      routePoints: summary.routePoints.length ? summary.routePoints : [origin, destination],
    };
    return Response.json(payload);
  } catch {
    return Response.json(fallbackRouteSummary(origin, destination, "OSRM is unavailable, so this is a distance-based route estimate."));
  }
}
