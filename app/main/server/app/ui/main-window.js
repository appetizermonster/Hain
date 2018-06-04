'use strict';

const electron = require('electron');
const shell = electron.shell;
const BrowserWindow = electron.BrowserWindow;

const conf = require('../../../conf');

const { ThemeObject } = require('../../../shared/theme-object');

const platformUtil = require('../../../../native/platform-util');
const windowUtil = require('./window-util');
const RpcChannel = require('../../../shared/rpc-channel');

const ipc = electron.ipcMain;

module.exports = class MainWindow {
  constructor(workerProxy, prefManager, themeService) {
    this.workerProxy = workerProxy;
    this.appPref = prefManager.appPref;
    this.themePref = prefManager.themePref;
    this.themeService = themeService;

    this.themeService.loadThemes();

    this.hasWindowShown = false;
    this.browserWindow = null;
    this.rpc = RpcChannel.create(
      '#mainWindow',
      this._send.bind(this),
      this._on.bind(this)
    );

    this._setupHandlers();
  }

  createWindow(onComplete) {
    const activeThemeObj = this.themeService.getActiveThemeObj();

    // set initial window options
    let options = {
      alwaysOnTop: true,
      center: true,
      frame: false,
      show: false,
      closable: false,
      minimizable: false,
      maximizable: false,
      moveable: false,
      resizable: false,
      skipTaskbar: true,
      transparent: activeThemeObj.themeObj.window.transparent
    };

    // if transparency is enabled, also set "vibrancy" (background window blur) for supported platforms
    if (
      activeThemeObj.themeObj.window.transparent &&
      conf.SUPPORTED_PLATFORMS_VIBRANCY.includes(process.platform)
    ) {
      // all of these options are needed to enable vibrancy on MacOS
      options = {
        ...options,
        titleBarStyle: 'hidden',
        vibrancy: activeThemeObj.themeObj.window.vibrancy
      };
    }

    // create browser window object from options defined above
    const browserWindow = new BrowserWindow(options);

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

    if (!this.hasWindowShown) {
      this.applyTheme(this.themeService.getActiveThemeObj());
      this.hasWindowShown = true;
    }

    // center the window in the middle of the screen?
    if (!this.browserWindow.isVisible())
      windowUtil.centerWindowOnSelectedScreen(
        this.browserWindow,
        this.appPref.get('openOnActiveDisplay')
      );

    // show the main Hain app window
    this.browserWindow.show();

    // if a query has been specified, set it into the input field
    if (query) this.setQuery(query);
  }

  hide(doNotRestoreFocus) {
    if (this.browserWindow === null) return;

    this.browserWindow.setPosition(0, -10000);
    this.browserWindow.hide();

    if (!doNotRestoreFocus) platformUtil.restoreFocus();
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

  applyTheme(themeObj) {
    if (this.browserWindow === null) {
      return;
    }

    this.browserWindow.setSize(
      themeObj.themeObj.window.width,
      themeObj.themeObj.window.height
    );

    // set background color?
    const windowColor = ThemeObject.determineTransparentColor(
      themeObj.themeObj,
      themeObj.themeObj.window.color,
      true
    );

    if (windowColor) {
      this.browserWindow.webContents.insertCSS(
        `html { background: ${windowColor} !important; }`
      );
    }

    // set scrollbar styling?
    if (
      typeof themeObj.themeObj.scrollbar.thickness === 'number' &&
      typeof themeObj.themeObj.scrollbar.color === 'string'
    ) {
      this.browserWindow.webContents.insertCSS(
        `::-webkit-scrollbar {
            width: ${themeObj.themeObj.scrollbar.thickness}px !important;
         }
         ::-webkit-scrollbar-track {
           background-color: #eaeaea !important;
           border-radius: ${themeObj.themeObj.scrollbar.thickness /
             2}px !important;
         }
         ::-webkit-scrollbar-thumb {
           background-color: ${themeObj.themeObj.scrollbar.color} !important;
           border-radius: ${themeObj.themeObj.scrollbar.thickness /
             2}px !important;
         }
         ::-webkit-scrollbar-thumb:hover {
           background-color: #aaa !important;
         }`
      );
    }

    this.rpc.call('applyTheme', themeObj.themeObj);
  }

  isContentLoading() {
    return this.browserWindow.webContents.isLoading();
  }

  isVisible() {
    return this.browserWindow.isVisible();
  }
};
