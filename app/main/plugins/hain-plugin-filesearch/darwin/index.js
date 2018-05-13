'use strict';

const fs = require('original-fs');
const co = require('co');

const fileUtil = require('./file-util');
const sharedUtil = require('../shared-util');

module.exports = (context) => {
  const logger = context.logger;
  const shell = context.shell;
  const app = context.app;
  const initialPref = context.preferences.get();
  const indexer = context.indexer;
  const toast = context.toast;

  let recursiveSearchDirs = [];
  try {
    recursiveSearchDirs = sharedUtil.injectEnvVariables(initialPref.recursiveFolders || []);
  } catch (err) {
    logger.log(err.message);
  }

  const lazyIndexingKeys = {};

  function* findFilesAndUpdateIndexer(dirs, recursive) {
    for (const dir of dirs) {
      logger.log(`try to update files in ${dir}`);
      if (fs.existsSync(dir) === false) {
        logger.log(`can't find a dir: ${dir}`);
        continue;
      }
      const files = yield fileUtil.findApplications(dir, true);
      yield updateIndexer(dir, files);
    }
  }

  function* updateIndexer(indexKey, files) {
    const indexerElements = yield filesToIndexerElements(files);
    indexer.set(indexKey, indexerElements);
    logger.log(`Indexer has updated ${indexKey}, ${files.length} files`);
  }

  function* filesToIndexerElements(files) {
    const elems = [];
    for (const file of files) {
      const appInfo = yield fileUtil.getApplicationInfo(file);
      elems.push({
        id: file,
        icon: `appicon://${encodeURI(appInfo.path)}`,
        primaryText: appInfo.name,
        secondaryText: appInfo.path,
        group: 'Applications'
      });
    }
    return elems;
  }

  function lazyRefreshIndex(dir, recursive) {
    const _lazyKey = lazyIndexingKeys[dir];
    if (_lazyKey !== undefined)
      clearTimeout(_lazyKey);

    lazyIndexingKeys[dir] = setTimeout(() => {
      co(findFilesAndUpdateIndexer([dir], recursive)).catch(logger.log);
    }, 10000);
  }

  function* setupWatchers(dirs, recursive) {
    for (const dir of dirs) {
      const _dir = dir;

      try {
        fs.watch(_dir, {
          persistent: true,
          recursive: recursive
        }, (evt, filename) => {
          lazyRefreshIndex(_dir, recursive);
        });

      } catch (err) {
        logger.log(err);
        logger.log(err.stack);
      }
    }
  }

  function startup() {
    co(function* () {
      yield* findFilesAndUpdateIndexer(recursiveSearchDirs, true);
      yield* setupWatchers(recursiveSearchDirs, true);
    }).catch((err) => {
      logger.log(err);
      logger.log(err.stack);
    });
  }

  function execute(id, payload, extra) {
    if (fs.existsSync(id) === false) {
      toast.enqueue('Sorry, Couldn\'t Find a File');
      return;
    }

    app.close();
    shell.openItem(id);
  }

  return { startup, execute };
};
