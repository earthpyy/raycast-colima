import { getPreferenceValues, showHUD } from "@raycast/api";
import { execFile, execFileSync, spawn } from "child_process";
import { existsSync } from "fs";
import { useEffect, useState, useCallback, useRef } from "react";

export const POLL_INTERVAL_MS = 10_000;
export const EXEC_ENV = {
  ...process.env,
  PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH ?? ""}`,
};

const COMMON_PATHS = [
  "/opt/homebrew/bin/colima",
  "/usr/local/bin/colima",
  "/usr/bin/colima",
  "/home/linuxbrew/.linuxbrew/bin/colima",
];

export function resolveColimaPath(): string | null {
  const { colimaPath } =
    getPreferenceValues<{ colimaPath?: string }>();
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

export interface ColimaStatus {
  display_name: string;
  arch: string;
  runtime: string;
  cpu: number;
  memory: number;
  disk: number;
}

export type State =
  | { type: "loading" }
  | { type: "running"; data: ColimaStatus }
  | { type: "stopped" }
  | { type: "not_found" };

export function useColimaStatus() {
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

export interface ColimaListEntry {
  name: string;
  status: string;
  arch: string;
  cpus: number;
  memory: number;
  disk: number;
  runtime?: string;
  address?: string;
}

export function useColimaList() {
  const [entries, setEntries] = useState<ColimaListEntry[] | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const fetchList = useCallback(() => {
    const colimaPath = resolveColimaPath();
    if (!colimaPath) {
      setEntries(null);
      return;
    }
    execFile(
      colimaPath,
      ["list", "--json"],
      { timeout: 5000, env: EXEC_ENV },
      (error, stdout) => {
        if (error) {
          setEntries(null);
          return;
        }
        try {
          const parsed = stdout
            .trim()
            .split("\n")
            .map((line) => JSON.parse(line) as ColimaListEntry);
          setEntries(parsed);
        } catch {
          setEntries(null);
        }
      },
    );
  }, []);

  useEffect(() => {
    fetchList();
    timerRef.current = setInterval(fetchList, POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchList]);

  return { entries, refresh: fetchList };
}

export function runColima(action: "start" | "stop") {
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
}
