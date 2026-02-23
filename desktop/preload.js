'use strict';

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('EchoMuseDesktop', {
  isDesktop: true,
  platform: process.platform
});
