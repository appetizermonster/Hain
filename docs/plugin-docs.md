# Plugin Documentation (working)

## Tutorials

* Hello, World
* Making Github Trending Plugin

## Examples

* [hain-plugin-trending](https://github.com/appetizermonster/hain-plugin-trending)
* [hain-plugin-youtube](https://github.com/appetizermonster/hain-plugin-youtube)
* [hain-plugin-hackernews](https://github.com/appetizermonster/hain-plugin-hackernews)
* [hain-plugin-gif](https://github.com/Metrakit/hain-plugin-gif)
* [hain-plugin-laravel-api](https://github.com/sewnboy/hain-plugin-laravel-api)
* [hain-plugin-github](https://github.com/k-meissonnier/hain-plugin-github)
* [hain-plugin-caniuse](https://github.com/Metrakit/hain-plugin-caniuse)
* [hain-plugin-google](https://github.com/leonardosnt/hain-plugin-google)
* [hain-plugin-google-developers-api](https://github.com/Braunson/hain-plugin-google-developers-api)

## Guides

* [Plugin Directories](plugin-directories.md)
* Run your plugins
* [Share your plugins](share-your-plugins.md)

## API Reference

* [Plugin Skeleton (How to define a plugin module)](plugin-skeleton.md)
* [package.json Format](package-json-format.md)
* [PluginContext](plugin-context.md)
  - [App](plugin-context-app.md)
  - [Toast](plugin-context-toast.md)
  - [Shell](plugin-context-shell.md)
  - [Logger](plugin-context-logger.md)
* [SearchResult](search-result.md)
* [Response (res)](response.md)
* [Icon URL Format](icon-url-format.md)
* [Text Format](text-format.md)

## Very Important Notice

* You should avoid to use `console.log` in your plugin or plugin process would be break. Instead, you can use `PluginContext.Logger`. (for unknown reason)
