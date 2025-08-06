import chalk from "chalk";
import net from "net";
import { yellowArrow } from "./cli-icons";

const checkPortAvailability = (port: number, host: string) => {
  const server = net.createServer();

  return new Promise((resolve, reject) => {
    server.once("error", (err) => {
      if ("code" in err && err.code === "EADDRINUSE") {
        // port is currently in use
        resolve(false);
      } else {
        reject(err);
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port, host);
  });
};

export async function findAvailablePort(
  startPort: number = 3001,
  host: string = "127.0.0.1"
): Promise<number> {
  return new Promise((resolve) => {
    checkPortAvailability(startPort, host).then((isAvailable) => {
      if (isAvailable) {
        resolve(startPort);
      } else {
        console.log(
          `${yellowArrow} Port ${chalk.yellow(String(startPort))} is in use, trying ${chalk.yellow(String(startPort + 1))} instead.`
        );
        findAvailablePort(startPort + 1).then(resolve);
      }
    });
  });
}
