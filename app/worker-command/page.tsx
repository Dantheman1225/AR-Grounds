import CommandEntry from "../command-entry";

export const metadata = {
  title: "Worker Command | Grounds Command",
};

export default function WorkerCommandPage() {
  return <CommandEntry profileMode="field" initialView="command" />;
}
