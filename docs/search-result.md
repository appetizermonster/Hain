# SearchResult

SearchResult is a plain object which has a following format:

* `id` Any - An identifier (recommend to be unique), used as argument of `execute` function (optional, default is `undefined`)
* `payload` Any - Extra information, used as a argument of `execute` function (optional, default is `undefined`) 
* `title` String - Title text, See [Text Format](text-format.md) (**required**)
* `desc` String - Description text, See [Text Format](text-format.md) (**required**)
* `icon` String - Icon URL, See [Icon URL Format](icon-url-format.md) (optional, default is `icon` of package.json)
* `redirect` String - Redirection query (optional, default is `undefined`)
* `group` String - Result group name (optional, default is `group` of package.json)
* `clipboard` Json - Content to paste in the clipboard (image or text) (optional, default is `undefined`)

  
SearchResult object is used as a argument for [Response](response.md) object.  
You can send SearchResult using Response object,
for example:
```javascript
function search(query, res) { // res is a Response object
  const searchResult = {
    id: 'identifier',
    payload: {},
    title: 'Hello, World',
    desc: 'Goodbye',
    group: 'Hello'
  };
  res.add(searchResult);
}
```

## Related Docs
* [Response](response.md)
