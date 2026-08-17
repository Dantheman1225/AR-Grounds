import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import CommandEntry from "../command-entry";
import { canRead, isOwner, resolveIdentity } from "../access-identity";
import AccessDenied from "../access-denied";

export const metadata = {
  title: "Worker Command | Grounds Command",
};

// Reads the caller's Access assertion, so this page must render per request.
export const dynamic = "force-dynamic";

export default async function WorkerCommandPage() {
  const identity = await resolveIdentity(
    new Request("https://command.argrounds.com/worker-command", {
      headers: await headers(),
    }),
    env as never,
  );

  if (!canRead(identity)) {
    return <AccessDenied workspace="the field workspace" identity={identity} />;
  }

  // The owner opening the field workspace is legitimate - it is how you check
  // what the crew actually sees on their phones.
  return <CommandEntry profileMode={isOwner(identity) ? "field" : "field"} initialView="command" />;
}
