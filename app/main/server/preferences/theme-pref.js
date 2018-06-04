'use strict';

const conf = require('../../conf');
const PreferencesObject = require('../../shared/preferences-object');
const SimpleStore = require('../../shared/simple-store');
const ThemeService = require('../app/theme-service');

const themePrefStore = new SimpleStore(conf.THEME_PREF_DIR);
const themePrefSchema = require('./theme-pref-schema');

// ensure that the user themes repo directory exists
const fse = require('fs-extra');
fse.ensureDirSync(conf.THEME_REPO);

// attempt to load all themes present in the user themes repo directory
const themeService = new ThemeService();
themeService.loadThemes();

// iterate through parsed theme objects, and add their names into an array if the theme is valid
const userThemes = [];

for (const i in themeService.userThemesObjs) {
  if (themeService.userThemesObjs[i].valid) {
    userThemes.push(themeService.userThemesObjs[i].fullName);
  }
}

// set list of loaded themes into the preferences UI control
themePrefSchema.properties.activeTheme.enum = themePrefSchema.properties.activeTheme.enum.concat(
  userThemes
);

// set "enable transparency" defaults based on platform
if (!conf.SUPPORTED_PLATFORMS_TRANSPARENCY.includes(process.platform)) {
  // if we are not on a known supported platform, set setting and UI description to more conservative (off by default) values
  themePrefSchema.properties.enableTransparency.default =
    themePrefSchema.properties.enableTransparency.default_unsupported;
  themePrefSchema.properties.enableTransparency.title =
    themePrefSchema.properties.enableTransparency.title_unsupported;
}

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
