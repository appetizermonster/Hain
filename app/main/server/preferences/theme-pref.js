'use strict';

const PreferencesObject = require('../../shared/preferences-object');
const SimpleStore = require('../../shared/simple-store');
const ThemeService = require('../app/theme-service');
const conf = require('../../conf');

const themePrefStore = new SimpleStore(conf.THEME_PREF_DIR);
const themePrefSchema = require('./theme-pref-schema');

// ensure that the user themes repo directory exists
const fse = require('fs-extra');
fse.ensureDirSync(conf.THEME_REPO);

// attempt to load all themes present in the user themes repo directory
const themeService = new ThemeService();
themeService.loadThemes();

// set list of loaded themes into the preferences UI control
const userThemes = [];

for (const i in themeService.userThemesObjs) {
  if (themeService.userThemesObjs[i].valid) {
    userThemes.push(themeService.userThemesObjs[i].fullName);
  }
}

themePrefSchema.properties.activeTheme.enum = themePrefSchema.properties.activeTheme.enum.concat(
  userThemes
);

// prepend user themes location to field help message
themePrefSchema.properties.activeTheme.help = `Simply drop supported theme files into <code><a href="file:///${
  conf.THEME_REPO
}">${conf.THEME_REPO}</a></code><br /><br />${
  themePrefSchema.properties.activeTheme.help
}`;

module.exports = new PreferencesObject(
  themePrefStore,
  'hain-theme',
  themePrefSchema
);
