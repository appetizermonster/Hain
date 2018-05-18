'use strict';

const lo_assign = require('lodash.assign');
const semver = require('semver');

const pkg = require('../../../package.json');
const checkForUpdate = require('./check-update');

const CONTRIBUTORS_URL =
  'https://github.com/hainproject/hain/graphs/contributors';
const NAME = 'hain-commands';

const commands = [
  {
    primaryText: 'About Hain',
    redirect: '/hain about',
    id: 'redirect_about'
  },
  {
    primaryText: 'Open Preferences',
    id: 'preferences'
  },
  {
    primaryText: 'Check for Update',
    redirect: '/hain update',
    id: 'redirect_update'
  },
  {
    primaryText: 'Reload Plugins',
    id: 'reload'
  },
  {
    primaryText: 'Restart Hain',
    id: 'restart'
  },
  {
    primaryText: 'Quit Hain',
    id: 'quit'
  }
];

module.exports = (context) => {
  const app = context.app;
  const toast = context.toast;
  const shell = context.shell;
  const indexer = context.indexer;

  function startup() {
    checkForUpdate().then((ret) => {
      const remoteVersion = ret.version;
      const isValidVersion = semver.valid(remoteVersion);
      const isNewVersion = semver.gt(remoteVersion, pkg.version);
      if (isValidVersion && isNewVersion) {
        toast.enqueue(
          'New version available! Please enter `/hain update`.',
          2500
        );
      }
    });
    registerIndexerShortcuts();
  }

  function registerIndexerShortcuts() {
    indexer.set(
      'shortcuts',
      commands.map((x) =>
        lo_assign(x, {
          secondaryText: x.redirect || NAME,
          group: 'Hain Commands'
        })
      )
    );
  }

  function search(query, res) {
    const query_lower = query.trim().toLowerCase();
    if (query_lower === 'about') return handleAbout(res);
    else if (query_lower === 'update') return handleUpdate(res);
    return handleShowHelp(res);
  }

  function handleAbout(res) {
    res.add({
      id: 'about',
      title: `Hain v${pkg.version}`,
      desc: NAME
    });
  }

  function handleUpdate(res) {
    res.add({
      id: '__temp__',
      title: 'Checking for update...',
      icon: '#fa fa-spinner fa-spin',
      desc: NAME
    });
    checkForUpdate().then(
      (ret) => {
        res.remove('__temp__');
        if (ret.version !== pkg.version) {
          return res.add({
            id: 'goUpdate',
            payload: ret.url,
            title: `There is a new version ${ret.version}`,
            desc: 'Go download page'
          });
        }
        res.add({
          title: 'There is no update',
          desc: NAME
        });
      },
      () => {
        res.remove('__temp__');
        res.add({
          title: 'Oops! Hain was unable to check for an update.',
          desc: NAME
        });
      }
    );
  }

  function handleShowHelp(res) {
    res.add(
      commands.map((x) => {
        return {
          id: x.id,
          title: x.primaryText,
          desc: x.secondaryText || NAME,
          redirect: x.redirect
        };
      })
    );
  }

  function execute(id, payload, extra) {
    const actions = {
      redirect_about: () => {
        app.setQuery('/hain about');
      },
      redirect_update: () => {
        app.setQuery('/hain update');
      },
      reload: () => {
        app.reloadPlugins();
      },
      restart: () => {
        toast.enqueue('Hain will be restarted. This will take a few seconds.');
        setTimeout(() => app.restart(), 1000);
        app.setQuery('');
      },
      quit: () => app.quit(),
      about: () => {
        shell.openExternal(CONTRIBUTORS_URL);
        app.close(true);
      },
      preferences: () => {
        app.openPreferences();
        app.close(true);
      },
      goUpdate: () => {
        shell.openExternal(payload);
        app.close();
      },
      redirect: () => app.setQuery(payload)
    };
    const func = actions[id];
    if (func !== undefined) func();
  }

  return { startup, search, execute };
};
