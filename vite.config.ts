import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// Cloudflare resource names. The @cloudflare/vite-plugin writes these straight
// into dist/server/wrangler.json, which is the config `wrangler deploy` actually
// uses - a hand-written wrangler.jsonc at the repo root is ignored. Local dev
// only needs the names to be stable, so the placeholders below are fine there;
// a real deploy needs CLOUDFLARE_D1_DATABASE_ID set to the id printed by
// `npx wrangler d1 create grounds-command`.
const D1_DATABASE_NAME = process.env.CLOUDFLARE_D1_DATABASE_NAME ?? "grounds-command";
const D1_DATABASE_ID =
  process.env.CLOUDFLARE_D1_DATABASE_ID ?? SITE_CREATOR_PLACEHOLDER_DATABASE_ID;
const R2_BUCKET_NAME =
  process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "grounds-command-proof";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: D1_DATABASE_NAME,
          database_id: D1_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: R2_BUCKET_NAME,
        },
      ]
    : [],
  // worker/index.ts uses env.IMAGES for the /_vinext/image transform endpoint.
  images: { binding: "IMAGES" },
  // worker/index.ts uses env.ASSETS to read the built client bundle.
  assets: { binding: "ASSETS" },
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
