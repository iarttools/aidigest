const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aidigest', {
  getSnapshot: () => ipcRenderer.invoke('stats:snapshot'),
  resetStats: () => ipcRenderer.invoke('stats:reset'),
  runDemo: () => ipcRenderer.invoke('demo:run'),
  getProxyStatus: () => ipcRenderer.invoke('proxy:status'),
  toggleProxy: (desired) => ipcRenderer.invoke('proxy:toggle', desired),
  getModeStatus: () => ipcRenderer.invoke('mode:status'),
  setMode: (mode) => ipcRenderer.invoke('mode:set', mode),
  detectAgents: () => ipcRenderer.invoke('agents:detect'),
  getAgentConfig: (id) => ipcRenderer.invoke('agents:config', id),
  configureAgent: (ids) => ipcRenderer.invoke('agents:configure', ids),
  onTrayMode: (handler) => ipcRenderer.on('tray:mode', (_event, mode) => handler(mode)),
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
  close: () => ipcRenderer.send('window:close'),
});

