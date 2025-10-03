const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
// Import our backend's audit runner function
const fs = require("fs");
const dotenv = require("dotenv");
const os = require("os");
const pkg = require("./package.json");

const configDir = path.join(os.homedir(), ".config", "vectorseo");
const configPath = path.join(configDir, "config.json");

dotenv.config({ path: path.join(__dirname, "packages/backend/.env") });
console.log("ELECTRON", process.env.NODE_ENV);
const isDev = !app.isPackaged;

const { loadConfig } = require("./packages/backend/dist/config");
const { runAudit } = require("./packages/backend/dist/core/auditRunner");
const {
  readMemory,
  addPreference,
  removePreference,
} = require("./packages/backend/dist/core/memory");

const { initUpdater } = require("./updater");

const {
  handleSendMessage,
  handleGenerateTitle,
} = require("./packages/backend/dist/core/chat/chatHandler");

let config = loadConfig();

let mainWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
  });
  splashWindow.loadFile(path.join(__dirname, "splash.html"));
}

// 4. Main Application Window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Create the window hidden
    title: "Vector SEO",
    icon: path.join(__dirname, "build/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.removeMenu();

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "packages/frontend/dist/index.html")
    );
  }

  // When the main window is ready to show, close splash and show it
  mainWindow.once("ready-to-show", () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
    // Initialize the updater now that the main window is fully ready
    initUpdater(mainWindow);
  });
}

app.whenReady().then(() => {
  createSplashWindow();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("open-pdf", (event, filePath) => {
  shell
    .openPath(filePath)
    .catch((err) => console.error("Failed to open PDF:", err));
});

// --- BACKEND INTEGRATION ---
ipcMain.on("run-audit", async (event, options) => {
  // Define the progress callback for Electron
  const onProgress = (update) => {
    // Forward the update to the frontend renderer process
    event.sender.send("audit-progress", update);
  };

  try {
    const result = await runAudit({
      ...options,
      onProgress, // Pass the callback to the runner
    });
    event.sender.send("audit-complete", result);
  } catch (error) {
    event.sender.send("audit-error", error.message);
  }
});

// Listens for a request from the frontend and returns the current config object.
ipcMain.handle("get-config", async () => {
  return config;
});

ipcMain.handle("save-config", async (event, newConfig) => {
  try {
    // Ensure the directory exists before writing
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));

    // Reload the config into memory after saving
    config = loadConfig();

    return { success: true };
  } catch (error) {
    console.error("Failed to save configuration:", error);
    return { success: false, error: error.message };
  }
});

// ✅ NEW: Chat Handlers
ipcMain.handle("chat:sendMessage", (event, history) => {
  return handleSendMessage(history);
});

ipcMain.handle("chat:generateTitle", (event, firstMessage) => {
  return handleGenerateTitle(firstMessage);
});

ipcMain.handle("memory:get", () => {
  return readMemory();
});

ipcMain.handle("memory:add", (event, preference) => {
  return addPreference(preference);
});
ipcMain.handle("memory:remove", (event, preference) => {
  return removePreference(preference);
});

ipcMain.on("shell:openExternal", (event, url) => {
  // Ensure the URL is a safe http/https protocol before opening
  if (url.startsWith("http:") || url.startsWith("https:")) {
    console.log(":Opening LINK");
    shell.openExternal(url);
  }
});
