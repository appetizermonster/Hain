'use strict';

const electron = require('electron');
const shell = electron.shell;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;
const windowUtil = require('./window-util');
const RpcChannel = require('../../../shared/rpc-channel');

const ipc = electron.ipcMain;

module.exports = class PrefWindow {
  constructor(prefManager) {
    this.browserWindow = null;
    this.prefManager = prefManager;
    this.rpc = RpcChannel.create(
      '#prefWindow',
      this._send.bind(this),
      this._on.bind(this)
    );
    this._setupHandlers();
  }
  _setupHandlers() {
    this.rpc.define('getPrefItems', () => {
      return this.prefManager.getPrefItems();
    });
    this.rpc.define('getPreferences', (payload) => {
      const { prefId } = payload;
      return this.prefManager.getPreferences(prefId);
    });
    this.rpc.define('updatePreferences', (payload) => {
      const { prefId, model } = payload;
      this.prefManager.updatePreferences(prefId, model);
    });
    this.rpc.define('resetPreferences', (payload) => {
      const { prefId } = payload;
      return this.prefManager.resetPreferences(prefId);
    });
  }
  show(prefId) {
    const url = this._generateUrl(prefId);
    if (this.browserWindow !== null) {
      this.browserWindow.loadURL(url);
      return;
    }
    this._createAndShow(url);
  }
  _createAndShow(url) {
    this.browserWindow = new BrowserWindow({
      width: 800,
      height: 650,
      show: false
    });
    this.browserWindow.loadURL(url);
    this.browserWindow.on('close', (evt) => {
      if (!this.prefManager.verifyPreferences()) {
        dialog.showErrorBox('Hain', 'Invalid shortcut.');
        evt.preventDefault();
      } else {
        this.prefManager.commitPreferences();
        this.browserWindow = null;
      }
    });

    this.browserWindow.webContents.on('will-navigate', (evt, _url) => {
      shell.openExternal(encodeURI(_url));
      evt.preventDefault();
    });
    this.browserWindow.setMenuBarVisibility(false);

    windowUtil.centerWindowOnSelectedScreen(this.browserWindow);
    this.browserWindow.show();
  }
  _generateUrl(prefId) {
    const baseUrl = `file://${__dirname}/../../../../dist/preferences.html`;
    if (prefId) return `${baseUrl}#${prefId}`;
    return baseUrl;
  }
  _send(channel, msg) {
    this.browserWindow.webContents.send(channel, msg);
  }
  _on(channel, listener) {
    ipc.on(channel, (evt, msg) => listener(msg));
  }
};
