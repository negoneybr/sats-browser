const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('sats', {
  newTab: url => ipcRenderer.invoke('tab:new', url),
  activateTab: id => ipcRenderer.invoke('tab:activate', id),
  closeTab: id => ipcRenderer.invoke('tab:close', id),
  go: url => ipcRenderer.invoke('nav:go', url),
  back: () => ipcRenderer.invoke('nav:back'),
  forward: () => ipcRenderer.invoke('nav:forward'),
  reload: () => ipcRenderer.invoke('nav:reload'),
  home: () => ipcRenderer.invoke('nav:home'),
  openExternal: url => ipcRenderer.invoke('external:open', url),
  navState: () => ipcRenderer.invoke('nav:state'),
  onTabsState: callback => ipcRenderer.on('tabs:state', (_event, state) => callback(state))
});