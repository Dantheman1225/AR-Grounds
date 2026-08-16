import GroundsCommand from "./grounds-command";

export default function Home() {
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
  return <GroundsCommand ownerName="Danny" todayLabel={todayLabel} />;
}
