'use strict';

const electron = require('electron');
const Tray = electron.Tray;
const Menu = electron.Menu;

const co = require('co');
const path = require('path');

module.exports = class TrayService {
  constructor(appService, autoLauncher) {
    this.tray = null;

    this.appService = appService;
    this.autoLauncher = autoLauncher;
    this.autoLaunchActivated = false;
  }
  createTray() {
    const self = this;
    return co(function*() {
      try {
        self.autoLaunchActivated = yield self.autoLauncher.isEnabled();
      } catch (e) {}
      self._createTray();
    });
  }
  _createTray() {
    const iconFile =
      process.platform === 'win32' ? 'tray_16.ico' : 'menubar.png';
    const iconPath = path.normalize(
      `${__dirname}/../../../../images/${iconFile}`
    );
    const tray = new Tray(iconPath);
    const menu = Menu.buildFromTemplate([
      {
        label: 'Hain',
        click: () => this.appService.open()
      },
      {
        type: 'separator'
      },
      {
        label: 'Preferences',
        click: () => this.appService.openPreferences()
      },
      {
        label: 'Auto-launch',
        type: 'checkbox',
        checked: this.autoLaunchActivated,
        click: () => this.toggleAutoLaunch()
      },
      {
        type: 'separator'
      },
      {
        label: 'Restart',
        click: () => this.appService.restart()
      },
      {
        label: 'Quit',
        click: () => this.appService.quit()
      }
    ]);
    tray.on('click', () => this.appService.open());
    tray.setToolTip('Hain');
    tray.setContextMenu(menu);

    this.tray = tray;
  }
  toggleAutoLaunch() {
    if (this.autoLaunchActivated) this.autoLauncher.disable();
    else this.autoLauncher.enable();
    this.autoLaunchActivated = !this.autoLaunchActivated;
  }
};
