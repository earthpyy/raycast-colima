import { useEffect, useState, useCallback, useRef } from "react";
import { Icon, Color, MenuBarExtra } from "@raycast/api";
import { execFile } from "child_process";

const COLIMA_PATH = "/opt/homebrew/bin/colima";
const POLL_INTERVAL_MS = 10_000;

interface ColimaStatus {
  name: string;
  status: string;
  arch: string;
  runtime: string;
  cpus: number;
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
    execFile(
      COLIMA_PATH,
      ["status", "--json"],
      { timeout: 5000 },
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

  return state;
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

export default function Command() {
  const state = useColimaStatus();

  return (
    <MenuBarExtra
      icon={getIcon(state)}
      isLoading={state.type === "loading"}
      tooltip="Colima Status"
    >
      {state.type === "not_found" ? (
        <MenuBarExtra.Item title="Colima not found" />
      ) : (
        <>
          <MenuBarExtra.Item title={`Status: ${getStatusText(state)}`} />
          {state.type === "running" && (
            <MenuBarExtra.Item title={`Profile: ${state.data.name}`} />
          )}
        </>
      )}
    </MenuBarExtra>
  );
}
