// Select a port in the range 3010–3015 and run Next.js on it
// Usage: node scripts/choose-port.js <dev|start> [extra next args]

const net = require("net");
const { spawn } = require("child_process");

const args = process.argv.slice(2);
let mode = "dev"; // default
if (args[0] === "dev" || args[0] === "start") {
  mode = args.shift();
}
const extraArgs = args; // e.g. ["--turbopack"]

const PORT_RANGE = { start: 3010, end: 3015 };
const ports = Array.from({ length: PORT_RANGE.end - PORT_RANGE.start + 1 }, (_, i) => PORT_RANGE.start + i);

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer().unref();
    tester.on("error", () => resolve(false));
    tester.listen({ port, host: "0.0.0.0" }, () => {
      tester.close(() => resolve(true));
    });
  });
}

async function findPort() {
  for (const p of ports) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortAvailable(p)) return p;
  }
  throw new Error(`No available port in range ${PORT_RANGE.start}-${PORT_RANGE.end}`);
}

(async () => {
  try {
    const port = await findPort();

    // Ensure PORT env matches selected port
    process.env.PORT = String(port);

    // Resolve Next.js binary reliably
    let nextBin;
    try {
      nextBin = require.resolve("next/dist/bin/next");
    } catch (e) {
      console.error("Failed to resolve Next.js binary. Is 'next' installed?");
      process.exit(1);
    }

    const child = spawn(process.execPath, [nextBin, mode, "-p", String(port), ...extraArgs], {
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
      } else {
        process.exit(code ?? 0);
      }
    });
  } catch (err) {
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
})();
