'use strict';

const lo_isFunction = require('lodash.isfunction');
const lo_assign = require('lodash.assign');

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const logger = require('../shared/logger');
const iconFmt = require('./utils/icon-fmt');
const conf = require('../conf');

module.exports = () => {
  function ensurePluginRepos() {
    for (const repo of conf.PLUGIN_REPOS) {
      fse.ensureDirSync(repo);
    }
  }

  function readPluginFiles() {
    ensurePluginRepos();

    let files = [];
    for (const repo of conf.PLUGIN_REPOS) {
      try {
        const _files = fs.readdirSync(repo);
        files = files.concat(_files.map((x) => path.join(repo, x)));
      } catch (e) {
        logger.error(e);
      }
    }
    return files;
  }

  function pickPluginModule(pluginFile) {
    let PluginModule = null;
    try {
      PluginModule = require(`${pluginFile}`);
    } catch (e) {
      logger.error(`error on loading: ${pluginFile}`);
      logger.error(e.stack);
    }

    if (!lo_isFunction(PluginModule)) {
      logger.error(`plugin not function: ${pluginFile}`);
      return null;
    }
    return PluginModule;
  }

  function parsePluginConfig(pluginId, pluginFile) {
    let pluginConfig = {};
    try {
      const packageJson = require(path.join(pluginFile, 'package.json'));
      const prefSchemaPath = path.join(pluginFile, 'preferences.json');
      const prefSchemaFallbackPath = path.join(pluginFile, 'preferences.js');
      let prefSchema = null;
      if (fs.existsSync(prefSchemaPath))
        prefSchema = require(prefSchemaPath);
      else if (fs.existsSync(prefSchemaFallbackPath))
        prefSchema = require(prefSchemaFallbackPath);

      const hainProps = packageJson.hain;
      if (hainProps) {
        pluginConfig = lo_assign(pluginConfig, hainProps);
        pluginConfig.path = pluginFile;
        pluginConfig.usage = pluginConfig.usage || pluginConfig.prefix;
        pluginConfig.redirect = pluginConfig.redirect || pluginConfig.prefix;
        pluginConfig.icon = iconFmt.parse(pluginFile, pluginConfig.icon);
        pluginConfig.group = pluginConfig.group || pluginId;
      }
      pluginConfig.prefSchema = prefSchema;
      pluginConfig.name = packageJson.name;
      pluginConfig.version = packageJson.version;
    } catch (e) {
      logger.error(`error on loading ${pluginId} config`);
      logger.error(e);
      return null;
    }
    return pluginConfig;
  }

  function loadPlugins(generateContextFunc) {
    const pluginFiles = readPluginFiles();

    const plugins = {};
    const pluginConfigs = {};
    for (const pluginFile of pluginFiles) {
      if (plugins[pluginFile] !== undefined) {
        logger.error(`conflict: ${pluginFile} is already loaded`);
        continue;
      }

      const PluginModule = pickPluginModule(pluginFile);
      if (PluginModule === null)
        continue;

      const pluginId = path.basename(pluginFile);
      const pluginConfig = parsePluginConfig(pluginId, pluginFile);
      if (pluginConfig === null)
        continue;

      try {
        const pluginContext = generateContextFunc(pluginId, pluginConfig);
        const pluginInstance = PluginModule(pluginContext);
        pluginInstance.__pluginContext = pluginContext;
        plugins[pluginId] = pluginInstance;
        pluginConfigs[pluginId] = pluginConfig;
        logger.debug(`${pluginId} loaded`);
      } catch (e) {
        logger.error(`${pluginId} couldn't be created: ${e.stack || e}`);
      }
    }
    return { plugins, pluginConfigs };
  }

  return { loadPlugins };
};
