'use strict';

const lo_find = require('lodash.find');
const lo_assign = require('lodash.assign');
const lo_reject = require('lodash.reject');
const lo_orderBy = require('lodash.orderby');

const co = require('co');
const path = require('path');
const semver = require('semver');

const Packman = require('./packman');
const searchClient = require('./search-client');
const util = require('./util');

const COMMANDS_RE = / (install|update|uninstall|list)(\s+([^\s]+))?/i;
const NAME = 'hain-package-manager (experimental)';
const PREFIX = '/hpm';

const COMMANDS = [
  `${PREFIX} install `,
  `${PREFIX} update `,
  `${PREFIX} uninstall `,
  `${PREFIX} list `
];
const CACHE_DURATION_SEC = 5 * 60; // 5 mins

module.exports = (context) => {
  const packmanOpts = {
    mainRepo: context.MAIN_PLUGIN_REPO,
    internalRepo: context.INTERNAL_PLUGIN_REPO,
    tempDir: path.resolve('./_temp'),
    installDir: context.__PLUGIN_PREINSTALL_DIR,
    uninstallListFile: context.__PLUGIN_UNINSTALL_LIST_FILE,
    updateListFile: context.__PLUGIN_UPDATE_LIST_FILE
  };
  const pm = new Packman(packmanOpts);
  const toast = context.toast;
  const logger = context.logger;
  const shell = context.shell;
  const matchUtil = context.matchUtil;
  const app = context.app;

  let fetchingStatus = 'none';
  let currentStatus = null;
  let progressTimer = 0;
  let lastUpdatedTime = 0;
  let availablePackages = [];

  function getBackendUrl() {
    return context.preferences.get('backendUrl') || 'http://npmsearch.com';
  }

  function checkAvailablePackages() {
    const elapsed = (Date.now() - lastUpdatedTime) / 1000;
    if (
      elapsed <= CACHE_DURATION_SEC ||
      fetchingStatus === 'fetching' ||
      fetchingStatus === 'error'
    ) {
      return;
    }

    fetchingStatus = 'fetching';
    searchClient
      .findCompatiblePackagesWithDownloads(
        getBackendUrl(),
        context.COMPATIBLE_API_VERSIONS
      )
      .then(
        (ret) => {
          availablePackages = ret || [];
          availablePackages = lo_orderBy(availablePackages, 'downloads', [
            'desc'
          ]);
          lastUpdatedTime = Date.now();
          fetchingStatus = 'done';
        },
        (err) => {
          fetchingStatus = 'error';
          logger.log(err);
        }
      );
  }

  function getPackageInfo(packageName) {
    return lo_find(pm.listPackages(), (x) => x.name === packageName);
  }

  function startup() {
    pm.readPackages();
    checkAvailablePackages();
  }

  function search(query, res) {
    if (currentStatus === null) checkAvailablePackages();

    clearTimeout(progressTimer);
    if (currentStatus) {
      res.add({
        id: '**',
        title: currentStatus,
        desc: NAME,
        icon: '#fa fa-spinner fa-spin'
      });
      progressTimer = setInterval(() => {
        if (!currentStatus) {
          res.remove('**');
          res.add(parseCommands(query));
          return clearTimeout(progressTimer);
        }
      }, 500);
      return;
    }
    res.add(parseCommands(query));
  }

  function _toSearchResult(cmdType, pkgInfo, customName, group) {
    const result = {
      id: pkgInfo.name,
      payload: cmdType,
      title:
        `${customName || pkgInfo.name} ` +
        ` <span style='font-size: 9pt'>${
          pkgInfo.internal ? 'internal' : pkgInfo.version
        }` +
        `${
          !pkgInfo.internal
            ? ` by <b>${util.parseAuthor(pkgInfo.author)}</b>`
            : ''
        }` +
        `</span>`,
      desc: `${pkgInfo.desc}`,
      group
    };
    if (pkgInfo.downloads !== undefined && pkgInfo.modified !== undefined)
      result.desc = `${pkgInfo.downloads} Downloads / ${pkgInfo.desc}`;
    return result;
  }

  function _toSearchResults(cmdType, packages, group) {
    return packages.map((x) => _toSearchResult(cmdType, x, undefined, group));
  }

  function _fuzzy(cmdType, packages, keyword) {
    if (keyword.length <= 0)
      return packages.map((x) => _toSearchResult(cmdType, x));
    return matchUtil.fuzzy(packages, keyword.trim(), (x) => x.name).map((x) => {
      const m = matchUtil.makeStringBoldHtml(x.elem.name, x.matches);
      return _toSearchResult(cmdType, x.elem, m);
    });
  }

  function parseCommands(query) {
    const parsed = COMMANDS_RE.exec(query.toLowerCase());
    if (!parsed) {
      return _makeCommandsHelp(query);
    }
    const command = parsed[1];
    const arg = parsed[2] || '';
    if (command === 'install') {
      if (availablePackages.length <= 0) {
        if (fetchingStatus === 'fetching') {
          return {
            title: 'Please wait, fetching available packages...',
            desc: NAME,
            icon: '#fa fa-spinner fa-spin'
          };
        } else if (fetchingStatus === 'error') {
          return {
            title: 'Error occured',
            desc: NAME,
            icon: '#fa fa-exclamation-triangle'
          };
        }
      }
      const packages = availablePackages.filter((x) => {
        return !pm.hasPackage(x.name);
      });

      // if there is a query, then return fuzzy matched results
      if (arg.length > 0) return _fuzzy('install', packages, arg);

      // split packages into newest and popular
      const newestPackages = lo_orderBy(packages, '__modified', ['desc']).slice(
        0,
        3
      );
      const newestPkgNames = newestPackages.map((x) => x.name);
      const popularPackages = lo_reject(
        packages,
        (x) => newestPkgNames.indexOf(x.name) >= 0
      );

      const popularResults = _toSearchResults(
        'install',
        popularPackages,
        'Popular'
      );
      const newestResults = _toSearchResults(
        'install',
        newestPackages,
        'Newest'
      );
      return newestResults.concat(popularResults);
    }
    if (command === 'update') {
      const packages = availablePackages
        .filter((x) => {
          const installedPackage = pm.getPackage(x.name);
          if (installedPackage === undefined) return false;
          return semver.gt(x.version, installedPackage.version);
        })
        .map((x) => {
          const org = pm.getPackage(x.name);
          const _x = lo_assign({}, x); // clone
          _x.version = `${org.version} => ${_x.version}`;
          return _x;
        });
      if (packages.length <= 0) {
        return {
          title: 'Everything is up-to-date',
          desc: NAME
        };
      }
      return _fuzzy('update', packages, arg);
    }
    if (command === 'uninstall') {
      const packages = pm.listPackages();
      return _fuzzy('uninstall', packages, arg);
    }
    if (command === 'list') {
      const packages = pm.listPackages();
      const internalPackages = pm.listInternalPackages();
      return packages
        .map((x) => _toSearchResult('list', x))
        .concat(
          internalPackages.map((x) =>
            _toSearchResult('list', x, null, 'Internal packages')
          )
        );
    }
    return _makeCommandsHelp(query);
  }

  function _makeCommandsHelp(query) {
    const ret = matchUtil.head(COMMANDS, `${PREFIX}${query}`).map((x) => {
      return {
        id: x.elem,
        payload: 'redirect',
        redirect: x.elem,
        title: matchUtil.makeStringBoldHtml(x.elem, x.matches),
        desc: NAME
      };
    });
    return ret;
  }

  function resetQuery() {
    app.setQuery(`${PREFIX} `);
  }

  function execute(id, payload, extra) {
    const funcs = {
      install: () => {
        installPackage(id);
        resetQuery();
      },
      update: () => {
        updatePackage(id);
        resetQuery();
      },
      uninstall: () => {
        uninstallPackage(id);
        resetQuery();
      },
      list: () => {
        const pkgInfo = getPackageInfo(id);
        if (pkgInfo.homepage) shell.openExternal(pkgInfo.homepage);
      },
      redirect: () => app.setQuery(id)
    };
    const func = funcs[payload];
    func();
  }

  function uninstallPackage(packageName) {
    try {
      pm.uninstallPackage(packageName);
      toast.enqueue(
        `${packageName} has been uninstalled, Reload plugins to take effect`,
        3000
      );
    } catch (e) {
      toast.enqueue(e.toString());
    }
  }

  function installPackage(packageName) {
    co(function*() {
      logger.log(`Installing ${packageName}`);
      currentStatus = `Installing <b>${packageName}</b>`;
      try {
        yield pm.installPackage(packageName, 'latest');
        toast.enqueue(
          `${packageName} has been installed, Reload plugins to take effect`,
          3000
        );
        logger.log(`${packageName} has been pre-installed`);
      } catch (e) {
        toast.enqueue(e.toString());
        logger.log(`${packageName} ${e}`);
        throw e;
      } finally {
        currentStatus = null;
      }
    });
  }

  function updatePackage(packageName) {
    co(function*() {
      logger.log(`Updating ${packageName}`);
      currentStatus = `Updating <b>${packageName}</b>`;
      try {
        pm.uninstallPackageForUpdate(packageName);
        yield pm.installPackage(packageName, 'latest');
        toast.enqueue(
          `${packageName} has been updated, Reload plugins to take effect`,
          3000
        );
        logger.log(`${packageName} has been pre-installed (for update)`);
      } catch (e) {
        toast.enqueue(e.toString());
        logger.log(`${packageName} ${e}`);
        throw e;
      } finally {
        currentStatus = null;
      }
    });
  }

  return { startup, search, execute };
};
