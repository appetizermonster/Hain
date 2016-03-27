/* global process */
'use strict';

require('babel-polyfill');

const logger = require('../utils/logger');

function proxyFunc(srcServiceName, funcName, args) {
  process.send({
    type: 'proxy',
    args: {
      service: srcServiceName,
      func: funcName,
      args
    }
  });
}

const appProxy = {
  restart: () => proxyFunc('app', 'restart'),
  quit: () => proxyFunc('app', 'quit'),
  close: () => proxyFunc('app', 'close'),
  setInput: (text) => proxyFunc('app', 'setInput', text)
};

const toastProxy = {
  enqueue: (message, duration) => proxyFunc('toast', 'enqueue', { message, duration })
};

const shellProxy = {
  showItemInFolder: (fullPath) => proxyFunc('shell', 'showItemInFolder', fullPath),
  openItem: (fullPath) => proxyFunc('shell', 'openItem', fullPath),
  openExternal: (fullPath) => proxyFunc('shell', 'openExternal', fullPath)
};

const loggerProxy = {
  log: (msg) => proxyFunc('logger', 'log', msg)
};

const clipboardProxy = {
  get: (type = null) => proxyFunc('clipboard', 'get', type),
  set: (text, type = null) => proxyFunc('clipboard', 'set', { text, type }),
  getImage: (type = null) => proxyFunc('clipboard', 'getImage', type),
  setImage: (imgUrl, type = null) => proxyFunc('clipboard', 'setImage', { imgUrl, type }),
  has: (data = 'text', type = null) => proxyFunc('clipboard', 'has', { data, type }),
  clear: (type = null) => proxyFunc('clipboard', 'clear', type)
};

const workerContext = {
  app: appProxy,
  toast: toastProxy,
  shell: shellProxy,
  logger: loggerProxy,
  clipboard: clipboardProxy
};

let plugins = null;

function handleProcessMessage(msg) {
  if (plugins === null)
    return;

  try {
    const { type, args } = msg;
    if (type === 'searchAll') {
      const { query, ticket } = args;
      const res = (obj) => {
        process.send({
          type: 'on-result',
          args: {
            ticket,
            type: obj.type,
            payload: obj.payload
          }
        });
      };
      plugins.searchAll(query, res);
    } else if (type === 'execute') {
      const { pluginId, id, payload } = args;
      plugins.execute(pluginId, id, payload);
    }
  } catch (e) {
    const err = e.stack || e;
    process.send({ type: 'error', error: err });
    logger.log(err);
  }
}

function handleExceptions() {
  process.on('uncaughtException', (err) => {
    logger.log(err);
  });
}

try {
  handleExceptions();

  plugins = require('./plugins')(workerContext);
  plugins.initialize();

  process.on('message', handleProcessMessage);
  process.send({ type: 'ready' });
} catch (e) {
  const err = e.stack || e;
  process.send({ type: 'error', error: err });
  logger.log(err);
}
