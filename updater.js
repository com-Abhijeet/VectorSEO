const { app, ipcMain, Notification } = require("electron"); 
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

function initUpdater(mainWindow) {
  // Function to send status updates to the renderer process
  const sendStatus = (status) => {
    log.info(status);
    mainWindow.webContents.send("updater:status", status);
  };

  // --- AutoUpdater Event Listeners ---
  autoUpdater.on("checking-for-update", () =>
    sendStatus({ event: "checking" })
  );
  autoUpdater.on("update-available", (info) =>
    sendStatus({ event: "available", data: info })
  );
  autoUpdater.on("update-not-available", () =>
    sendStatus({ event: "not-available" })
  );
  autoUpdater.on("error", (err) => sendStatus({ event: "error", data: err }));
  autoUpdater.on("download-progress", (progressObj) => {
    sendStatus({
      event: "downloading",
      data: { percent: progressObj.percent.toFixed(2) },
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    sendStatus({ event: "ready", data: info });

    // 2. ✅ ADD THIS BLOCK to show a native notification
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: "Update Ready to Install",
        body: `VectorSEO v${info.version} has been downloaded and will be installed on the next restart.`,
        // You can add an icon here if you have one
        // icon: path.join(__dirname, 'build/icon.png')
      });
      notification.show();
    }
  });


  // --- IPC Listeners ---
  ipcMain.handle("updater:get-version", () => app.getVersion());
  ipcMain.on("updater:check", () => autoUpdater.checkForUpdates());
  ipcMain.on("updater:install", () => autoUpdater.quitAndInstall());

  // Initial check on startup
  autoUpdater.checkForUpdates();
}

module.exports = { initUpdater };