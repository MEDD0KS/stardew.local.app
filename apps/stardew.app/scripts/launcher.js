const { execSync, spawn } = require("child_process");
const path = require("path");
const { platform } = require("os");

// Parse CLI arguments: --port <n>  --save <path>  --no-browser
const args = process.argv.slice(2);
let port = process.env.PORT || 3000;
let savePath = process.env.STARDEW_SAVE_PATH || "";
let openBrowserFlag = true;
let uploadMode = false;

for (let i = 0; i < args.length; i++) {
  if ((args[i] === "--port" || args[i] === "-p") && args[i + 1]) {
    port = args[++i];
  } else if ((args[i] === "--save" || args[i] === "--save-path") && args[i + 1]) {
    savePath = args[++i];
  } else if (args[i] === "--no-browser") {
    openBrowserFlag = false;
  } else if (args[i] === "--upload-mode") {
    uploadMode = true;
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log("Usage: node launcher.js [options]");
    console.log("  --port, -p <number>       Port to listen on (default: 3000)");
    console.log("  --save, --save-path <dir> Path to the Stardew Valley save folder");
    console.log("  --upload-mode             Accept save files pushed by the Go watcher");
    console.log("  --no-browser              Do not open the browser automatically");
    process.exit(0);
  }
}

// Set working directory to where this script is
process.chdir(__dirname);

const env = { ...process.env, PORT: String(port), HOSTNAME: "0.0.0.0" };
if (savePath) env.STARDEW_SAVE_PATH = savePath;
if (uploadMode) env.UPLOAD_MODE = "1";

console.log(`Starting Stardew Tracker on port ${port}...`);
if (savePath) console.log(`Save path: ${savePath}`);
if (env.UPLOAD_MODE === "1") console.log("Upload mode: enabled (POST /api/upload-save)");

// Start the Next.js server
const server = spawn(process.execPath, [path.join(__dirname, "server.js")], {
  env,
  stdio: "inherit",
});

// Open browser after a short delay
if (openBrowserFlag) {
  setTimeout(() => {
    const url = `http://localhost:${port}`;
    console.log(`\nOpening ${url} in your browser...`);
    try {
      const cmd =
        platform() === "darwin"
          ? `open "${url}"`
          : platform() === "win32"
            ? `start "" "${url}"`
            : `xdg-open "${url}"`;
      execSync(cmd, { stdio: "ignore", shell: true });
    } catch {
      console.log(`Please open http://localhost:${port} manually.`);
    }
  }, 2000);
}

// Handle shutdown
process.on("SIGINT", () => { server.kill(); process.exit(0); });
process.on("SIGTERM", () => { server.kill(); process.exit(0); });
server.on("close", (code) => { process.exit(code || 0); });

