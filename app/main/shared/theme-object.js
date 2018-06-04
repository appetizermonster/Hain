'use strict';

const tinycolor = require('tinycolor2');

const conf = require('../conf');

const defaultThemeLight = {
  name: 'Hain Light',
  credit: 'dannya',

  result: {
    textSpacing: 6,
    subtext: {
      size: 13,
      colorSelected: '#5E5E5E',
      font: '"Roboto", sans-serif',
      color: '#757575'
    },
    shortcut: {
      size: 16,
      colorSelected: '',
      font: '',
      color: ''
    },
    backgroundSelected: 'rgba(0, 0, 0, 0.2)',
    text: {
      size: 18,
      colorSelected: '#272727',
      font: '"Roboto", sans-serif',
      color: '#212121'
    },
    iconPaddingHorizontal: 6,
    paddingVertical: 6,
    iconSize: 40
  },
  search: {
    paddingVertical: 8,
    background: '#ffffff',
    spacing: 6,
    text: {
      size: 22,
      colorSelected: '',
      font: '"Roboto", sans-serif',
      color: '#000000'
    },
    backgroundSelected: ''
  },
  window: {
    color: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    width: conf.DEFAULT_WINDOW_WIDTH,
    height: conf.DEFAULT_WINDOW_HEIGHT,
    borderPadding: 0,
    borderColor: '',
    blur: 15,
    roundness: 2,
    paddingVertical: 10
  },
  separator: {
    color: '#00BCD4',
    thickness: 0
  },
  scrollbar: {
    color: '#CCCCCC',
    thickness: 10
  }
};

const defaultThemeDark = {
  name: 'Hain Dark',
  credit: 'dannya',

  result: {
    textSpacing: 6,
    subtext: {
      size: 13,
      colorSelected: '#f3f3f3',
      font: '"Roboto", sans-serif',
      color: '#cccccc'
    },
    shortcut: {
      size: 16,
      colorSelected: '',
      font: '',
      color: ''
    },
    backgroundSelected: 'rgba(255, 255, 255, 0.2)',
    text: {
      size: 18,
      colorSelected: '#f3f3f3',
      font: '"Roboto", sans-serif',
      color: '#e6e6e6'
    },
    iconPaddingHorizontal: 6,
    paddingVertical: 6,
    iconSize: 40
  },
  search: {
    paddingVertical: 8,
    background: '#000000',
    spacing: 6,
    text: {
      size: 22,
      colorSelected: '',
      font: '"Roboto", sans-serif',
      color: '#f3f3f3'
    },
    backgroundSelected: ''
  },
  window: {
    color: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    width: conf.DEFAULT_WINDOW_WIDTH,
    height: conf.DEFAULT_WINDOW_HEIGHT,
    borderPadding: 0,
    borderColor: '',
    blur: 15,
    roundness: 2,
    paddingVertical: 10
  },
  separator: {
    color: '#00BCD4',
    thickness: 0
  },
  scrollbar: {
    color: '#CCCCCC',
    thickness: 10
  }
};

class ThemeObject {
  init(themeObj = {}, isValid = true) {
    this.themeObj = themeObj;
    this._isValid = isValid;

    // set window width / height values if undefined
    this.themeObj.window = this.themeObj.window || {};
    this.themeObj.window.width =
      parseInt(this.themeObj.window.width, 10) ||
      defaultThemeLight.window.width;
    this.themeObj.window.height =
      parseInt(this.themeObj.window.height, 10) ||
      defaultThemeLight.window.height;

    // process color and font values
    this.processThemeObj();
  }

  set id(id) {
    this._themeId = id.replace(' ', '_');
  }

  get id() {
    return this._themeId;
  }

  set name(name) {
    this._name = name;
  }

  get name() {
    return this._name;
  }

  set fullName(fullName) {
    this._fullName = fullName;
  }

  get fullName() {
    return this._fullName;
  }

  set variant(variant) {
    this._variant = variant;
  }

  get variant() {
    if (!this._variant) {
      this.calculateVariant();
    }

    return this._variant;
  }

  get valid() {
    return this._isValid;
  }

  set valid(isValid) {
    this._isValid = isValid;
  }

  static stripThemeName(themeName) {
    return themeName
      .replace('.alfredtheme', '')
      .replace('.alfredappearance', '')
      .toLowerCase();
  }

  static humanizeThemeName(themeName) {
    const str = themeName.split(' ');

    for (let i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }

    return str.join(' ');
  }

