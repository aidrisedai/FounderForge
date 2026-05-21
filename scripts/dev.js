#!/usr/bin/env node
/**
 * Wrapper that clears port 5000 before starting `next dev`.
 * Prevents EADDRINUSE crashes when the workflow restarts before
 * the previous Next.js process has fully released the port.
 */
const { execFileSync, spawn } = require("child_process");
const net = require("net");

const PORT = 5000;
const HOST = "0.0.0.0";

function tryKill() {
  try {
    execFileSync("pkill", ["-TERM", "-f", "next dev"], { stdio: "ignore" });
  } catch (_) {}
  try {
    execFileSync("pkill", ["-TERM", "-f", "next-server"], { stdio: "ignore" });
  } catch (_) {}
}

function waitForPortFree(port, host, attempts, cb) {
  if (attempts <= 0) return cb();
  const srv = net.createServer();
  srv.once("error", () => setTimeout(() => waitForPortFree(port, host, attempts - 1, cb), 300));
  srv.once("listening", () => { srv.close(); cb(); });
  srv.listen(port, host);
}

tryKill();

waitForPortFree(PORT, HOST, 25, () => {
  console.log(`> Starting Next.js on port ${PORT}`);
  const child = spawn(
    process.execPath,
    [require.resolve("next/dist/bin/next"), "dev", "-p", String(PORT), "-H", HOST],
    { stdio: "inherit", env: process.env }
  );
  child.on("exit", (code) => process.exit(code ?? 0));
  child.on("error", (err) => { console.error(err); process.exit(1); });

  function relay(sig) { try { child.kill(sig); } catch (_) {} }
  process.on("SIGTERM", () => relay("SIGTERM"));
  process.on("SIGINT",  () => relay("SIGINT"));
});
