import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import CommandEntry from "../command-entry";
import { isOwner, resolveIdentity } from "../access-identity";
import AccessDenied from "../access-denied";

export const metadata = {
  title: "Admin Command | Grounds Command",
};

// Reads the caller's Access assertion, so this page must render per request.
export const dynamic = "force-dynamic";

export default async function AdminCommandPage() {
  const identity = await resolveIdentity(
    new Request("https://command.argrounds.com/admin-command", {
      headers: await headers(),
    }),
    env as never,
  );

  if (!isOwner(identity)) {
    return (
      <AccessDenied
        workspace="the owner workspace"
        identity={identity}
        alternative={{ href: "/worker-command", label: "Open the field workspace" }}
      />
    );
  }

  return <CommandEntry profileMode="owner" initialView="command" />;
}
