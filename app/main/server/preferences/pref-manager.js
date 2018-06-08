'use strict';

const conf = require('../../conf');

const appPref = require('./app-pref');
const windowPref = require('./window-pref');
const themePref = require('./theme-pref');

const appStaticPrefs = [
  {
    id: conf.APP_PREF_ID,
    group: conf.PREF_GROUP_APPLICATION
  },
  {
    id: conf.WINDOW_PREF_ID,
    group: conf.PREF_GROUP_APPLICATION
  },
  {
    id: conf.THEME_PREF_ID,
    group: conf.PREF_GROUP_APPLICATION
  }
];

module.exports = class PrefManager {
  constructor(workerProxy) {
    this.workerProxy = workerProxy;
    this.appPref = appPref;
    this.windowPref = windowPref;
    this.themePref = themePref;
  }
  getPrefItems() {
    return this.workerProxy.getPluginPrefIds().then((pluginPrefIds) => {
      const pluginPrefItems = pluginPrefIds.map((id) => ({
        id,
        group: conf.PREF_GROUP_PLUGINS
      }));
      const prefItems = appStaticPrefs.concat(pluginPrefItems);
      return prefItems;
    });
  }
  getPreferences(prefId) {
    if (prefId === conf.APP_PREF_ID) {
      return this.appPref.toPrefFormat();
    } else if (prefId === conf.WINDOW_PREF_ID) {
      return this.windowPref.toPrefFormat();
    } else if (prefId === conf.THEME_PREF_ID) {
      return this.themePref.toPrefFormat();
    }
    return this.workerProxy.getPreferences(prefId);
  }
  updatePreferences(prefId, model) {
    if (prefId === conf.APP_PREF_ID) {
      this.appPref.update(model);
      return;
    } else if (prefId === conf.WINDOW_PREF_ID) {
      this.windowPref.update(model);
      return;
    } else if (prefId === conf.THEME_PREF_ID) {
      this.themePref.update(model);
      return;
    }
    this.workerProxy.updatePreferences(prefId, model);
  }
  resetPreferences(prefId) {
    if (prefId === conf.APP_PREF_ID) {
      this.appPref.reset();
      return;
    } else if (prefId === conf.WINDOW_PREF_ID) {
      this.windowPref.reset();
      return;
    } else if (prefId === conf.THEME_PREF_ID) {
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
    if (this.windowPref.isDirty) {
      this.workerProxy.updateWindowPreferences(this.windowPref.get());
      this.windowPref.commit();
    }
    if (this.themePref.isDirty) {
      this.workerProxy.updateThemePreferences(this.themePref.get());
      this.themePref.commit();
    }
  }
};
