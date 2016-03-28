'use strict';

const _ = require('lodash');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const app = require('electron').app;

module.exports = (context) => {
  const rpc = context.rpc;
  const proxyHandler = require('./server-proxyhandler')(context);

  let workerProcess = null;
  let _delayedSearch = 0;
  let isPluginsReady = false;

  function searchAll(ticket, query) {
    workerProcess.send({
      type: 'searchAll',
      args: { ticket, query }
    });
  }

  function handleWorkerMessage(msg) {
    if (msg.type === 'error') {
      const err = msg.error;
      logger.log(`Unhandled plugin Error: ${err}`);
    } else if (msg.type === 'ready') {
      isPluginsReady = true;
    } else if (msg.type === 'on-result') {
      const { ticket, type, payload } = msg.args;
      rpc.send('on-result', { ticket, type, payload });
    } else if (msg.type === 'proxy') {
      const { service, func, args } = msg.args;
      proxyHandler.handle(service, func, args);
    }
  }

  function initialize() {
    const workerPath = path.join(__dirname, '../worker/worker.js');
    if (!fs.existsSync(workerPath)) {
      throw new Error('can\'t execute plugin process');
    }
    workerProcess = cp.fork(workerPath, [], {
      silent: true
    });
    workerProcess.on('message', (msg) => {
      handleWorkerMessage(msg);
    });
    app.on('quit', () => {
      try {
        if (workerProcess)
          workerProcess.kill();
      } catch (e) { }
    });
  }

  rpc.on('search', (evt, params) => {
    const { ticket, query } = params;

    clearInterval(_delayedSearch);
    if (workerProcess === null || !workerProcess.connected) {
      logger.log('waiting plugins...');
      _delayedSearch = setInterval(() => {
        if (workerProcess !== null && workerProcess.connected) {
          searchAll(ticket, query);
          clearInterval(_delayedSearch);
        }
      }, 500);
      return;
    }
    searchAll(ticket, query);
  });

  rpc.define('execute', function* (params) {
    const { pluginId, id, payload } = params;
    workerProcess.send({
      type: 'execute',
      args: { pluginId, id, payload }
    });
  });

  rpc.define('close', function* () {
    context.app.close();
  });

  return {
    initialize,
    get isLoaded() { return (workerProcess !== null && workerProcess.connected && isPluginsReady); }
  };
};
