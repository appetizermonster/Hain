'use strict';

const appPref = require('./app-pref');
const APP_PREF_ID = 'Hain';
const appPrefItem = {
  id: APP_PREF_ID,
  group: 'Application'
};

module.exports = class PrefManager {
  constructor(workerProxy) {
    this.workerProxy = workerProxy;
    this.appPref = appPref;
  }
  getPrefItems() {
    return this.workerProxy.getPluginPrefIds()
      .then((pluginPrefIds) => {
        const pluginPrefItems = pluginPrefIds.map((id) => ({
          id,
          group: 'Plugins'
        }));
        const prefItems = [appPrefItem].concat(pluginPrefItems);
        return prefItems;
      });
  }
  getPreferences(prefId) {
    if (prefId === APP_PREF_ID)
      return this.appPref.toPrefFormat();
    return this.workerProxy.getPreferences(prefId);
  }
  updatePreferences(prefId, model) {
    if (prefId === APP_PREF_ID) {
      this.appPref.update(model);
      return;
    }
    this.workerProxy.updatePreferences(prefId, model);
  }
  resetPreferences(prefId) {
    if (prefId === APP_PREF_ID) {
      this.appPref.reset();
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
  }
};
