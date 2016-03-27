# PluginContext

PluginContext is a object which has following properties:

* `app` [App](plugin-context-app.md) - Provides functions to control the app
* `toast` [Toast](plugin-context-toast.md) - Provides toast functionality
* `shell` [Shell](plugin-context-shell.md) - Provides electron's shell commands
* `logger` [Logger](plugin-context-logger.md) - Provides logging functionality
* `clipboard` [Clipboard](plugin-context-clipboard.md) - Provides clipboard functionality

**Example**
```javascript
'use strict';

module.exports = (pluginContext) => {
  const app = pluginContext.app;
  const toast = pluginContext.toast;
  const logger = pluginContext.logger;
  const clipboard = pluginContext.clipboard;
  
  function startup() { ... }
  
  function search(query, res) { ... }
  
  function execute(id, payload) {
    if (id === '1') {
      toast.enqueue('This is message', 1500);
    } else if (id == '2') {
      app.close();
    } else if (id == '3') {
      logger.log('this is log');
    } else if (id == '4') {
      clipboard.set('Text pasted to clipboard !');
    }
  }
  
  return { startup, search, execute };
};
```

## Related Docs
* [App](plugin-context-app.md)
* [Toast](plugin-context-toast.md)
* [Shell](plugin-context-shell.md)
* [Logger](plugin-context-logger.md)
* [Clipboard](plugin-context-clipboard.md)