  static themerObjToAlfredObj(colors) {
    return {
      result: {
        textSpacing: 6,
        subtext: {
          size: 12,
          colorSelected: `${colors.shade1}FF`,
          font: '"Roboto", sans-serif',
          color: `${colors.shade4}FF`
        },
        shortcut: {
          size: 16,
          colorSelected: `${colors.shade1}FF`,
          font: '"Roboto", sans-serif',
          color: `${colors.shade6}FF`
        },
        backgroundSelected: `${colors.accent4}FF`,
        text: {
          size: 18,
          colorSelected: `${colors.shade0}FF`,
          font: '"Roboto", sans-serif',
          color: `${colors.shade7}FF`
        },
        iconPaddingHorizontal: 6,
        paddingVertical: 6,
        iconSize: 36
      },
      search: {
        paddingVertical: 8,
        background: `${colors.shade2}7F`,
        spacing: 10,
        text: {
          size: 22,
          colorSelected: `${colors.accent5}FF`,
          font: '"Roboto", sans-serif',
          color: `${colors.shade7}FF`
        },
        backgroundSelected: `${colors.accent7}FF`
      },
      window: {
        color: `${colors.shade0}CC`,
        paddingHorizontal: 10,
        width: conf.DEFAULT_WINDOW_WIDTH,
        borderPadding: 0,
        borderColor: `${colors.shade0}00`,
        blur: 15,
        roundness: 2,
        paddingVertical: 10
      },
      separator: {
        color: `${colors.shade0}00`,
        thickness: 0
      },
      scrollbar: {
        color: `${colors.accent2}FF`,
        thickness: 2
      }
    };
  }

  static keyObjToAlfredObj(colorKeyObj) {
    // iterate through all color values, halting if we encounter any unparsable NSColor objects
    for (const i in colorKeyObj) {
      if (typeof colorKeyObj[i] === 'object') {
        throw RangeError(
          'XML theme parser does not support colors encoded as NSColor'
        );
      }
    }

    return {
      result: {
        textSpacing: 6,
        subtext: {
          size: 12,
          colorSelected: colorKeyObj.selectedSubtextForeground,
          font: '"Roboto", sans-serif',
          color: colorKeyObj.resultSubtextColor
        },
        shortcut: {
          size: 16,
          colorSelected: colorKeyObj.selectedResultShortcutColor,
          font: '"Roboto", sans-serif',
          color: colorKeyObj.resultShortcutColor
        },
        backgroundSelected: colorKeyObj.selectedResultBackgroundColor,
        text: {
          size: 18,
          colorSelected: colorKeyObj.selectedResultForeground,
          font: '"Roboto", sans-serif',
          color: colorKeyObj.resultTextColor
        },
        iconPaddingHorizontal: 6,
        paddingVertical: 6,
        iconSize: 36
      },
      search: {
        paddingVertical: 8,
        background: colorKeyObj.searchFieldBackgroundColor,
        spacing: 10,
        text: {
          size: 22,
          colorSelected: colorKeyObj.searchFieldTextColor,
          font: '"Roboto", sans-serif',
          color: colorKeyObj.searchFieldTextColor
        },
        backgroundSelected: colorKeyObj.searchFieldBackgroundColor
      },
      window: {
        color: colorKeyObj.backgroundColor,
        paddingHorizontal: 10,
        width: conf.DEFAULT_WINDOW_WIDTH,
        borderPadding: 0,
        borderColor: colorKeyObj.borderColor,
        blur: 15,
        roundness: 2,
        paddingVertical: 10
      },
      separator: {
        color: colorKeyObj.dividerLineColor,
        thickness: 0
      },
      scrollbar: {
        color: colorKeyObj.scrollbarColor,
        thickness: 2
      }
    };
  }

  static convertFont(fontStr) {
    // until theme font support is implemented, convert all font references to Hain-supported "Roboto"
    return '"Roboto", sans-serif';
  }

  static determineTransparentColor(themeObj, color, alwaysReturnColor) {
    // return color to be set if:
    // * window transparency is not enabled, or
    // * window transparency is enabled and the color has transparency
    const colorObj = tinycolor(color);

    if (!colorObj.isValid()) {
      return color;
    }

    if (themeObj.window.transparent === true) {
      // window is transparent...
      if (colorObj.getAlpha() < 1) {
        if (conf.SUPPORTED_PLATFORMS_VIBRANCY.includes(process.platform)) {
          // vibrancy (aka background blurring) is supported, so return color unchanged
          return color;
        }
        // vibrancy (aka background blurring) is not supported, so reduce transparency of color
        return colorObj
          .setAlpha(
            themeObj.window.vibrancy === conf.THEME_VIBRANCY_LIGHT ? 0.85 : 0.75
          )
          .toRgbString();
      }
    } else if (colorObj.getAlpha() < 1) {
      // window is not transparent but the color is, convert the color to fully opaque
      return colorObj.setAlpha(1).toRgbString();
    }

    if (alwaysReturnColor === true) {
      return color;
    }
    return null;
  }

