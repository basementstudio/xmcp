import { yellowArrow } from "@/utils/cli-icons";
import { watchdog } from "@/utils/spawn-process";
import { ChildProcess, spawn } from "child_process";

let httpServerProcess: ChildProcess | null = null;

function spawnHttpServer() {
  const process = spawn("node", ["dist/http.js"], {
    stdio: "inherit",
  });

  watchdog(process);

  return process;
}

async function killProcess(process: ChildProcess) {
  process.kill("SIGKILL");
  await new Promise((resolve) => {
    process.on("exit", resolve);
  });
}

export async function startHttpServer() {
  if (!httpServerProcess) {
    console.log(`${yellowArrow} Starting http server`);
    // first time starting the server
    httpServerProcess = spawnHttpServer();
  } else {
    console.log(`${yellowArrow} Restarting http server`);
    // restart the server
    await killProcess(httpServerProcess);
    httpServerProcess = spawnHttpServer();
  }
}
