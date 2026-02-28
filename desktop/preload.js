'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('EchoMuseDesktop', {
  isDesktop: true,
  platform: process.platform,
  focusWindow: () => {
    try {
      ipcRenderer.send('echomuse:focus-window');
      return true;
    } catch (_) {
      return false;
    }
  },
  confirmDialog: async (message) => {
    try {
      return await ipcRenderer.invoke('echomuse:confirm-dialog', message);
    } catch (_) {
      return false;
    }
  },
  openFileDialog: async (options) => {
    try {
      const result = await ipcRenderer.invoke('echomuse:open-file-dialog', options || {});
      return result && typeof result === 'object' ? result : { canceled: true };
    } catch (error) {
      return { canceled: true, error: String(error && error.message ? error.message : error) };
    }
  }
});
