# Plugin Skeleton

Your plugin module should have a layout such as:
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

  return { startup, search, execute };
};
```

* **startup()**  
This function will be invoked on startup once.
you can do any preparations here.

* **search(query, res)**  
  - `query` String - user input
  - `res` Response - response object, See [Response](response.md)  

  This function will be invoked when user changed input text.
> **Note:** search function is ensured to be invoked once per 50ms

* **execute(id, payload)**  
  - `id` Any - id of the selected [SearchResult](search-result.md)
  - `payload` Any - payload of the selected [SearchResult](search-result.md)  

  This function will be invoked when user selected a SearchResult you send in the **search** function.


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
      desc: `<b>${query}</b>`,
      clipboard: {
        type: 'text',
        content: query
      }
    });
  }

  function execute(id, payload) {
    if (id === '1') {
      toast.enqueue(`${payload} was entered`);
    }
  }
};
```

## Related Docs
- [PluginContext](plugin-context.md)
- [SearchResult](search-result.md)
