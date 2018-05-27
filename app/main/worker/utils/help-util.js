'use strict';

const lo_shuffle = require('lodash.shuffle');

const conf = require('../../conf');

const textUtil = require('../../shared/text-util');
const matchUtil = require('../../shared/match-util');

function makeIntroHelp(pluginConfig) {
  const usage = pluginConfig.usage || 'please fill usage in package.json';
  return {
    redirect: pluginConfig.redirect,
    payload: pluginConfig.redirect,
    title: textUtil.sanitize(usage),
    desc: textUtil.sanitize(pluginConfig.name),
    icon: pluginConfig.icon,
    group: conf.PREF_GROUP_PLUGINS
  };
}

function makePrefixHelp(pluginConfig, query) {
  if (!pluginConfig.prefix) return;
  const candidates = [pluginConfig.prefix];
  const filtered = matchUtil.head(candidates, query);
  return filtered.map((x) => {
    return {
      redirect: pluginConfig.redirect,
      payload: pluginConfig.redirect,
      title: textUtil.sanitize(matchUtil.makeStringBoldHtml(x.elem, x.matches)),
      desc: textUtil.sanitize(pluginConfig.name),
      group: conf.PREF_GROUP_PLUGIN_COMMANDS,
      icon: pluginConfig.icon
    };
  });
}

function createIntroHelp(pluginConfigs) {
  const results = [];
  for (const pluginId in pluginConfigs) {
    const pluginConfig = pluginConfigs[pluginId];
    const help = makeIntroHelp(pluginConfig);
    results.push(help);
  }
  return lo_shuffle(results);
}

module.exports = {
  makePrefixHelp,
  createIntroHelp
};
