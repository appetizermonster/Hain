'use strict';

const appPref = require('./app-pref');
const themePref = require('./theme-pref');

const APP_PREF_ID = 'Hain';
const THEME_PREF_ID = 'Themes';

const appStaticPrefs = [
  {
    id: APP_PREF_ID,
    group: 'Application'
  },
  {
    id: THEME_PREF_ID,
    group: 'Application'
  }
];

module.exports = class PrefManager {
  constructor(workerProxy) {
    this.workerProxy = workerProxy;
    this.appPref = appPref;
    this.themePref = themePref;
  }
  getPrefItems() {
    return this.workerProxy.getPluginPrefIds().then((pluginPrefIds) => {
      const pluginPrefItems = pluginPrefIds.map((id) => ({
        id,
        group: 'Plugins'
      }));
      const prefItems = appStaticPrefs.concat(pluginPrefItems);
      return prefItems;
    });
  }
  getPreferences(prefId) {
    if (prefId === APP_PREF_ID) {
      return this.appPref.toPrefFormat();
    } else if (prefId === THEME_PREF_ID) {
      return this.themePref.toPrefFormat();
    }
    return this.workerProxy.getPreferences(prefId);
  }
  updatePreferences(prefId, model) {
    if (prefId === APP_PREF_ID) {
      this.appPref.update(model);
      return;
    } else if (prefId === THEME_PREF_ID) {
      this.themePref.update(model);
      return;
    }
    this.workerProxy.updatePreferences(prefId, model);
  }
  resetPreferences(prefId) {
    if (prefId === APP_PREF_ID) {
      this.appPref.reset();
      return;
    } else if (prefId === THEME_PREF_ID) {
      this.themePref.reset();
      return;
    }
    this.workerProxy.resetPreferences(prefId);
  }
  verifyPreferences() {
    return this.appPref.isValidShortcut;
  }
  commitPreferences() {
    this.workerProxy.commitPreferences();
    if (this.appPref.isDirty) {
      this.workerProxy.updateAppPreferences(this.appPref.get());
      this.appPref.commit();
    }
    if (this.themePref.isDirty) {
      this.workerProxy.updateThemePreferences(this.themePref.get());
      this.themePref.commit();
    }
  }
};
