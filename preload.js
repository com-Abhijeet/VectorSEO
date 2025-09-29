const { contextBridge, ipcRenderer } = require("electron");

// Expose a secure API to the frontend (your index.html)
contextBridge.exposeInMainWorld("electronAPI", {
  runAudit: (options) => ipcRenderer.send("run-audit", options),
  onAuditProgress: (callback) =>
    ipcRenderer.on("audit-progress", (_event, value) => callback(value)),
  onAuditComplete: (callback) =>
    ipcRenderer.on("audit-complete", (_event, value) => callback(value)),
  onAuditError: (callback) =>
    ipcRenderer.on("audit-error", (_event, value) => callback(value)),
  openPdf: (filePath) => ipcRenderer.send("open-pdf", filePath),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  getConfig: () => ipcRenderer.invoke("get-config"),
  chatSendMessage: (history) => ipcRenderer.invoke("chat:sendMessage", history),
  chatGenerateTitle: (firstMessage) =>
    ipcRenderer.invoke("chat:generateTitle", firstMessage),
  getMemory: () => ipcRenderer.invoke("memory:get"),

  removeAllListeners: () => {
    ipcRenderer.removeAllListeners("run-audit");
    ipcRenderer.removeAllListeners("audit-progress");
    ipcRenderer.removeAllListeners("audit-complete");
    ipcRenderer.removeAllListeners("audit-error");
    ipcRenderer.removeAllListeners("save-config");
    ipcRenderer.removeAllListeners("get-config");
  },
});
