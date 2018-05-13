'use strict';

const PreferencesObject = require('../../shared/preferences-object');
const SimpleStore = require('../../shared/simple-store');
const conf = require('../../conf');

const appPrefStore = new SimpleStore(conf.APP_PREF_DIR);
const appPrefSchema = require('./app-pref-schema');

module.exports = new PreferencesObject(appPrefStore, 'hain', appPrefSchema);
