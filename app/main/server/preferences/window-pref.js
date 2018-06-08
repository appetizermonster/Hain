'use strict';

const PreferencesObject = require('../../shared/preferences-object');
const SimpleStore = require('../../shared/simple-store');
const conf = require('../../conf');

const windowPrefStore = new SimpleStore(conf.APP_PREF_DIR);
const windowPrefSchema = require('./window-pref-schema');

module.exports = new PreferencesObject(
  windowPrefStore,
  'hain-window',
  windowPrefSchema
);
