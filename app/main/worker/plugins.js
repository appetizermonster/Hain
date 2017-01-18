/* global process */
'use strict';

const lo_isNumber = require('lodash.isnumber');
const lo_isArray = require('lodash.isarray');
const lo_assign = require('lodash.assign');
const lo_isPlainObject = require('lodash.isplainobject');
const lo_isFunction = require('lodash.isfunction');
const lo_reject = require('lodash.reject');
const lo_keys = require('lodash.keys');

const co = require('co');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const fileUtil = require('../shared/file-util');

const matchUtil = require('../shared/match-util');
const textUtil = require('../shared/text-util');
const logger = require('../shared/logger');
const iconFmt = require('./icon-fmt');
const prefStore = require('./pref-store');
const storages = require('./storages');
const PreferencesObject = require('../shared/preferences-object');

const conf = require('../conf');

function createSanitizeSearchResultFunc(pluginId, pluginConfig) {
  return (x) => {
    const defaultScore = 0.5;
    let _score = x.score;
    if (!lo_isNumber(_score))
      _score = defaultScore;
    _score = Math.max(0, Math.min(_score, 1)); // clamp01(x.score)

    const _icon = x.icon ? iconFmt.parse(pluginConfig.path, x.icon) : null;
    const _title = textUtil.sanitize(x.title);
    const _desc = textUtil.sanitize(x.desc);
    const _group = x.group;
    const _preview = x.preview;
    const sanitizedProps = {
      pluginId: pluginId,
      title: _title,
      desc: _desc,
      score: _score,
      icon: _icon || pluginConfig.icon,
      group: _group || pluginConfig.group,
      preview: _preview || false
    };
    return lo_assign(x, sanitizedProps);
  };
}

function createResponseObject(resFunc, pluginId, pluginConfig) {
  const sanitizeSearchResult = createSanitizeSearchResultFunc(pluginId, pluginConfig);
  return {
    add: (result) => {
      let searchResults = [];
      if (lo_isArray(result)) {
        searchResults = result.map(sanitizeSearchResult);
      } else if (lo_isPlainObject(result)) {
        searchResults = [sanitizeSearchResult(result)];
      } else {
        throw new Error('argument must be an array or an object');
      }
      if (searchResults.length <= 0)
        return;
      resFunc({
        type: 'add',
        payload: searchResults
      });
    },
    remove: (id) => {
      resFunc({
        type: 'remove',
        payload: { id, pluginId }
      });
    }
  };
}

function _makeIntroHelp(pluginConfig) {
  const usage = pluginConfig.usage || 'please fill usage in package.json';
  return [{
    redirect: pluginConfig.redirect,
    payload: pluginConfig.redirect,
    title: textUtil.sanitize(usage),
    desc: textUtil.sanitize(pluginConfig.name),
    icon: pluginConfig.icon,
    group: 'Plugins',
    score: Math.random()
  }];
}

function _makePrefixHelp(pluginConfig, query) {
  if (!pluginConfig.prefix) return;
  const candidates = [pluginConfig.prefix];
  const filtered = matchUtil.head(candidates, query);
  return filtered.map((x) => {
    return {
      redirect: pluginConfig.redirect,
      payload: pluginConfig.redirect,
      title: textUtil.sanitize(matchUtil.makeStringBoldHtml(x.elem, x.matches)),
      desc: textUtil.sanitize(pluginConfig.name),
      group: 'Plugin Commands',
      icon: pluginConfig.icon,
      score: 0.5
    };
  });
}

