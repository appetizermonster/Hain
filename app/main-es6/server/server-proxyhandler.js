'use strict';

const shell = require('electron').shell;

module.exports = (context) => {
  const proxyHandlers = {};

  function handle(service, func, args) {
    const handler = proxyHandlers[service];
    const _func = handler[func];
    _func(args);
  }

  proxyHandlers.app = {
    restart: () => context.app.restart(),
    quit: () => context.app.quit(),
    close: () => context.app.close(),
    setInput: (text) => {
      context.rpc.send('set-input', text);
    }
  };

  proxyHandlers.toast = {
    enqueue: (args) => {
      const { message, duration } = args;
      context.toast.enqueue(message, duration);
    }
  };

  proxyHandlers.clipboard = {
    get: (type) => context.clipboard.get(type),
    set: (args) => {
      const { text, type } = args;
      context.clipboard.set(text, type);
    },
    getImage: (type) => context.clipboard.getImage(type),
    setImage: (args) => {
      const { imgUrl, type } = args;
      context.clipboard.setImage(imgUrl, type);
    },
    has: (args) => {
      const { data, type } = args;
      context.clipboard.has(data, type);
    },
    clear: (type) => context.clipboard.clear(type)
  };

  proxyHandlers.shell = {
    showItemInFolder: (fullPath) => shell.showItemInFolder(fullPath),
    openItem: (fullPath) => shell.openItem(fullPath),
    openExternal: (fullPath) => shell.openExternal(fullPath)
  };

  proxyHandlers.logger = {
    log: (msg) => context.clientLogger.log(msg)
  };

  return { handle };
};
