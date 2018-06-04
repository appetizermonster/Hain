'use strict';

const fs = require('fs');
const path = require('path');
const plist = require('plist');

const conf = require('../../conf');

const {
  ThemeObjectDefault,
  ThemeObjectAlfredJSON,
  ThemeObjectAlfredXML,
  ThemeObjectThemer
} = require('../../shared/theme-object');

const defaultThemeLight = new ThemeObjectDefault(conf.THEME_VARIANT_LIGHT);
const defaultThemeDark = new ThemeObjectDefault(conf.THEME_VARIANT_DARK);

class ThemeService {
  constructor(appService, themePref) {
    this.appService = appService;
    this.themePref = themePref;

    this._loaded = false;
    this.userThemesObjs = {};
  }

  initialize() {
    this.loadThemes();
    this.applyTheme();

    this.themePref.on('update', this.applyTheme.bind(this));
  }

  loadThemes() {
    if (this._loaded) {
      return;
    }

    // initially, add the default themes into the list of available user themes
    this.userThemesObjs[defaultThemeLight.fullName] = defaultThemeLight;
    this.userThemesObjs[defaultThemeDark.fullName] = defaultThemeDark;

    // for each file found in the theme repo directory, load the file contents and try to parse it into a valid
    // Alfred-compatible theme format (as used internally in Hain)...
    const _this = this;

    fs.readdirSync(conf.THEME_REPO).forEach((fileName) => {
      const filePath = path.join(conf.THEME_REPO, fileName);
      let themeObj = {};

      try {
        // read the file contents
        let fileContents = fs.readFileSync(filePath, 'utf8');

        try {
          // detect if this is an incompatible Themer "export" type file - if so, rewrite it into something that we can import
          if (
            fileContents.match(/export(\s)+(?:const?(.*))?colors(\s)*=(\s)*{/g)
          ) {
            // rewrite export statement to allow file to be require()'d
            fileContents = fileContents.replace(
              /export(\s)+(?:const?(.*))?colors(\s)*=(\s)*{/g,
              'exports.colors = {'
            );

            // write changed file contents back to the file
            try {
              fs.writeFileSync(filePath, fileContents, 'utf8');
            } catch (err) {
              console.log('[theme-service] Themer rewrite error');

              return;
            }
          }

          // detect type of JSON color scheme file...
          if (fileContents.match(/exports\.colors(\s)*=(\s)*{/g)) {
            // this is a compatible Themer export file
            try {
              themeObj = require(filePath).colors;
            } catch (err) {
              console.log('[theme-service] Themer import error');

              return;
            }

            // Themer files can contain "light", "dark", or both color schemes - ensure we have at least one of them
            if (
              typeof themeObj.light !== 'object' &&
              typeof themeObj.dark !== 'object'
            ) {
              console.log(
                `[theme-service] could not find a valid light or dark theme in ${filePath}`
              );

              return;
            }

            // Themer files can contain "light", "dark", or both color schemes - detect and parse them
            if (typeof themeObj.light === 'object') {
              _this._storeItem(
                new ThemeObjectThemer(themeObj.light, `${fileName} - Light`)
              );
            }
            if (typeof themeObj.dark === 'object') {
              _this._storeItem(
                new ThemeObjectThemer(themeObj.dark, `${fileName} - Dark`)
              );
            }
          } else {
            // this is a compatible Alfred JSON file
            _this._storeItem(
              new ThemeObjectAlfredJSON(JSON.parse(fileContents), fileName)
            );

            return;
          }
        } catch (err) {
          // file wasn't a Themer export or Alfred JSON color scheme, now try and parse Alfred XML format...
          try {
            _this._storeItem(
              new ThemeObjectAlfredXML(plist.parse(fileContents), fileName)
            );

            return;
          } catch (err) {
            console.log(
              `[theme-service] could not parse ${filePath} file as a supported color scheme format (Alfred JSON, Alfred XML, Themer exports file`
            );

            return;
          }
        }
      } catch (err) {
        console.log(`[theme-service] could not read ${filePath} file`);

        return;
      }
    });

    // set as loaded
    this._loaded = true;
  }

  _storeItem(themeObject) {
    if (themeObject.valid) {
      // extract theme values
      this.userThemesObjs[themeObject.fullName] = themeObject;
    } else {
      console.log(
        `[theme-service] could not extract ${
          themeObject.id
        } file into color scheme`
      );
    }
  }

  getActiveThemeObj() {
    return this.getThemeObj(this.themePref.get('activeTheme'));
  }

  getThemeObj(themeName) {
    let themeObj = defaultThemeLight;

    try {
      themeObj = this.userThemesObjs[themeName];
    } catch (err) {}

    // set transparency and vibrancy settings into the theme object
    themeObj.themeObj.window.transparent = this.themePref.get(
      'enableTransparency'
    );
    themeObj.themeObj.window.vibrancy = conf.THEME_VIBRANCY_POPOVER;

    // set vibrancy based on theme variant
    if (themeObj.variant === conf.THEME_VARIANT_LIGHT) {
      themeObj.themeObj.window.vibrancy = conf.THEME_VIBRANCY_LIGHT;
    } else if (themeObj.variant === conf.THEME_VARIANT_DARK) {
      themeObj.themeObj.window.vibrancy = conf.THEME_VIBRANCY_DARK;
    }

    return themeObj;
  }

  applyTheme() {
    this.appService.mainWindow.applyTheme(this.getActiveThemeObj());
  }
}

module.exports = ThemeService;
