'use strict';

require('babel-polyfill');

((function startup() {
  if (require('electron-squirrel-startup')) return;

  // workaround for fixing auto-launch cwd problem
  const path = require('path');
  const exeName = path.basename(process.execPath);
  if (!exeName.startsWith('electron')) {
    process.chdir(path.dirname(process.execPath));
  }

  const co = require('co');
  const dialog = require('electron').dialog;
  const electronApp = require('electron').app;

  const logger = require('./utils/logger');
  process.on('uncaughtException', (err) => {
    logger.log(err);
    dialog.showErrorBox('Hain', `Unhandled Error: ${err.stack || err}`);
  });

  const appContext = {
    app: null,
    plugins: null,
    server: null,
    toast: null,
    rpc: null,
    clientLogger: null,
    clipboard: null
  };

  co(function* () {
    appContext.rpc = require('./server/rpc-server');

    appContext.toast = require('./server/toast')(appContext);
    appContext.clientLogger = require('./server/client-logger')(appContext);
    appContext.clipboard = require('./server/clipboard')(appContext);
    appContext.app = require('./server/app/app')(appContext);
    appContext.server = require('./server/server')(appContext);

    appContext.server.initialize();
  }).catch((err) => {
    dialog.showErrorBox('Hain', `Unhandled Error: ${err.stack || err}`);
    electronApp.quit();
  });
})());
