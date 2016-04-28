# Plugin Documentation (working)

Current API Version: `hain-0.1.0`

## Examples

- `hain0`
  * [hain-plugin-trending](https://github.com/appetizermonster/hain-plugin-trending)
  * [hain-plugin-youtube](https://github.com/appetizermonster/hain-plugin-youtube)
  * [hain-plugin-hackernews](https://github.com/appetizermonster/hain-plugin-hackernews)
  * [hain-plugin-gif](https://github.com/Metrakit/hain-plugin-gif)
  * [hain-plugin-laravel-api](https://github.com/sewnboy/hain-plugin-laravel-api)
  * [hain-plugin-github](https://github.com/k-meissonnier/hain-plugin-github)
  * [hain-plugin-caniuse](https://github.com/Metrakit/hain-plugin-caniuse)
  * [hain-plugin-google](https://github.com/leonardosnt/hain-plugin-google)
  * [hain-plugin-google-developers-api](https://github.com/Braunson/hain-plugin-google-developers-api)
  * [hain-plugin-money](https://github.com/Metrakit/hain-plugin-money)
  * [hain-plugin-movie](https://github.com/Metrakit/hain-plugin-movie)
  * [hain-plugin-trello](https://github.com/Metrakit/hain-plugin-trello)
  * [hain-plugin-devdocs](https://github.com/Braunson/hain-plugin-devdocs)
  * [hain-plugin-amzn](https://github.com/TheBuzzDee/hain-plugin-amzn)
  * [hain-plugin-buzzpics](https://github.com/TheBuzzDee/hain-plugin-buzzpics)
  * [hain-plugin-notes](https://github.com/jervant/hain-plugin-notes)
  * [hain-plugin-steam](https://github.com/KennethWussmann/hain-plugin-steam)
  * [hain-plugin-pc](https://github.com/KennethWussmann/hain-plugin-pc)
  * [hain-plugin-shortcut](https://github.com/e-/hain-plugin-shortcut)
  * [hain-plugin-reddit](https://github.com/sethxd/hain-plugin-reddit)
  * [hain-plugin-stocks](https://github.com/sethxd/hain-plugin-stocks)
  * [hain-plugin-producthunt](https://github.com/Braunson/hain-plugin-producthunt)
  * [hain-plugin-google-play](https://github.com/Braunson/hain-plugin-google-play)
- `hain-0.1.0`
  * [hain-plugin-naverdictionary](https://github.com/appetizermonster/hain-plugin-naverdictionary)
  * [hain-plugin-best-torrent](https://github.com/kamahl19/hain-plugin-best-torrent)
  * [hain-plugin-npm](https://github.com/kamahl19/hain-plugin-npm)

## Guides

* [Plugin Directories](plugin-directories.md)
* Run your plugins
* [Share your plugins](share-your-plugins.md)

## API Reference

* [Plugin Skeleton (How to define a plugin module)](plugin-skeleton.md)
* [package.json Format](package-json-format.md)
* [preferences.json Format](preferences-json-format.md)
* [PluginContext](plugin-context.md)
  - [App](plugin-context-app.md)
  - [Toast](plugin-context-toast.md)
  - [Shell](plugin-context-shell.md)
  - [Logger](plugin-context-logger.md)
* [SearchResult](search-result.md)
* [Response (res)](response.md)
* [PreferencesObject](preferences-object.md)
* [Icon URL Format](icon-url-format.md)
* [Text Format](text-format.md)

## Very Important Notice

* You should avoid to use `console.log` in your plugin or plugin process would be break. Instead, you can use `PluginContext.Logger`. (for unknown reason)
