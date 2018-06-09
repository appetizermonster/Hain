'use strict';

const electron = require('electron');
const shell = electron.shell;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;

const conf = require('../../../conf');
const windowUtil = require('./window-util');
const RpcChannel = require('../../../shared/rpc-channel');

const ipc = electron.ipcMain;

module.exports = class PrefWindow {
  constructor(appService, prefManager, themeService) {
    this.browserWindow = null;

    this.appService = appService;
    this.prefManager = prefManager;
    this.themeService = themeService;

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
  _changeRequiresRestart(preferencesOnOpen, preferencesOnClose) {
    // window settings
    const windowDraggableChanged =
      preferencesOnOpen[conf.WINDOW_PREF_ID].windowDraggable !==
      preferencesOnClose[conf.WINDOW_PREF_ID].windowDraggable;

    const rememberWindowPositionChanged =
      preferencesOnOpen[conf.WINDOW_PREF_ID].rememberWindowPosition !==
      preferencesOnClose[conf.WINDOW_PREF_ID].rememberWindowPosition;

    // theme settings
    const appTransparencyChanged =
      preferencesOnOpen[conf.THEME_PREF_ID].enableTransparency !==
      preferencesOnClose[conf.THEME_PREF_ID].enableTransparency;

    let vibrancyChanged = false;
    try {
      vibrancyChanged =
        conf.SUPPORTED_PLATFORMS_VIBRANCY.includes(process.platform) &&
        this.themeService.getThemeObj(
          preferencesOnOpen[conf.THEME_PREF_ID].activeTheme
        ).themeObj.window.vibrancy !==
          this.themeService.getThemeObj(
            preferencesOnClose[conf.THEME_PREF_ID].activeTheme
          ).themeObj.window.vibrancy;
    } catch (e) {}

    // return true if any of the above settings have changed
    return (
      windowDraggableChanged ||
      rememberWindowPositionChanged ||
      appTransparencyChanged ||
      vibrancyChanged
    );
  }
  _createAndShow(url) {
    const preferencesOnOpen = {};
    preferencesOnOpen[conf.WINDOW_PREF_ID] = this.prefManager.getPreferences(
      conf.WINDOW_PREF_ID
    ).model;
    preferencesOnOpen[conf.THEME_PREF_ID] = this.prefManager.getPreferences(
      conf.THEME_PREF_ID
    ).model;

    this.browserWindow = new BrowserWindow({
      width: 800,
      height: 650,
      show: false
    });

    this.browserWindow.loadURL(url);

    this.browserWindow.on('close', (evt) => {
      // ensure any shortcuts entered are valid - if not, raise alert message box and do not save preferences
      if (!this.prefManager.verifyPreferences()) {
        evt.preventDefault();
        dialog.showErrorBox(conf.APP_NAME, 'Invalid shortcut.');

        return;
      }

      // check for changed settings that require a restart...
      const preferencesOnClose = {};
      preferencesOnClose[conf.WINDOW_PREF_ID] = this.prefManager.getPreferences(
        conf.WINDOW_PREF_ID
      ).model;
      preferencesOnClose[conf.THEME_PREF_ID] = this.prefManager.getPreferences(
        conf.THEME_PREF_ID
      ).model;

      if (!this._changeRequiresRestart(preferencesOnOpen, preferencesOnClose)) {
        // ...change does not require a restart, save preferences and close
        this.prefManager.commitPreferences();
        this.browserWindow = null;

        return;
      }

      // ...change requires a restart - ask user if they would like to restart app, or cancel change
      const clickedButton = dialog.showMessageBox({
        type: 'question',
        title: 'Change settings and restart?',
        message: `Changing these settings requires ${
          conf.APP_NAME
        } to restart.`,
        buttons: [
          'Change settings and restart',
          'Revert to previous settings',
          'Cancel'
        ]
      });

      if (clickedButton === 0) {
        // commit setting change, then restart app
        this.prefManager.commitPreferences();
        this.browserWindow = null;

        this.appService.restart();

        return;
      } else if (clickedButton === 1) {
        // revert window settings
        preferencesOnClose[conf.WINDOW_PREF_ID].windowDraggable =
          preferencesOnOpen[conf.WINDOW_PREF_ID].windowDraggable;

        preferencesOnClose[conf.WINDOW_PREF_ID].rememberWindowPosition =
          preferencesOnOpen[conf.WINDOW_PREF_ID].rememberWindowPosition;

        // revert theme settings
        preferencesOnClose[conf.THEME_PREF_ID].enableTransparency =
          preferencesOnOpen[conf.THEME_PREF_ID].enableTransparency;

        preferencesOnClose[conf.THEME_PREF_ID].activeTheme =
          preferencesOnOpen[conf.THEME_PREF_ID].activeTheme;

        // close pref window
        this.browserWindow = null;
        return;
      } else if (clickedButton === 2) {
        // cancel change and do not close pref window
        evt.preventDefault();
        return;
      }
    });

    this.browserWindow.webContents.on('will-navigate', (evt, _url) => {
      shell.openExternal(encodeURI(_url));
      evt.preventDefault();
    });
    this.browserWindow.setMenuBarVisibility(false);

    windowUtil.centerWindowOnScreen(this.browserWindow);
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
