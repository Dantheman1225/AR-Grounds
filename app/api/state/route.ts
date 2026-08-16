import { readOwnerState, writeOwnerState } from "../../../db/state";
import { INITIAL_STATE } from "../../../lib/initial-state";
import { isAppState, migrateAppState } from "../../../lib/migrate-state";
import type { AppState } from "../../../lib/types";

export async function GET() {
  try {
    const saved = await readOwnerState();
    const state = saved ? migrateAppState(saved) : INITIAL_STATE;
    return Response.json({ state });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load Grounds Command." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { state?: unknown };
    if (!isAppState(body.state)) {
      return Response.json({ error: "Invalid app state." }, { status: 400 });
    }
    const normalized = migrateAppState(body.state);
    const encoded = JSON.stringify(normalized);
    if (encoded.length > 1_500_000) {
      return Response.json({ error: "The saved map data is too large." }, { status: 413 });
    }
    const state = await writeOwnerState(normalized as AppState);
    return Response.json({ state });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save Grounds Command." },
      { status: 500 },
    );
  }
}
