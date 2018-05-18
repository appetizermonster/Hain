'use strict';

const co = require('co');
const lo_assign = require('lodash.assign');
const logger = require('../shared/logger');
const globalProxyAgent = require('./global-proxy-agent');
const apiProxy = require('./api-proxy');
const PreferencesObject = require('../shared/preferences-object');

const rpc = require('./rpc');

// Create local copies of app-pref and theme-pref objects
const appPrefCopy = new PreferencesObject(null, 'hain', {});
const themePrefCopy = new PreferencesObject(null, 'hain-theme', {});

const workerContext = lo_assign(
  {
    globalPreferences: appPrefCopy
  },
  apiProxy
);

let plugins = null;

function handleExceptions() {
  process.on('uncaughtException', (err) => logger.error(err));
}

rpc.define('initialize', (payload) => {
  const { appPref } = payload;
  return co(function*() {
    handleExceptions();
    appPrefCopy.update(appPref);
    globalProxyAgent.initialize(appPrefCopy);

    plugins = require('./plugins')(workerContext);
    yield* plugins.initialize();

    rpc.call('notifyPluginsLoaded');
  }).catch((e) => {
    const err = e.stack || e;
    rpc.call('onError', err);
    logger.error(err);
  });
});

rpc.define('searchAll', (payload) => {
  const { ticket, query } = payload;
  const resFunc = (obj) => {
    const resultData = {
      ticket,
      type: obj.type,
      payload: obj.payload
    };
    rpc.call('requestAddResults', resultData);
  };
  plugins.searchAll(query, resFunc);
});

rpc.define('execute', (__payload) => {
  const { context, id, payload, extra } = __payload;
  plugins.execute(context, id, payload, extra);
});

rpc.define('renderPreview', (__payload) => {
  const { ticket, context, id, payload } = __payload;
  const render = (html) => {
    const previewData = { ticket, html };
    rpc.call('requestRenderPreview', previewData);
  };
  plugins.renderPreview(context, id, payload, render);
});

rpc.define('buttonAction', (__payload) => {
  const { context, id, payload } = __payload;
  plugins.buttonAction(context, id, payload);
});

// preferences
rpc.define('getPluginPrefIds', () => {
  return plugins.getPrefIds();
});

rpc.define('getPreferences', (payload) => {
  const { prefId } = payload;
  return plugins.getPreferences(prefId);
});

rpc.define('updatePreferences', (payload) => {
  const { prefId, model } = payload;
  plugins.updatePreferences(prefId, model);
});

rpc.define('resetPreferences', (payload) => {
  const { prefId } = payload;
  plugins.resetPreferences(prefId);
});

rpc.define('commitPreferences', () => {
  plugins.commitPreferences();
});

rpc.define('updateAppPreferences', (payload) => {
  const { model } = payload;
  appPrefCopy.update(model);
});

rpc.define('updateThemePreferences', (payload) => {
  const { model } = payload;
  themePrefCopy.update(model);
});
