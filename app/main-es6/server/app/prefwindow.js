'use strict';

const electron = require('electron');
const shell = electron.shell;
const BrowserWindow = electron.BrowserWindow;
const windowUtil = require('./windowutil');

let browserWindow = null;

function show() {
  if (browserWindow !== null)
    return;
  browserWindow = new BrowserWindow({
    width: 800,
    height: 650,
    show: false
  });
  browserWindow.loadURL(`file://${__dirname}/../../../dist/preferences.html`);
  browserWindow.on('close', () => {
    browserWindow = null;

    const server = require('../server');
    server.commitPreferences();
  });

  browserWindow.webContents.on('will-navigate', (evt, url) => {
    shell.openExternal(encodeURI(url));
    evt.preventDefault();
  });
  browserWindow.setMenuBarVisibility(false);

  windowUtil.centerWindowOnSelectedScreen(browserWindow);
  browserWindow.show();
}

module.exports = {
  show
};
