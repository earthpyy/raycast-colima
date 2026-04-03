import { showToast, Toast } from "@raycast/api";
import { execFile, execFileSync } from "child_process";
import { resolveColimaPath, EXEC_ENV } from "./colima";

export default async function Command() {
  const colimaPath = resolveColimaPath();
  if (!colimaPath) {
    await showToast(Toast.Style.Failure, "Colima not found");
    return;
  }

  let isRunning = false;
  try {
    execFileSync(colimaPath, ["status"], { timeout: 5000, env: EXEC_ENV });
    isRunning = true;
  } catch {
    isRunning = false;
  }

  const action = isRunning ? "stop" : "start";
  const toast = await showToast(
    Toast.Style.Animated,
    `${isRunning ? "Stopping" : "Starting"} Colima…`,
  );

  await new Promise<void>((resolve, reject) => {
    execFile(colimaPath, [action], { env: EXEC_ENV }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  })
    .then(async () => {
      toast.style = Toast.Style.Success;
      toast.title = `Colima ${isRunning ? "stopped" : "started"}`;
    })
    .catch(async (error) => {
      toast.style = Toast.Style.Failure;
      toast.title = `Failed to ${action} Colima`;
      toast.message = String(error.message ?? error);
    });
}
