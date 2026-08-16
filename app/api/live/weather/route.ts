import { fallbackWeatherSummary, weatherCodeLabel, type LiveWeatherSummary } from "../../../../lib/live-integrations";

function weatherRisk(condition: string, precipitationChance: number | null, windMph: number | null) {
  if ((precipitationChance ?? 0) >= 60) return "Rain likely; review chemical timing";
  if ((windMph ?? 0) >= 18) return "Wind watch for spraying and debris";
  if (condition === "Thunderstorms") return "Storm risk; hold exposed work";
  if (condition === "Rain" || condition === "Drizzle") return "Wet conditions; mow with care";
  return "Good for mowing and cleanup";
}

function nearestHourlyPrecipitation(body: { current?: { time?: string }; hourly?: { time?: string[]; precipitation_probability?: number[] } }) {
  const times = body.hourly?.time;
  const values = body.hourly?.precipitation_probability;
  const currentTime = body.current?.time;
  if (!Array.isArray(times) || !Array.isArray(values) || !currentTime) return null;
  const exact = times.indexOf(currentTime);
  if (exact >= 0 && typeof values[exact] === "number") return values[exact];
  const next = times.findIndex((time) => time >= currentTime);
  return next >= 0 && typeof values[next] === "number" ? values[next] : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return Response.json({ error: "Valid coordinates are required." }, { status: 400 });
  }

  const upstream = new URL("https://api.open-meteo.com/v1/forecast");
  upstream.searchParams.set("latitude", String(lat));
  upstream.searchParams.set("longitude", String(lng));
  upstream.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m,precipitation");
  upstream.searchParams.set("hourly", "precipitation_probability");
  upstream.searchParams.set("temperature_unit", "fahrenheit");
  upstream.searchParams.set("wind_speed_unit", "mph");
  upstream.searchParams.set("precipitation_unit", "inch");
  upstream.searchParams.set("forecast_days", "1");
  upstream.searchParams.set("timezone", "auto");

  try {
    const response = await fetch(upstream, {
      headers: { "accept": "application/json" },
      next: { revalidate: 900 },
    });
    if (!response.ok) throw new Error("Open-Meteo request failed");
    const body = await response.json() as {
      current?: {
        time?: string;
        temperature_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        precipitation?: number;
      };
      hourly?: { time?: string[]; precipitation_probability?: number[] };
    };
    const condition = weatherCodeLabel(body.current?.weather_code);
    const precipitationChance = nearestHourlyPrecipitation(body);
    const windMph = typeof body.current?.wind_speed_10m === "number" ? Math.round(body.current.wind_speed_10m) : null;
    const tempF = typeof body.current?.temperature_2m === "number" ? Math.round(body.current.temperature_2m) : null;
    const payload: LiveWeatherSummary = {
      status: "ready",
      provider: "Open-Meteo",
      sourceLabel: "Live destination forecast",
      tempF,
      condition,
      windMph,
      precipitationChance,
      risk: weatherRisk(condition, precipitationChance, windMph),
      updatedAt: new Date().toISOString(),
      message: null,
    };
    return Response.json(payload);
  } catch {
    return Response.json(fallbackWeatherSummary("Open-Meteo is unavailable, so weather is not live right now."));
  }
}
