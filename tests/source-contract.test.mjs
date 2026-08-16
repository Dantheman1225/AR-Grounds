import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = async (name) => readFile(new URL(`../${name}`, import.meta.url), "utf8");

test("visible support controls are backed by real workflows", async () => {
  const command = await source("app/grounds-command.tsx");
  const operations = await source("app/operations-v3.tsx");
  const support = await source("app/support-views.tsx");

  assert.doesNotMatch(command, /mode=\{view === "schedule" \? "visits"/);
  assert.match(command, /mode=\{view\}/);
  assert.match(operations, /mode === "schedule"/);
  assert.doesNotMatch(operations, /Finance view is available in the rail/);
  assert.match(operations, /onClick=\{onOpenFinance\}/);
  assert.match(support, /inventory: \[\.\.\.current\.inventory, item\]/);
  assert.match(support, /anchor\.download = `\$\{active\}-report/);
  assert.doesNotMatch(support, /window\.print\(\)/);
});

test("navigation, planner, and deployment shell include reliability contracts", async () => {
  const command = await source("app/grounds-command.tsx");
  const planner = await source("app/planning-workspace.tsx");
  const commandCss = await source("app/command-v4.css");
  const migration = await source("lib/migrate-state.ts");
  const worker = await source("worker/index.ts");

  assert.match(command, /window\.history\.pushState/);
  assert.match(command, /chooseSite\([^\n]+, view\)/);
  assert.doesNotMatch(command, /profileMode === "field"[\s\S]{0,180}setView\("command"\)/);
  assert.match(planner, /handleMapPointerMove/);
  assert.match(planner, /clipPolygon\(section\.geometry\.points/);
  assert.match(planner, /feetPerMapUnit/);
  assert.match(planner, /cycleHistory/);
  assert.match(planner, /new ResizeObserver/);
  assert.match(planner, /pointersRef\.current\.size >= 2/);
  assert.match(planner, /pinch\.zoom \* \(distance \/ pinch\.distance\)/);
  assert.match(planner, /style=\{\{ width: mapStage\.width, height: mapStage\.height \}\}/);
  assert.match(planner, /setFeatureDrawerOpen\(true\)/);
  assert.match(command, /aria-controls="gc-primary-menu"/);
  assert.match(command, /querySelectorAll<HTMLElement>/);
  assert.match(command, /aria-label="Close feature library"/);
  assert.match(commandCss, /\(hover: none\) and \(pointer: coarse\) and \(max-width: 1366px\)/);
  assert.match(commandCss, /\(hover: none\) and \(pointer: coarse\) and \(min-width: 841px\) and \(max-width: 1366px\)/);
  assert.match(commandCss, /\.gc-map-workspace \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) min\(330px, 36vw\)/);
  assert.match(commandCss, /\.gc-feature-library\.mobile-open \{[\s\S]*?visibility: visible;[\s\S]*?pointer-events: auto/);
  assert.match(commandCss, /\.gc-plan-map-scroll \{[\s\S]*?touch-action: none/);
  assert.match(commandCss, /\.gc-workload \{[\s\S]*?min-height: 0;[\s\S]*?overflow: hidden/);
  assert.match(migration, /inventory: Array\.isArray\(candidate\.inventory\)/);
  assert.match(worker, /no-store, max-age=0, must-revalidate/);
});

test("home command center is operations-first and role-ready", async () => {
  const command = await source("app/grounds-command.tsx");
  const commandCss = await source("app/command-v4.css");
  const liveRoute = await source("app/api/live/route/route.ts");
  const liveWeather = await source("app/api/live/weather/route.ts");
  const liveFinance = await source("app/api/live/finance/route.ts");

  assert.match(command, /type ProfileMode = "owner" \| "field"/);
  assert.match(command, /secretary.*simplified admin view/i);
  assert.match(command, /Today&apos;s mission/);
  assert.match(command, /Action required/);
  assert.match(command, /Current cycle/);
  assert.match(command, /Business pulse/);
  assert.match(command, /Recent activity/);
  assert.match(command, /gc-action-required/);
  assert.match(command, /gc-current-cycle/);
  assert.match(command, /gc-business-pulse/);
  assert.match(command, /gc-recent-activity/);
  assert.match(command, /const homeCommand = useMemo/);
  assert.match(command, /fetchLiveRoute/);
  assert.match(command, /fetchLiveWeather/);
  assert.match(command, /function HomeRouteMap/);
  assert.match(command, /INTEGRATION_STACK\.finance\.upgradePath/);
  assert.match(command, /function openHomeAction\(item: HomeActionItem\)/);
  assert.match(command, /function openRoute\(\)/);
  assert.doesNotMatch(command, /OperationsSnapshot/);
  assert.doesNotMatch(command, /Light rain/);
  assert.doesNotMatch(command, /routeMiles/);

  assert.match(commandCss, /\.gc-home-mission/);
  assert.match(commandCss, /\.gc-action-list/);
  assert.match(commandCss, /\.gc-cycle-list/);
  assert.match(commandCss, /\.gc-pulse-grid/);
  assert.match(commandCss, /\.gc-activity-list/);
  assert.match(commandCss, /\.gc-map-tiles/);
  assert.match(commandCss, /\.gc-map-route/);
  assert.doesNotMatch(commandCss, /radial-gradient\(circle at 24% 64%/);
  assert.match(commandCss, /@media \(max-width: 840px\)[\s\S]*\.gc-home-grid/);
  assert.doesNotMatch(commandCss, /letter-spacing:\s*-/);

  assert.match(liveRoute, /router\.project-osrm\.org/);
  assert.match(liveRoute, /geometries", "geojson"/);
  assert.match(liveWeather, /api\.open-meteo\.com/);
  assert.match(liveWeather, /temperature_unit", "fahrenheit"/);
  assert.match(liveFinance, /Plaid/);
  assert.match(liveFinance, /Stripe/);
  assert.match(liveFinance, /QuickBooks/);
});
