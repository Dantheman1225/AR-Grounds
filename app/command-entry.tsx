import GroundsCommand, { type CommandProfileMode, type CommandView } from "./grounds-command";

type CommandEntryProps = {
  profileMode?: CommandProfileMode;
  initialView?: CommandView;
};

export default function CommandEntry({ profileMode, initialView = "command" }: CommandEntryProps) {
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <GroundsCommand
      ownerName="Danny"
      todayLabel={todayLabel}
      routeMode={profileMode}
      routeView={initialView}
    />
  );
}
