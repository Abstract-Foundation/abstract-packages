import { startCompanionServer } from "./src/server.js";

const portValue = process.env.COMPANION_PORT;
const parsedPort = portValue && /^\d+$/.test(portValue) ? Number.parseInt(portValue, 10) : 4173;

startCompanionServer({
  host: process.env.COMPANION_HOST ?? "127.0.0.1",
  port: parsedPort,
})
  .then(started => {
    process.stdout.write(`[agw-companion] running at ${started.url}\n`);
  })
  .catch(error => {
    process.stderr.write(`[agw-companion] failed to start: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
