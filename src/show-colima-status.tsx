import { ActionPanel, Action, Detail, Icon, Color } from "@raycast/api";
import {
  useColimaList,
  runColima,
  formatBytes,
  type ColimaListEntry,
} from "./colima";

function buildMarkdown(entries: ColimaListEntry[] | null): string {
  if (!entries) {
    return "## Colima not found\n\nMake sure Colima is installed and the path is configured.";
  }

  if (entries.length === 0) {
    return "## No profiles found\n\nNo Colima profiles have been created yet.";
  }

  const lines: string[] = [];

  for (const entry of entries) {
    const isRunning = entry.status === "Running";
    const statusEmoji = isRunning ? "🟢" : "🔴";

    lines.push(`## ${statusEmoji} ${entry.name}`);
    lines.push("");
    lines.push("| Property | Value |");
    lines.push("| --- | --- |");
    lines.push(`| **Status** | ${entry.status} |`);
    lines.push(`| **Architecture** | ${entry.arch} |`);
    lines.push(`| **CPUs** | ${entry.cpus} |`);
    lines.push(`| **Memory** | ${formatBytes(entry.memory)} |`);
    lines.push(`| **Disk** | ${formatBytes(entry.disk)} |`);
    if (entry.runtime) {
      lines.push(`| **Runtime** | ${entry.runtime} |`);
    }
    if (entry.address) {
      lines.push(`| **Address** | ${entry.address} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export default function Command() {
  const { entries, refresh } = useColimaList();

  const hasRunning = entries?.some((e) => e.status === "Running") ?? false;
  const hasStopped = entries?.some((e) => e.status !== "Running") ?? false;

  return (
    <Detail
      isLoading={entries === null}
      markdown={buildMarkdown(entries)}
      actions={
        <ActionPanel>
          <Action
            title="Refresh"
            icon={Icon.ArrowClockwise}
            onAction={refresh}
          />
          {hasStopped && (
            <Action
              title="Start Colima"
              icon={{ source: Icon.Play, tintColor: Color.Green }}
              onAction={() => runColima("start")}
            />
          )}
          {hasRunning && (
            <Action
              title="Stop Colima"
              icon={{ source: Icon.Stop, tintColor: Color.Red }}
              onAction={() => runColima("stop")}
            />
          )}
        </ActionPanel>
      }
    />
  );
}
