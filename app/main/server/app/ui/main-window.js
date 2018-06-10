'use strict';

const lo_debounce = require('lodash.debounce');

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
    this.windowPref = prefManager.windowPref;
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
      movable: this.windowPref.get('windowDraggable'),
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

    // process list of available displays into user-friendly list
    const displays = electron.screen.getAllDisplays();
    const displayList = [];

    for (const i in displays) {
      displayList.push([
        displays[i].id,
        `Display ${parseInt(i, 10) + 1} (${displays[i].size.width}x${
          displays[i].size.height
        })`
      ]);
    }

    // set list of available displays into the preferences UI control
    this.windowPref.schema.properties.display.properties.openOnSpecificDisplay.enum = displayList;

    // implement lock variable so that we do not attempt to save the window position when the hide event is fired (needed for MacOS)
    let doNotSavePosition = false;

    // if the window is draggable, observe window move event
    if (this.windowPref.get('windowDraggable')) {
      browserWindow.on(
        'move',
        lo_debounce((event) => {
          // refocus text input box
          this.rpc.call('handleKeyboardFocus');

          // if rememberWindowPosition is selected, observe window position changes and store in preferences
          if (
            this.windowPref.get('rememberWindowPosition') &&
            !doNotSavePosition
          ) {
            // get new window position
            const newPosition = browserWindow.getPosition();

            // if any position is less than 0 (for example when the window is hidden), do not continue
            if (Math.min(...newPosition) < 0) {
              return;
            }

            // set new position values into preferences
            this.windowPref.model.position.posX = newPosition[0];
            this.windowPref.model.position.posY = newPosition[1];

            this.windowPref.update(this.windowPref.model);
            this.windowPref.commit();
          }
        }, 200)
      );
    }

    // observe window blur event
    browserWindow.on('blur', () => {
      if (browserWindow.webContents.isDevToolsOpened()) return;

      // set lock variable
      doNotSavePosition = true;

      // hide the window
      this.hide(true);

      // reset lock variable
      setTimeout(() => {
        doNotSavePosition = false;
      }, 500);
    });

    // store internal reference to created BrowserWindow object
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

    // set window position
    if (!this.browserWindow.isVisible()) {
      const positionWindow = this.windowPref.get('position.positionWindow');

      // get openOnDisplay preference - if this is set to "specified" window, get the selected specified window ID
      let openOnDisplay = this.windowPref.get('display.openOnDisplay');
      if (openOnDisplay === 'specified') {
        openOnDisplay = this.windowPref.get('display.openOnSpecificDisplay');
      }

      if (positionWindow === 'specified') {
        // center the window in the middle of the screen
        windowUtil.positionWindowOnScreen(this.browserWindow, openOnDisplay, [
          this.windowPref.model.position.posX,
          this.windowPref.model.position.posY
        ]);
      } else {
        // set to stored previous position
        windowUtil.centerWindowOnScreen(this.browserWindow, openOnDisplay);
      }
    }

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

    let cssStr = '';

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
      cssStr += `
        html { 
          background: ${windowColor} !important; 
        }
      `;
    }

    // allow window to be draggable?
    if (this.windowPref.get('windowDraggable')) {
      cssStr += `
        body { 
          -webkit-app-region: drag;
          user-select: none;
        }
        [data-draggable="false"] { 
          -webkit-app-region: no-drag; 
        }
      `;
    }

    // set scrollbar styling?
    if (
      typeof themeObj.themeObj.scrollbar.thickness === 'number' &&
      typeof themeObj.themeObj.scrollbar.color === 'string'
    ) {
      cssStr += `
        ::-webkit-scrollbar {
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
        }
      `;
    }

    // if we have created a CSS string, set it into the window
    if (cssStr) {
      this.browserWindow.webContents.insertCSS(cssStr);
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
