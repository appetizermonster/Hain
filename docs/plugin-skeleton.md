# Plugin Skeleton

**Structure of Plugin Folder** 
```
hain-plugin-something
├─ package.json      - nodejs package.json (required)
├─ preferences.json  - JSONSchema preferences.json (optional)
├─ index.js          - script code (required)
└─ ...
```
 

and Your Plugin should have code such as:
```javascript
'use strict';

module.exports = (pluginContext) => {
  function startup() {
    // you can do some preparations here
  }
 
  function search(query, res) {
    // you can send your results here
  }

  function execute(id, payload) {
    // you can run something when user selected your result
  }
  
  function renderPreview(id, payload, render) {
    // you can render preview with HTML
  }

  return { startup, search, execute, renderPreview };
};
```

* **startup()** (optional)  
This function will be invoked on startup once.
you can do any preparations here.

* **search(query, res)** (required)  
  - `query` String - user input
  - `res` Response - response object, See [Response](response.md)  

  This function will be invoked when user changed input text.
> **Note:** search function is ensured to be invoked once per `30ms`

* **execute(id, payload)** (optional)  
  - `id` Any - id of the selected [SearchResult](search-result.md)
  - `payload` Any - payload of the selected [SearchResult](search-result.md)  

  This function will be invoked when user selected a SearchResult you send in the **search** function.

* **renderPreview(id, payload, render)** (optional)  
  - `id` Any - id of the selected [SearchResult](search-result.md)
  - `payload` Any - payload of the selected [SearchResult](search-result.md)
  - `render` Function - you can render html preview by calling this function

**Example**
```javascript
'use strict';

module.exports = (pluginContext) => {
  const toast = pluginContext.toast;
  const logger = pluginContext.logger;

  function startup() {
    logger.log('doing preparation');
  }

  function search(query, res) {
    res.add({
      id: '1',
      payload: query,
      title: `You entered ${query} now`,
      desc: `<b>${query}</b>`
    });
  }

  function execute(id, payload) {
    if (id === '1') {
      toast.enqueue(`${payload} was entered`);
    }
  }
  
  function renderPreview(id, payload, render) {
    render('<html><body>Something</body></html>');
  }
  
  return { startup, search, execute, renderPreview };
};
```

## Related Docs
- [package.json Format](package-json-format.md)
- [preferences.json Format](preferences-json-format.md)
- [PluginContext](plugin-context.md)
- [SearchResult](search-result.md)
