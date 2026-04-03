import { useCallback } from "react";
import { Icon, Color, MenuBarExtra, getPreferenceValues } from "@raycast/api";
import { useColimaStatus, runColima, formatBytes, type State } from "./colima";

function getIcon(state: State): MenuBarExtra.Props["icon"] {
  switch (state.type) {
    case "running":
      return "colima-running.png";
    case "loading":
    case "stopped":
    case "not_found":
      return "colima-stopped.png";
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
  const { state, refresh } = useColimaStatus();
  const handleAction = useCallback((action: "start" | "stop") => {
    runColima(action);
  }, []);

  return (
    <MenuBarExtra
      icon={getIcon(state)}
      title={
        state.type === "running" &&
        getPreferenceValues<Preferences.ShowColimaStatusMenuBar>()
          .showMenuBarTitle
          ? `${state.data.display_name} (${state.data.runtime})`
          : undefined
      }
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
                onAction={() => handleAction("stop")}
              />
            ) : state.type === "stopped" ? (
              <MenuBarExtra.Item
                icon={Icon.Play}
                title="Start Colima"
                onAction={() => handleAction("start")}
              />
            ) : null}
          </MenuBarExtra.Section>
        </>
      )}
    </MenuBarExtra>
  );
}