  calculateVariant() {
    // attempt to calculate variant from theme-defined window color
    const colorObj = tinycolor(this.themeObj.window.color);

    if (colorObj.isValid()) {
      this._variant = colorObj.isDark()
        ? conf.THEME_VARIANT_DARK
        : conf.THEME_VARIANT_LIGHT;
    } else {
      this._variant = conf.THEME_VARIANT_LIGHT;
    }
  }

  processThemeObj() {
    function recurse(initial) {
      for (const prop in initial) {
        if ({}.hasOwnProperty.call(initial, prop)) {
          if (typeof initial[prop] === 'object') {
            recurse(initial[prop]);
          } else if (prop === 'font') {
            // attempt to parse a font value
            initial[prop] = ThemeObject.convertFont(initial[prop]);
          } else {
            // attempt to parse a color value
            const colorObj = tinycolor(initial[prop]);

            if (colorObj.isValid()) {
              initial[prop] = tinycolor(initial[prop]).toRgbString();
            }
          }
        }
      }
    }

    recurse(this.themeObj);
  }
}

class ThemeObjectDefault extends ThemeObject {
  constructor(themeVariant) {
    super();

    let themeObj;
    if (themeVariant === 'dark') {
      themeObj = defaultThemeDark;
    } else {
      themeObj = defaultThemeLight;
    }

    // assign values to object
    this.init(themeObj);

    this.id = ThemeObject.stripThemeName(themeObj.name);
    this.name = themeObj.name;
    this.fullName = `${themeObj.name} (by ${themeObj.credit})`;
    this.variant = themeVariant;
  }
}

class ThemeObjectAlfredJSON extends ThemeObject {
  constructor(themeObj, themeName) {
    super();

    if (
      typeof themeObj.alfredtheme === 'object' &&
      typeof themeObj.alfredtheme.name === 'string'
    ) {
      // assign values to object
      this.init(themeObj.alfredtheme);

      const strippedThemeName = ThemeObject.stripThemeName(
        themeObj.alfredtheme.name
      );
      const humanThemeName = ThemeObject.humanizeThemeName(strippedThemeName);

      this.id = strippedThemeName;
      this.name = humanThemeName;
      this.fullName = humanThemeName;

      // append theme credit to theme name (if present)
      if (typeof themeObj.alfredtheme.credit === 'string') {
        this.fullName += ` (by ${themeObj.alfredtheme.credit})`;
      }
    } else {
      this.init({}, false);

      this.id = themeName;

      console.log(
        `[theme-object] could not extract ${themeName} file into color scheme`
      );
    }
  }
}

class ThemeObjectAlfredXML extends ThemeObject {
  constructor(themeObj, themeName) {
    super();

    if (typeof themeObj === 'object') {
      try {
        // convert to Alfred JSON internal format
        const keyObj = ThemeObject.keyObjToAlfredObj(themeObj);

        // assign values to object
        this.init(keyObj);

        // attempt to get name from the XML file
        let strippedThemeName;

        if (themeObj.name) {
          strippedThemeName = ThemeObject.stripThemeName(themeObj.name);
        } else {
          strippedThemeName = ThemeObject.stripThemeName(themeName);
        }

        const humanThemeName = ThemeObject.humanizeThemeName(strippedThemeName);

        this.id = strippedThemeName;
        this.name = humanThemeName;
        this.fullName = humanThemeName;

        // append theme credit from XML (if present) to theme name
        if (typeof themeObj.credits === 'string') {
          this.fullName += ` (by ${themeObj.credits})`;
        }
      } catch (err) {
        this.init({}, false);

        this.id = themeName;

        if (err instanceof RangeError) {
          console.log(`[theme-object] ${err.message}`);
        } else {
          console.log(
            `[theme-object] error parsing "${themeName}" Alfred XML file into color scheme`
          );
        }
      }
    } else {
      this.init({}, false);

      this.id = themeName;

      console.log(
        `[theme-object] could not extract ${themeName} file into color scheme`
      );
    }
  }
}

class ThemeObjectThemer extends ThemeObject {
  constructor(themeObj, themeName) {
    super();

    // convert provided Themer format colors / values into Alfred-compatible format
    try {
      this.init(ThemeObject.themerObjToAlfredObj(themeObj));

      this.id = ThemeObject.stripThemeName(themeName);
      this.name = themeName;
      this.fullName = themeName;
    } catch (err) {
      this.init({}, false);

      this.id = themeName;

      console.log(
        `[theme-object] could not extract ${themeName} file into color scheme`
      );
    }
  }
}

module.exports = {
  ThemeObject,
  ThemeObjectDefault,
  ThemeObjectAlfredJSON,
  ThemeObjectAlfredXML,
  ThemeObjectThemer
};
