'use strict';

const pkg = require('../package.json');
const path = require('path');

const applicationConfigPath = require('application-config-path');

const HAIN_USER_PATH = applicationConfigPath('hain-user');
const LOCAL_STORAGE_DIR = path.join(HAIN_USER_PATH, 'localStorages');
const PLUGIN_PREF_DIR = path.join(HAIN_USER_PATH, 'prefs', 'plugins');
const APP_PREF_DIR = path.join(HAIN_USER_PATH, 'prefs', 'app');
const THEME_PREF_DIR = path.join(HAIN_USER_PATH, 'prefs', 'theme');

const __PLUGIN_PREINSTALL_DIR = path.resolve('./pre_install');
const __PLUGIN_UNINSTALL_LIST_FILE = path.resolve('./pre_uninstall');
const __PLUGIN_UPDATE_LIST_FILE = path.resolve('./pre_update');

const INTERNAL_PLUGIN_REPO = path.join(__dirname, './plugins');
const MAIN_PLUGIN_REPO = path.resolve(`${HAIN_USER_PATH}/plugins`);
const DEV_PLUGIN_REPO = path.resolve(`${HAIN_USER_PATH}/devplugins`);
const THEME_REPO = path.resolve(`${HAIN_USER_PATH}/themes`);

const APP_PREF_ID = 'Hain';
const THEME_PREF_ID = 'Themes';

const PREF_GROUP_APPLICATION = 'Application';
const PREF_GROUP_PLUGINS = 'Plugins';
const PREF_GROUP_PLUGIN_COMMANDS = 'Plugin Commands';

const THEME_VIBRANCY_POPOVER = 'popover';
const THEME_VIBRANCY_LIGHT = 'light';
const THEME_VIBRANCY_DARK = 'dark';

const THEME_VARIANT_LIGHT = 'light';
const THEME_VARIANT_DARK = 'dark';

const DEFAULT_WINDOW_WIDTH = 800;
const DEFAULT_WINDOW_HEIGHT = 544;

// transparency and vibrancy set as distinct because vibrancy implies background blurring on top of basic transparency
const SUPPORTED_PLATFORMS_TRANSPARENCY = ['darwin'];
const SUPPORTED_PLATFORMS_VIBRANCY = ['darwin'];

const _apiVersionInfo = pkg._apiVersion;
const CURRENT_API_VERSION = _apiVersionInfo.currentVersion;
const COMPATIBLE_API_VERSIONS = [CURRENT_API_VERSION].concat(
  _apiVersionInfo.compatibleVersions
);

const PLUGIN_REPOS = [INTERNAL_PLUGIN_REPO, MAIN_PLUGIN_REPO, DEV_PLUGIN_REPO];

module.exports = {
  HAIN_USER_PATH,
  PLUGIN_PREF_DIR,
  APP_PREF_DIR,
  THEME_PREF_DIR,
  INTERNAL_PLUGIN_REPO,
  MAIN_PLUGIN_REPO,
  DEV_PLUGIN_REPO,
  THEME_REPO,
  APP_PREF_ID,
  THEME_PREF_ID,
  PREF_GROUP_APPLICATION,
  PREF_GROUP_PLUGINS,
  PREF_GROUP_PLUGIN_COMMANDS,
  THEME_VIBRANCY_POPOVER,
  THEME_VIBRANCY_LIGHT,
  THEME_VIBRANCY_DARK,
  THEME_VARIANT_LIGHT,
  THEME_VARIANT_DARK,
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  SUPPORTED_PLATFORMS_TRANSPARENCY,
  SUPPORTED_PLATFORMS_VIBRANCY,
  LOCAL_STORAGE_DIR,
  PLUGIN_REPOS,
  __PLUGIN_PREINSTALL_DIR,
  __PLUGIN_UNINSTALL_LIST_FILE,
  __PLUGIN_UPDATE_LIST_FILE,
  CURRENT_API_VERSION,
  COMPATIBLE_API_VERSIONS
};
