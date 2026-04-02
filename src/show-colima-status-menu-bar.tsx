import { useEffect, useState, useCallback, useRef } from "react";
import {
  Icon,
  Color,
  MenuBarExtra,
  getPreferenceValues,
  showHUD,
} from "@raycast/api";
import { execFile, execFileSync, spawn } from "child_process";
import { existsSync } from "fs";

const POLL_INTERVAL_MS = 10_000;
const EXEC_ENV = {
  ...process.env,
  PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH ?? ""}`,
};

const COMMON_PATHS = [
  "/opt/homebrew/bin/colima",
  "/usr/local/bin/colima",
  "/usr/bin/colima",
  "/home/linuxbrew/.linuxbrew/bin/colima",
];

function resolveColimaPath(): string | null {
  const { colimaPath } =
    getPreferenceValues<Preferences.ShowColimaStatusMenuBar>();
  if (colimaPath) return colimaPath;

  try {
    const result = execFileSync("which", ["colima"], {
      timeout: 2000,
      env: EXEC_ENV,
    });
    const found = result.toString().trim();
    if (found) return found;
  } catch {
    // fall through to common paths
  }

  return COMMON_PATHS.find((p) => existsSync(p)) ?? null;
}

interface ColimaStatus {
  display_name: string;
  arch: string;
  runtime: string;
  cpu: number;
  memory: number;
  disk: number;
}

type State =
  | { type: "loading" }
  | { type: "running"; data: ColimaStatus }
  | { type: "stopped" }
  | { type: "not_found" };

function useColimaStatus() {
  const [state, setState] = useState<State>({ type: "loading" });
  const timerRef = useRef<NodeJS.Timeout>();

  const fetchStatus = useCallback(() => {
    const colimaPath = resolveColimaPath();
    if (!colimaPath) {
      setState({ type: "not_found" });
      return;
    }
    execFile(
      colimaPath,
      ["status", "--json"],
      { timeout: 5000, env: EXEC_ENV },
      (error, stdout) => {
        if (error) {
          if ("code" in error && error.code === "ENOENT") {
            setState({ type: "not_found" });
          } else {
            setState({ type: "stopped" });
          }
          return;
        }
        try {
          const data = JSON.parse(stdout) as ColimaStatus;
          setState({ type: "running", data });
        } catch {
          setState({ type: "stopped" });
        }
      },
    );
  }, []);

  useEffect(() => {
    fetchStatus();
    timerRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchStatus]);

  return { state, refresh: fetchStatus };
}

function getIcon(state: State): MenuBarExtra.Props["icon"] {
  switch (state.type) {
    case "loading":
      return { source: Icon.Circle, tintColor: Color.SecondaryText };
    case "running":
      return { source: Icon.Circle, tintColor: Color.Green };
    case "stopped":
      return { source: Icon.Circle, tintColor: Color.Red };
    case "not_found":
      return { source: Icon.Circle, tintColor: Color.SecondaryText };
  }
}

function getStatusText(state: State): string {
  switch (state.type) {
    case "loading":
      return "Loading…";
    case "running":
      return "Running";
    case "stopped":
      return "Stopped";
    case "not_found":
      return "Colima not found";
  }
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1
    ? `${gb.toFixed(1)} GB`
    : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

export default function Command() {
  const { state, refresh } = useColimaStatus();
  const runColima = useCallback((action: "start" | "stop") => {
    const colimaPath = resolveColimaPath();
    if (!colimaPath) {
      showHUD("Colima not found");
      return;
    }
    showHUD(`${action === "start" ? "Starting" : "Stopping"} Colima…`);
    const child = spawn(colimaPath, [action], {
      env: EXEC_ENV,
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  }, []);

  return (
    <MenuBarExtra
      icon={getIcon(state)}
      isLoading={state.type === "loading"}
      tooltip="Colima Status"
      onOpen={refresh}
    >
      {state.type === "not_found" ? (
        <MenuBarExtra.Item title="Colima not found" />
      ) : (
        <>
          <MenuBarExtra.Section title="Status">
            <MenuBarExtra.Item
              icon={{
                source: Icon.Circle,
                tintColor: state.type === "running" ? Color.Green : Color.Red,
              }}
              title={getStatusText(state)}
            />
          </MenuBarExtra.Section>
          {state.type === "running" && (
            <MenuBarExtra.Section title="Details">
              <MenuBarExtra.Item
                icon={Icon.Person}
                title={`Profile: ${state.data.display_name}`}
              />
              <MenuBarExtra.Item
                icon={Icon.ComputerChip}
                title={`Arch: ${state.data.arch}`}
              />
              <MenuBarExtra.Item
                icon={Icon.Box}
                title={`Runtime: ${state.data.runtime}`}
              />
              <MenuBarExtra.Item
                icon={Icon.Monitor}
                title={`CPU: ${state.data.cpu} cores`}
              />
              <MenuBarExtra.Item
                icon={Icon.MemoryChip}
                title={`Memory: ${formatBytes(state.data.memory)}`}
              />
              <MenuBarExtra.Item
                icon={Icon.HardDrive}
                title={`Disk: ${formatBytes(state.data.disk)}`}
              />
            </MenuBarExtra.Section>
          )}
          <MenuBarExtra.Section>
            {state.type === "running" ? (
              <MenuBarExtra.Item
                icon={Icon.Stop}
                title="Stop Colima"
                onAction={() => runColima("stop")}
              />
            ) : state.type === "stopped" ? (
              <MenuBarExtra.Item
                icon={Icon.Play}
                title="Start Colima"
                onAction={() => runColima("start")}
              />
            ) : null}
          </MenuBarExtra.Section>
        </>
      )}
    </MenuBarExtra>
  );
}
