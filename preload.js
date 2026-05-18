const { contextBridge, ipcRenderer, shell } = require("electron");
const { version: appVersion } = require("./package.json");

contextBridge.exposeInMainWorld("electronAPI", {
  closeCurrentWindow: () => ipcRenderer.invoke("close-current-window"),
  getAppVersion: () => appVersion,
  getCredentials: () => ipcRenderer.invoke("get-credentials"),
  getVersion: () => process.versions.electron,
  onUpdate: (callback) => {
    ipcRenderer.removeAllListeners("update");
    ipcRenderer.on("update", (_event, jobs) => {
      callback(jobs);
    });
  },
  openExternal: (url) => shell.openExternal(url),
  pauseUpdateInterval: () => ipcRenderer.invoke("pause-update-interval"),
  runSelected: (selectedJobs) => ipcRenderer.invoke("run-selected", selectedJobs),
  saveCredentials: (credentials) =>
    ipcRenderer.invoke("save-credentials", credentials),
});
