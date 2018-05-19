'use strict';

const electron = require('electron');
const globalShortcut = electron.globalShortcut;
const dialog = electron.dialog;

module.exports = class ShortcutService {
  constructor(appService, appPref) {
    this.appService = appService;
    this.appPref = appPref;
  }

  initialize() {
    this.updateShortcuts();

    this.appPref.on('update', this.updateShortcuts.bind(this));
  }

  updateShortcuts() {
    this.clearShortcut();
    this.registerBasicToggleShortcut();
    this.registerCustomQueryShortcuts();
  }

  registerBasicToggleShortcut() {
    const shortcut = this.appPref.get('shortcut');
    const query = this.appPref.get('clearQuery') ? '' : undefined;
    try {
      this._registerShortcut(shortcut, query);
    } catch (e) {
      dialog.showErrorBox('Hain', `Failed to register shortcut: ${shortcut}`);
    }
  }

  registerCustomQueryShortcuts() {
    const customQueryShortcuts = this.appPref.get('customQueryShortcuts') || [];
    for (const shortcutInfo of customQueryShortcuts) {
      const shortcut = shortcutInfo.shortcut;
      const query = shortcutInfo.query;
      try {
        this._registerShortcut(shortcut, query);
      } catch (e) {
        dialog.showErrorBox('Hain', `Failed to register shortcut: ${shortcut}`);
      }
    }
  }

  clearShortcut() {
    globalShortcut.unregisterAll();
  }

  _registerShortcut(shortcut, query) {
    globalShortcut.register(shortcut, () => {
      this.appService.mainWindow.toggle(query);
    });
  }
};
