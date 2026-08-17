import type { Identity } from "./access-identity";

type AccessDeniedProps = {
  workspace: string;
  identity: Identity;
  alternative?: { href: string; label: string };
};

// Shown instead of a workspace when the signed-in person is not allowed into it.
// Names who they are signed in as, because the usual cause is being signed into
// the wrong Google account rather than genuinely lacking permission.
export default function AccessDenied({ workspace, identity, alternative }: AccessDeniedProps) {
  const signedInAs = identity.status === "authenticated" ? identity.email : null;
  const reason = identity.status === "anonymous" ? identity.reason : null;

  return (
    <main className="gc-access-denied">
      <h1>Not authorized</h1>
      <p>
        {signedInAs
          ? `You are signed in as ${signedInAs}, which does not have access to ${workspace}.`
          : `You need to sign in to reach ${workspace}.`}
      </p>
      {reason ? <p className="gc-access-denied-reason">{reason}</p> : null}
      {alternative ? <p><a href={alternative.href}>{alternative.label}</a></p> : null}
      <p className="gc-access-denied-reason">
        If this is wrong, check that you are signed in with the right account, or that the
        address is on the Grounds Command access list.
      </p>
    </main>
  );
}
