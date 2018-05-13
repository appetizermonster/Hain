'use strict';

const electron = require('electron');
const shell = electron.shell;
const BrowserWindow = electron.BrowserWindow;

const platformUtil = require('../../../../native/platform-util');
const windowUtil = require('./window-util');
const RpcChannel = require('../../../shared/rpc-channel');

const ipc = electron.ipcMain;

function createWindowOptions() {
  let options = {
    width: 800,
    height: 530,
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
  };
  const isDarwin = process.platform === 'darwin';
  if (isDarwin) {
    options = {
      ...options,
      titleBarStyle: 'hidden',
      vibrancy: 'popover'
    };
  }
  return options;
}

module.exports = class MainWindow {
  constructor(workerProxy, appPref) {
    this.workerProxy = workerProxy;
    this.appPref = appPref;
    this.browserWindow = null;
    this.rpc = RpcChannel.create(
      '#mainWindow',
      this._send.bind(this),
      this._on.bind(this)
    );
    this._setupHandlers();
  }

  createWindow(onComplete) {
    const browserWindow = new BrowserWindow(createWindowOptions());
    if (onComplete) browserWindow.webContents.on('did-finish-load', onComplete);

    browserWindow.webContents.on('new-window', (evt, url) => {
      shell.openExternal(encodeURI(url));
      evt.preventDefault();
    });
    browserWindow.loadURL(`file://${__dirname}/../../../../dist/index.html`);
    browserWindow.on('blur', () => {
      if (browserWindow.webContents.isDevToolsOpened()) return;
      this.hide(true);
    });

    this.browserWindow = browserWindow;
  }

  _send(channel, msg) {
    this.browserWindow.webContents.send(channel, msg);
  }

  _on(channel, listener) {
    ipc.on(channel, (evt, msg) => listener(msg));
  }

  _setupHandlers() {
    this.rpc.define('search', (payload) => {
      const { ticket, query } = payload;
      this.workerProxy.searchAll(ticket, query);
    });
    this.rpc.define('execute', (__payload) => {
      const { context, id, payload, extra } = __payload;
      this.workerProxy.execute(context, id, payload, extra);
    });
    this.rpc.define('renderPreview', (__payload) => {
      const { ticket, context, id, payload } = __payload;
      this.workerProxy.renderPreview(ticket, context, id, payload);
    });
    this.rpc.define('buttonAction', (__payload) => {
      const { context, id, payload } = __payload;
      this.workerProxy.buttonAction(context, id, payload);
    });
    this.rpc.define('close', () => this.hide());
  }

  show(query) {
    if (this.browserWindow === null) return;

    platformUtil.saveFocus();

    if (!this.browserWindow.isVisible())
      windowUtil.centerWindowOnSelectedScreen(
        this.browserWindow,
        this.appPref.get('openOnActiveDisplay')
      );

    this.browserWindow.show();
    if (query) this.setQuery(query);
  }

  hide(dontRestoreFocus) {
    if (this.browserWindow === null) return;
    this.browserWindow.setPosition(0, -10000);
    this.browserWindow.hide();

    if (!dontRestoreFocus) platformUtil.restoreFocus();
  }

  toggle(query) {
    if (this.browserWindow === null) return;

    if (query || !this.browserWindow.isVisible()) {
      this.show();
      this.setQuery(query || '');
    } else {
      this.hide();
    }
  }

  setQuery(query) {
    if (query !== undefined) this.rpc.call('setQuery', query);
  }

  setSelectionIndex(selId) {
    this.rpc.call('setSelectionIndex', selId);
  }

  enqueueToast(message, duration) {
    this.rpc.call('enqueueToast', { message, duration });
  }

  log(msg) {
    this.rpc.call('log', msg);
  }

  requestAddResults(ticket, type, payload) {
    this.rpc.call('requestAddResults', { ticket, type, payload });
  }

  requestRenderPreview(ticket, html) {
    this.rpc.call('requestRenderPreview', { ticket, html });
  }

  notifyPluginsLoaded() {
    this.rpc.call('notifyPluginsLoaded');
  }

  notifyPluginsReloading() {
    this.rpc.call('notifyPluginsReloading');
  }

  isContentLoading() {
    return this.browserWindow.webContents.isLoading();
  }

  isVisible() {
    return this.browserWindow.isVisible();
  }
};
