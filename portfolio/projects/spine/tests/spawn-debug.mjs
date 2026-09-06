import { spawn } from "node:child_process";

const server = spawn("npm", ["run", "dev", "--", "--host", "0.0.0.0", "--port", "5232", "--strictPort"], {
  cwd: new URL("../../../shell", import.meta.url).pathname,
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
server.stdout.on("data", (d) => console.log("OUT:", d.toString().trim()));
server.stderr.on("data", (d) => console.log("ERR:", d.toString().trim()));
server.on("error", (e) => console.log("spawn error:", e.message));
server.on("exit", (c) => console.log("exit:", c));
setTimeout(() => {
  fetch("http://127.0.0.1:5232/").then((r) => { console.log("fetch:", r.status); process.kill(-server.pid); process.exit(0); }).catch((e) => { console.log("fetch fail:", e.message); process.exit(1); });
}, 15000);
