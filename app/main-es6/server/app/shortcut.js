'use strict';

const electron = require('electron');
const globalShortcut = electron.globalShortcut;
const dialog = electron.dialog;

const pref = require('../pref');
const mainWindow = require('./mainwindow');

function _registerShortcut(shortcut, query) {
  globalShortcut.register(shortcut, () => {
    if (mainWindow.isContentLoading())
      return;
    mainWindow.toggleWindow();

    if (query !== undefined && mainWindow.isVisible())
      mainWindow.setQuery(query);
  });
}

function registerBasicToggleShortcut() {
  const _pref = pref.get();
  const shortcut = _pref.shortcut;
  const query = _pref.clearQuery ? '' : undefined;
  try {
    _registerShortcut(shortcut, query);
  } catch (e) {
    dialog.showErrorBox('Hain', `Failed to register shortcut: ${shortcut}`);
  }
}

function registerCustomQueryShortcuts() {
  const _pref = pref.get();
  const customQueryShortcuts = _pref.customQueryShortcuts || [];
  for (const shortcutInfo of customQueryShortcuts) {
    const shortcut = shortcutInfo.shortcut;
    const query = shortcutInfo.query;
    try {
      _registerShortcut(shortcut, query);
    } catch (e) {
      dialog.showErrorBox('Hain', `Failed to register shortcut: ${shortcut}`);
    }
  }
}

function clearShortcut() {
  globalShortcut.unregisterAll();
}

function updateShortcuts() {
  clearShortcut();
  registerBasicToggleShortcut();
  registerCustomQueryShortcuts();
}

function initializeAndRegisterShortcut() {
  updateShortcuts();
  pref.on('update', updateShortcuts);
}

module.exports = {
  initializeAndRegisterShortcut,
  clearShortcut
};
