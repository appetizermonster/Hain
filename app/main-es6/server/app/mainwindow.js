'use strict';

const electron = require('electron');
const shell = electron.shell;
const BrowserWindow = electron.BrowserWindow;

const platformUtil = require('../../../platform-util');
const rpc = require('../rpc-server');
const windowUtil = require('./windowutil');

let browserWindow = null;

function createWindow(cb) {
  browserWindow = new BrowserWindow({
    width: 800,
    height: 510,
    alwaysOnTop: true,
    center: true,
    frame: false,
    show: false,
    closable: false,
    minimizable: false,
    maximizable: false,
    moveable: false,
    resizable: false,
    skipTaskbar: true
  });

  if (cb) {
    browserWindow.webContents.on('did-finish-load', cb);
  }

  browserWindow.webContents.on('new-window', (evt, url) => {
    shell.openExternal(encodeURI(url));
    evt.preventDefault();
  });
  browserWindow.loadURL(`file://${__dirname}/../../../dist/index.html`);
  browserWindow.on('blur', () => {
    if (browserWindow.webContents.isDevToolsOpened())
      return;
    hideAndRefreshWindow(true);
  });
}

function showWindowOnCenter() {
  if (browserWindow === null)
    return;

  platformUtil.saveFocus();
  windowUtil.centerWindowOnSelectedScreen(browserWindow);
  browserWindow.show();
}

function setQuery(query) {
  rpc.send('mainwindow', 'set-query', query);
}

function hideAndRefreshWindow(dontRestoreFocus) {
  if (browserWindow === null)
    return;

  browserWindow.hide();

  if (!dontRestoreFocus) {
    platformUtil.restoreFocus();
  }
}

function toggleWindow() {
  if (browserWindow === null)
    return;

  if (browserWindow.isVisible()) {
    hideAndRefreshWindow();
  } else {
    showWindowOnCenter();
  }
}

function isContentLoading() {
  return browserWindow.webContents.isLoading();
}

function isVisible() {
  return browserWindow.isVisible();
}

module.exports = {
  createWindow,
  showWindowOnCenter,
  setQuery,
  hideAndRefreshWindow,
  toggleWindow,
  isContentLoading,
  isVisible
};
