import type { AppState } from "../lib/types";

const OWNER_STATE_ID = "primary";

function database() {
  const runtime = globalThis as typeof globalThis & {
    __GROUNDS_COMMAND_DB__?: D1Database;
  };
  if (!runtime.__GROUNDS_COMMAND_DB__) {
    throw new Error("The Grounds Command database is unavailable.");
  }
  return runtime.__GROUNDS_COMMAND_DB__;
}

async function ensureTable() {
  await database()
    .prepare(`CREATE TABLE IF NOT EXISTS owner_states (
      id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)
    .run();
}

export async function readOwnerState(): Promise<unknown | null> {
  await ensureTable();
  const row = await database()
    .prepare("SELECT state_json FROM owner_states WHERE id = ? LIMIT 1")
    .bind(OWNER_STATE_ID)
    .first<{ state_json: string }>();

  if (!row?.state_json) return null;
  return JSON.parse(row.state_json) as unknown;
}

export async function writeOwnerState(state: AppState): Promise<AppState> {
  await ensureTable();
  const updated: AppState = { ...state, updatedAt: new Date().toISOString() };
  const payload = JSON.stringify(updated);
  await database()
    .prepare(
      `INSERT INTO owner_states (id, state_json, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         state_json = excluded.state_json,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(OWNER_STATE_ID, payload)
    .run();
  return updated;
}
