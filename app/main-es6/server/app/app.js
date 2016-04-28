'use strict';

const lo_includes = require('lodash.includes');
const cp = require('child_process');

const electron = require('electron');
const electronApp = electron.app;

const asyncutil = require('../../utils/asyncutil');
const logger = require('../../utils/logger');
const firstLaunch = require('./firstlaunch');
const autolaunch = require('./autolaunch');

const mainWindow = require('./mainwindow');
const prefWindow = require('./prefwindow');
const iconProtocol = require('./iconprotocol');
const toast = require('../toast');
const shortcut = require('./shortcut');

let _isRestarting = false;

function launch() {
  const server = require('../server');
  const tray = require('./tray');

  if (firstLaunch.isFirstLaunch)
    autolaunch.activate();

  const isRestarted = (lo_includes(process.argv, '--restarted'));
  const silentLaunch = (lo_includes(process.argv, '--silent'));
  const shouldQuit = electronApp.makeSingleInstance((cmdLine, workingDir) => {
    if (_isRestarting)
      return;
    mainWindow.showWindowOnCenter();
  });

  if (shouldQuit && !isRestarted) {
    electronApp.quit();
    return;
  }

  electronApp.on('ready', () => {
    tray.createTray(this).catch(err => logger.log(err));
    shortcut.initializeAndRegisterShortcut();
    mainWindow.createWindow(() => {
      if (!silentLaunch || isRestarted) {
        asyncutil.runWhen(() => (!mainWindow.isContentLoading() && server.isLoaded),
          () => {
            mainWindow.showWindowOnCenter();
          }, 100);
      }
      if (isRestarted)
        toast.enqueue('Restarted');
    });
  });

  electronApp.on('will-quit', () => {
    shortcut.clearShortcut();
  });
  iconProtocol.register();
}

function close(dontRestoreFocus) {
  mainWindow.hideAndRefreshWindow(dontRestoreFocus);
}

function restart() {
  if (_isRestarting)
    return;
  _isRestarting = true;

  shortcut.clearShortcut();

  const argv = [].concat(process.argv);
  if (!lo_includes(argv, '--restarted')) {
    argv.push('--restarted');
  }
  if (!argv[0].startsWith('"')) {
    argv[0] = `"${argv[0]}"`;
  }
  cp.exec(argv.join(' '));
  setTimeout(() => electronApp.quit(), 500);
}

function quit() {
  electronApp.quit();
}

function openPreferences() {
  prefWindow.show();
}

module.exports = {
  launch,
  close,
  restart,
  quit,
  openPreferences,
  get isRestarting() {
    return _isRestarting;
  }
};
