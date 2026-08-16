import CommandEntry from "../command-entry";

export const metadata = {
  title: "Admin Command | Grounds Command",
};

export default function AdminCommandPage() {
  return <CommandEntry profileMode="owner" initialView="command" />;
}
