const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld(
  'verticalSpanishDesktop',
  Object.freeze({
    isElectron: true,
    electronVersion: process.versions.electron,
    platform: process.platform,
  }),
);
