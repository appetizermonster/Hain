'use strict';

const lo_includes = require('lodash.includes');
const co = require('co');
const cp = require('child_process');

const electron = require('electron');
const electronApp = electron.app;

const MainWindow = require('./ui/main-window');
const PrefWindow = require('./ui/pref-window');
const TrayService = require('./ui/tray-service');

const firstLaunch = require('./first-launch');
const ThemeService = require('./theme-service');
const ShortcutService = require('./shortcut-service');
const iconProtocol = require('./icon-protocol');
const appIconProtocol = require('./app-icon-protocol');
const logger = require('../../shared/logger');

const AutoLauncher = require('./auto-launcher');
const autoLauncher = new AutoLauncher({
  name: 'Hain',
  path: `"${process.execPath}" --silent`
});

module.exports = class AppService {
  constructor(prefManager, workerClient, workerProxy) {
    this._isRestarting = false;

    this.prefManager = prefManager;
    this.workerClient = workerClient;
    this.workerProxy = workerProxy;

    this.themeService = new ThemeService(this, prefManager.themePref);

    this.mainWindow = new MainWindow(
      workerProxy,
      prefManager,
      this.themeService
    );
    this.prefWindow = new PrefWindow(this, prefManager, this.themeService);
    this.trayService = new TrayService(this, autoLauncher);
    this.shortcutService = new ShortcutService(this, prefManager.appPref);
  }
  initializeAndLaunch() {
    const self = this;
    return co(function*() {
      if (firstLaunch.isFirstLaunch) autoLauncher.enable();

      const isRestarted = lo_includes(process.argv, '--restarted');
      const silentLaunch =
        lo_includes(process.argv, '--silent') ||
        autoLauncher.isLaunchedAtLogin();

      const shouldQuit = electronApp.makeSingleInstance(
        (cmdLine, workingDir) => {
          if (self._isRestarting) return;
          self.mainWindow.show();
        }
      );

      if (shouldQuit && !isRestarted) return electronApp.quit();

      electronApp.on('ready', () => {
        self.themeService.initialize();
        self.shortcutService.initialize();

        self.mainWindow.createWindow(() => {
          if (!silentLaunch || isRestarted) self.mainWindow.show();
          if (isRestarted) self.mainWindow.enqueueToast('Restarted');
        });

        self.trayService.createTray();
        iconProtocol.register();
        appIconProtocol.register();
      });

      // Hide dock icon for macOS
      if (process.platform === 'darwin') electronApp.dock.hide();
    }).catch((err) => {
      logger.error(err);
    });
  }
  open(query) {
    this.mainWindow.show();
    if (query !== undefined) this.mainWindow.setQuery(query);
  }
  restart() {
    if (this._isRestarting) return;
    this._isRestarting = true;

    const argv = [].concat(process.argv);
    if (!lo_includes(argv, '--restarted')) argv.push('--restarted');
    if (!argv[0].startsWith('"')) argv[0] = `"${argv[0]}"`;

    cp.exec(argv.join(' '));
    setTimeout(() => this.quit(), 500);
  }
  quit() {
    electronApp.exit(0);
  }
  openPreferences(prefId) {
    this.prefWindow.show(prefId);
  }
  reloadPlugins() {
    this.workerClient.reload();
    this.workerProxy.initialize(this.prefManager.appPref.get());
    this.mainWindow.setQuery('');
    this.mainWindow.notifyPluginsReloading();
  }
  setSelectionIndex(selId) {
    this.mainWindow.show();
    if (selId !== undefined) this.mainWindow.setSelectionIndex(selId);
  }
};
