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
  _changeRequiresRestart(themePreferencesOnOpen, themePreferencesOnClose) {
    const appTransparencyChanged =
      themePreferencesOnOpen.enableTransparency !==
      themePreferencesOnClose.enableTransparency;

    let vibrancyChanged = false;
    try {
      vibrancyChanged =
        conf.SUPPORTED_PLATFORMS_VIBRANCY.includes(process.platform) &&
        this.themeService.getThemeObj(themePreferencesOnOpen.activeTheme)
          .themeObj.window.vibrancy !==
          this.themeService.getThemeObj(themePreferencesOnClose.activeTheme)
            .themeObj.window.vibrancy;
    } catch (e) {}

    return appTransparencyChanged || vibrancyChanged;
  }
  _createAndShow(url) {
    const themePreferencesOnOpen = this.prefManager.getPreferences(
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
        dialog.showErrorBox('Hain', 'Invalid shortcut.');

        return;
      }

      // check for changed settings that require a restart...
      const themePreferencesOnClose = this.prefManager.getPreferences(
        conf.THEME_PREF_ID
      ).model;

      if (
        !this._changeRequiresRestart(
          themePreferencesOnOpen,
          themePreferencesOnClose
        )
      ) {
        // ...change does not require a restart, save preferences and close
        this.prefManager.commitPreferences();
        this.browserWindow = null;

        return;
      }

      // ...change requires a restart - ask user if they would like to restart app, or cancel change
      const clickedButton = dialog.showMessageBox({
        type: 'question',
        title: 'Change transparency setting and restart?',
        message: 'Changing the transparency setting requires Hain to restart.',
        buttons: [
          'Change setting and restart',
          'Revert to previous setting',
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
        // revert setting then close pref window
        const modifiedThemePreferences = this.prefManager.getPreferences(
          conf.THEME_PREF_ID
        );
        modifiedThemePreferences.model.enableTransparency =
          themePreferencesOnOpen.enableTransparency;
        modifiedThemePreferences.model.activeTheme =
          themePreferencesOnOpen.activeTheme;

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
