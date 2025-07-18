const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { exec, execSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const net = require("net");

let mainWindow;
let logWindow;

// In-memory cache for port and PID
let portData = {
  port: null,
  pid: null,
  installed: true,
  reused: false,
};

// Check if a port is available
function findAvailablePort(start, end) {
  return new Promise((resolve, reject) => {
    const check = (port) => {
      const server = net.createServer();
      server.once("error", () => {
        if (port < end) check(port + 1);
        else reject(new Error("No available ports"));
      });
      server.once("listening", () => {
        server.close(() => resolve(port));
      });
      server.listen(port);
    };
    check(start);
  });
}

// Check if server is running
function isPortServing(url) {
  return new Promise((resolve) => {
    http.get(url, () => resolve(true)).on("error", () => resolve(false));
  });
}

// Kill process by PID
function killProcess(pid) {
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /F`);
    } else {
      process.kill(pid, "SIGTERM");
    }
    return true;
  } catch {
    return false;
  }
}

// Create the log window
function createLogWindow() {
  logWindow = new BrowserWindow({
    width: 600,
    height: 300,
    resizable: false,
    icon: path.join(__dirname, "public/logo.png"),
    title: "Starting up...",
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const html = `
    <html>
      <body style="margin:0; padding:10px; font-size:14px; background:#0a0a0a; color:green; font-family:monospace;">
        <pre id="log">Launching...\n</pre>
        <script>
          require('electron').ipcRenderer.on('log', (e, msg) => {
            document.getElementById('log').textContent += msg;
          });
        </script>
      </body>
    </html>
  `;

  logWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
}

// Create the main window
function createWindow(url) {
  const { screen } = require("electron");
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    icon: path.join(__dirname, "public/logo.png"),
    autoHideMenuBar: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preloader.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(url);
  mainWindow.on("closed", () => (mainWindow = null));
  ipcMain.on("window:minimize", () => mainWindow.minimize());
  ipcMain.on("window:maximize", () => (mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()));
  ipcMain.on("window:close", () => mainWindow.close());
}

// Wait for server
function waitForNextJs(url, retries = 60, delay = 1000) {
  return new Promise((resolve, reject) => {
    const tryAgain = () => {
      http
        .get(url, () => resolve(true))
        .on("error", () => {
          if (retries <= 0) reject("Timeout waiting for Next.js.");
          else setTimeout(() => tryAgain(--retries), delay);
        });
    };
    tryAgain(); 
  });
}

// Check dependencies
function areDependenciesUpToDate(appPath) {
  const yarnLock = path.join(appPath, 'yarn.lock');
  const nodeModules = path.join(appPath, 'node_modules');

  if (!fs.existsSync(yarnLock
  ) || !fs.existsSync(nodeModules)) {
    return false;
  }

  // Ensure node_modules isn't empty
  const contents = fs.readdirSync(nodeModules).filter(
    (item) => !item.startsWith('.') && item !== '.bin'
  );

  return contents.length > 0;
}

async function startApp() {
  try {
    // ✅ Ensure Yarn is installed globally
    await new Promise((resolve, reject) => {
      exec("yarn --version", (err, stdout) => {
        if (err) {
          if (logWindow && !logWindow.isDestroyed()) logWindow?.webContents?.send("log", `🔧 Yarn not found. Installing globally...\n`);
          exec("npm install -g yarn", (installErr, installStdout, installStderr) => {
            if (installErr) {
              return reject(new Error("Failed to install yarn globally"));
            }
            if (logWindow && !logWindow.isDestroyed()) logWindow?.webContents?.send("log", installStdout || "✅ Yarn installed successfully.\n");
            return resolve();
          });
        } else {
          return resolve();
        }
      });
    });

    createLogWindow();
    const appPath = app.getAppPath();
    let port;
    let reused = false;

    const killAndLog = (pid) => {
      if (killProcess(pid)) {
        if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", `🧨 Killed stale process PID: ${pid}\n`);
      } else {
        if (logWindow && !logWindow.isDestroyed())  logWindow.webContents.send("log", `⚠️ Could not kill PID: ${pid}. It may not exist.\n`);
      }
    };

    // Check previously used port and PID
    if (portData.port && portData.pid) {
      const url = `http://localhost:${portData.port}`;

      if (await isPortServing(url)) {
        if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", `✅ Reusing running server at port ${portData.port} (PID: ${portData.pid})\n`);
        reused = true;
        logWindow.close();
        return createWindow(url);
      } else {
        if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", `⚠️ Port ${portData.port} not serving. Attempting to kill PID ${portData.pid}...\n`);
        killAndLog(portData.pid);
      }
    }

    // Find new available port
    port = await findAvailablePort(3000, 4000);
    const appUrl = `http://localhost:${port}`;
    if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", `🔍 Using new port: ${port}\n`);

    const alreadyInstalled = portData.installed === true;

    // Only install if flag is not true
    if (!alreadyInstalled) {
      if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", `📦 Installing dependencies (first time)...\n`);
      await new Promise((resolve, reject) => {
        const installer = exec("yarn install", { cwd: appPath });
        installer.stdout.on("data", d => {
          if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", d);
        });
        installer.stderr.on("data", d => {
          if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", d);
        });
        installer.on("exit", code => code === 0 ? resolve() : reject(new Error("yarn install failed")));
      });
      portData.installed = true; // Update in-memory cache
    } else {
      if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", `📁 Skipping install — already installed!\n`);
    }

    const buildIdPath = path.join(appPath, ".next", "BUILD_ID");
    if (!fs.existsSync(buildIdPath)) {
      if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", `🔨 Building Next.js app...\n`);
      await new Promise((resolve, reject) => {
        const builder = exec("yarn build", { cwd: appPath });
        builder.stdout.on("data", d => {
          if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", d);
        });
        builder.stderr.on("data", d => {
          if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", d);
        });
        builder.on("exit", code => code === 0 ? resolve() : reject(new Error("yarn build failed")));
      });
    } else {
      if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", `📦 Skipping build: Already built.\n`);
    }
    
    // Start Next.js app
    if (logWindow && !logWindow.isDestroyed())  logWindow.webContents.send("log", `🚀 Starting server on port ${port}...\n`);
    const server = exec(`yarn start -p ${port}`, { cwd: appPath });
    const newPID = server.pid;

    server.stdout.on("data", d => {
      if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", d);
    });
    server.stderr.on("data", d => {
      if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", d);
    });

    await waitForNextJs(appUrl);

    // Track port and PID in memory
    portData.port = port
    portData.pid = newPID;
    portData.reused = reused;

    logWindow.webContents.send("log", `✅ App ready at ${appUrl}\n`);
   
    if (logWindow && !logWindow.isDestroyed()) {
      logWindow.close();
    }

    createWindow(appUrl);

  } catch (err) {
    console.error("Startup failed:", err);

    const appPath = app.getAppPath();
    if (err.message && err.message.includes("production build")) {
      if (logWindow && !logWindow.isDestroyed()) {
        logWindow.webContents.send("log", `⚠️ Error: Missing production build. Attempting rebuild...\n`);
      }
      try {
        await new Promise((resolve, reject) => {
          const builder = exec("yarn build", { cwd: appPath });
          builder.stdout.on("data", d => logWindow.webContents.send("log", d));
          builder.stderr.on("data", d => logWindow.webContents.send("log", d));
          builder.on("exit", code => code === 0 ? resolve() : reject(new Error("yarn build failed")));
        });
        if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", `✅ Rebuild successful. Please relaunch the app.\n`);
      } catch (buildError) {
        if (logWindow && !logWindow.isDestroyed())  logWindow.webContents.send("log", `❌ Rebuild failed: ${buildError.message || buildError}\n`);
      }
    } else {
      if (logWindow && !logWindow.isDestroyed()) logWindow.webContents.send("log", `❌ Error: ${err.message || err}\n`);
    }

    setTimeout(() => app.quit(), 3000);
  }
}

app.whenReady().then(() => {
  startApp();
});

app.on("window-all-closed", () => {
  // Clear the in-memory cache when the app is closed
  portData = {
    port: null,
    pid: null,
    installed: true,
    reused: false,
  };
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) startApp();
});
