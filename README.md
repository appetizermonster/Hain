# Hain
[![Build status](https://ci.appveyor.com/api/projects/status/l4p8r613wckaiqm6?svg=true)](https://ci.appveyor.com/project/appetizermonster/hain)
[![Build Status](https://travis-ci.org/hainproject/hain.svg)](https://travis-ci.org/hainproject/hain)
[![Join the chat at https://gitter.im/appetizermonster/hain](https://badges.gitter.im/appetizermonster/hain.svg)](https://gitter.im/appetizermonster/hain?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

An <kbd>alt</kbd>+<kbd>space</kbd> launcher for Windows, built with Electron.

I always dreamed of an alternative to Alfred on Windows, that is made with JavaScript.
so, I made it.

<p align="center">
  <img src="docs/images/demo.gif" width="600"/>
</p>

## Vision

It's a launcher with strict syntax (like terminal programs), it's not targeting to interpret natural language.  
I believe the strict syntax can provide more powerful and fast response than to interpret natural language.

## Features

* Searching Executable files very fast with Fuzzy Matching
* Plugins in Pure JavaScript

## Downloads

Go to [Releases](https://github.com/hainproject/hain/releases), then you can download prebuilt binaries.

## Usage
Run and press <kbd>alt</kbd>+<kbd>space</kbd> anywhere.

## Themes
See [THEMES.md](THEMES.md)

## How to make Plugins

See [Plugin Documentation](http://hainproject.github.io/hain/docs/)

## Install/Build from Source

```shell
# Clone this repo
git clone https://github.com/hainproject/hain.git
# Go into the repo
cd hain
# Install dependencies
npm install
```

### Run from Source

```shell
npm run dev
```

### Build for Windows

```shell
npm run build
```

### Build for Linux

```shell
npm run build-debian
```

### Build for macOS

```shell
gulp build-darwin
```

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md)

## Credits
The name "Hain" is named by Hyunseop Lee, it means "a Servant" in Korean.  
The app icon & gif are designed by Yunsung Lee.  
It uses [npmsearch.com](https://github.com/solids/npmsearch) for searching packages for now.  

## License
MIT
