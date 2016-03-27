# PluginContext.Clipboard
You can use the clipboard API in your plugins 
Clipboard object has the following functions:

* **set(text, type)**
  - `text` String - text to paste in the clipboard (**required**)
  - `type` String - indicate a type to set

  Add a text in the clipboard

* **get(type)**
  - `type` String - indicate a type to get

  Get a text from the clipboard

* **setImage(url, type)**
  - `url` String - url or local path of the image to paste in the clipboard (**required**)
  - `type` String - indicate a type to set

  Set an image in the clipboard

* **getImage(type)**
  - `type` String - indicate a type to get

  Get an image from the clipboard

* **has(data, type)**
  - `data` String - data to check in the clipboard
  - `type` String - indicate a type to check

  Returns whether the clipboard supports the format of specified data

* **has(data, type)**
  - `type` String - indicate a type to clear

  Clears the clipboard content.

**Example**
```javascript
'use strict';

module.exports = (pluginContext) => {
  const clipboard = pluginContext.clipboard;
  const toast = pluginContext.toast;
  
  ...
  
  function execute(data, payload) {
    if (...) {
      clipboard.set(data.url);
      toast.enqueue(`$(data.title) pasted to clipboard !`);
    }
  }
  
  return { startup, search, execute };
};
```

## Related Docs
* [PluginContext](plugin-context.md)