module.exports = (workerContext) => {
  const pluginLoader = require('./plugin-loader')();

  let plugins = null;
  let pluginConfigs = null;
  let pluginPrefIds = null;
  const prefObjs = {};

  const pluginContextBase = {
    // Plugin Configurations
    MAIN_PLUGIN_REPO: conf.MAIN_PLUGIN_REPO,
    DEV_PLUGIN_REPO: conf.DEV_PLUGIN_REPO,
    INTERNAL_PLUGIN_REPO: conf.INTERNAL_PLUGIN_REPO,
    __PLUGIN_PREINSTALL_DIR: conf.__PLUGIN_PREINSTALL_DIR,
    __PLUGIN_UNINSTALL_LIST_FILE: conf.__PLUGIN_UNINSTALL_LIST_FILE,
    __PLUGIN_UPDATE_LIST_FILE: conf.__PLUGIN_UPDATE_LIST_FILE,
    CURRENT_API_VERSION: conf.CURRENT_API_VERSION,
    COMPATIBLE_API_VERSIONS: conf.COMPATIBLE_API_VERSIONS,
    // Utilities
    app: workerContext.app,
    clipboard: workerContext.clipboard,
    toast: workerContext.toast,
    shell: workerContext.shell,
    logger: workerContext.logger,
    matchUtil,
    // Preferences
    globalPreferences: workerContext.globalPreferences,
    // Deprecated
    matchutil: matchUtil
  };

  function generatePluginContext(pluginId, pluginConfig) {
    const localStorage = storages.createPluginLocalStorage(pluginId);
    let preferences = undefined;

    const hasPreferences = (pluginConfig.prefSchema !== null);
    if (hasPreferences) {
      preferences = new PreferencesObject(prefStore, pluginId, pluginConfig.prefSchema);
      prefObjs[pluginId] = preferences;
    }
    return lo_assign({}, pluginContextBase, { localStorage, preferences });
  }

  function _startup() {
    logger.debug('startup: begin');
    for (const prop in plugins) {
      logger.debug(`startup: ${prop}`);
      const startupFunc = plugins[prop].startup;
      if (!lo_isFunction(startupFunc)) {
        logger.debug(`${prop}: startup property should be a Function`);
        continue;
      }
      try {
        startupFunc();
      } catch (e) {
        logger.error(e.stack || e);
      }
    }
    logger.debug('startup: end');
  }

  function removeUninstalledPlugins(listFile, removeData) {
    if (!fs.existsSync(listFile))
      return;

    try {
      const contents = fs.readFileSync(listFile, { encoding: 'utf8' });
      const targetPlugins = contents.split('\n').filter((val) => (val && val.trim().length > 0));

      for (const packageName of targetPlugins) {
        const packageDir = path.join(conf.MAIN_PLUGIN_REPO, packageName);
        fse.removeSync(packageDir);

        if (removeData) {
          const storageDir = path.join(conf.LOCAL_STORAGE_DIR, packageName);
          const prefFile = path.join(conf.PLUGIN_PREF_DIR, packageName);
          fse.removeSync(storageDir);
          fse.removeSync(prefFile);
        }

        logger.debug(`${packageName} has uninstalled successfully`);
      }
      fse.removeSync(listFile);
    } catch (e) {
      logger.error(`plugin uninstall error: ${e.stack || e}`);
    }
  }

  function movePreinstalledPlugins() {
    return co(function* () {
      const preinstallDir = conf.__PLUGIN_PREINSTALL_DIR;
      if (!fs.existsSync(preinstallDir))
        return;

      const packageDirs = fs.readdirSync(preinstallDir);
      const repoDir = conf.MAIN_PLUGIN_REPO;
      for (const packageName of packageDirs) {
        const srcPath = path.join(preinstallDir, packageName);
        const destPath = path.join(repoDir, packageName);
        yield fileUtil.move(srcPath, destPath);
        logger.debug(`${packageName} has installed successfully`);
      }
    }).catch((err) => {
      logger.error(`plugin uninstall error: ${err.stack || err}`);
    });
  }

  function* initialize() {
    removeUninstalledPlugins(conf.__PLUGIN_UNINSTALL_LIST_FILE, true);
    removeUninstalledPlugins(conf.__PLUGIN_UPDATE_LIST_FILE, false);
    yield movePreinstalledPlugins();

    const ret = pluginLoader.loadPlugins(generatePluginContext);
    plugins = ret.plugins;
    pluginConfigs = ret.pluginConfigs;
    pluginPrefIds = lo_reject(lo_keys(pluginConfigs), x => pluginConfigs[x].prefSchema === null);

    _startup();
  }

  function searchAll(query, res) {
    let sysResults = [];

    for (const prop in plugins) {
      const pluginId = prop;
      const plugin = plugins[pluginId];
      const pluginConfig = pluginConfigs[pluginId];

      if (query.length === 0) {
        const help = _makeIntroHelp(pluginConfig);
        if (help && help.length > 0)
          sysResults = sysResults.concat(help);
        continue;
      }

      let _query = query;
      const _query_lower = query.toLowerCase();
      let _prefix = pluginConfig.prefix;

      if (_prefix /* != null || != undefined */) {
        let prefix_lower = _prefix.toLowerCase();
        if (_query_lower.startsWith(prefix_lower) === false) {
          // try without leading slash
          _prefix = _prefix.replace("/", "");
          prefix_lower = _prefix.toLowerCase();
          if (_query_lower.startsWith(prefix_lower) === false) {
            const prefixHelp = _makePrefixHelp(pluginConfig, query);
            if (prefixHelp && prefixHelp.length > 0)
              sysResults = sysResults.concat(prefixHelp);
            continue;
          }
        }
        _query = _query.substring(_prefix.length);
      }

      const pluginResponse = createResponseObject(res, pluginId, pluginConfig);
      try {
        plugin.search(_query, pluginResponse);
      } catch (e) {
        logger.error(e.stack || e);
      }
    }

    // Send System-generated Results
    if (sysResults.length > 0)
      res({ type: 'add', payload: sysResults });
  }

  function execute(pluginId, id, payload) {
    if (plugins[pluginId] === undefined) {
      if (payload)
        workerContext.app.setQuery(payload);
      return;
    }

    const executeFunc = plugins[pluginId].execute;
    if (executeFunc === undefined)
      return;
    try {
      executeFunc(id, payload);
    } catch (e) {
      logger.error(e.stack || e);
    }
  }

  function renderPreview(pluginId, id, payload, render) {
    if (plugins[pluginId] === undefined)
      return;
    const renderPreviewFunc = plugins[pluginId].renderPreview;
    if (renderPreviewFunc === undefined)
      return;
    try {
      renderPreviewFunc(id, payload, render);
    } catch (e) {
      logger.error(e.stack || e);
    }
  }

  function buttonAction(pluginId, id, payload) {
    if (plugins[pluginId] === undefined)
      return;
    const buttonActionFunc = plugins[pluginId].buttonAction;
    if (buttonActionFunc === undefined)
      return;
    try {
      buttonActionFunc(id, payload);
    } catch (e) {
      logger.error(e.stack || e);
    }
  }

  function getPrefIds() {
    return pluginPrefIds;
  }

  function getPreferences(prefId) {
    const prefObj = prefObjs[prefId];
    return prefObj.toPrefFormat();
  }

  function updatePreferences(prefId, prefModel) {
    prefObjs[prefId].update(prefModel);
  }

  function commitPreferences() {
    for (const prefId in prefObjs) {
      const prefObj = prefObjs[prefId];
      prefObj.commit();
    }
  }

  function resetPreferences(prefId) {
    return prefObjs[prefId].reset();
  }

  return {
    initialize,
    searchAll,
    execute,
    renderPreview,
    buttonAction,
    getPrefIds,
    getPreferences,
    updatePreferences,
    commitPreferences,
    resetPreferences
  };
};
