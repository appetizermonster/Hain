'use strict';

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
    backgroundSelected: '#DDDDDD',
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
    color: '#ffffff',
    paddingHorizontal: 10,
    width: 560,
    height: 544,
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
    backgroundSelected: '#222222',
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
    color: '#000000',
    paddingHorizontal: 10,
    width: 560,
    height: 544,
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
  constructor(themeObj = {}, isValid = true) {
    this.themeObj = themeObj;
    this._isValid = isValid;

    // set window width / height values if undefined
    this.themeObj.window = this.themeObj.window || {};
    this.themeObj.window.width = parseInt(this.themeObj.window.width, 10) || defaultThemeLight.window.width;
    this.themeObj.window.height = parseInt(this.themeObj.window.height, 10) || defaultThemeLight.window.height;

    // process color values
    this.processColors();
  }

  set id(id) {
    this._themeId = id;
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

  get valid() {
    return this._isValid;
  }

  set valid(isValid) {
    this._isValid = isValid;
  }

  static stripThemeName(themeName) {
    return themeName.replace('.alfredtheme', '').replace('.alfredappearance', '').toLowerCase();
  }

  static humanizeThemeName(themeName) {
    let str = themeName.split(' ');

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
        width: 560,
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
    for (let i in colorKeyObj) {
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
          color: colorKeyObj.searchFieldTextColor,
        },
        backgroundSelected: colorKeyObj.searchFieldBackgroundColor,
      },
      window: {
        color: colorKeyObj.backgroundColor,
        paddingHorizontal: 10,
        width: 560,
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

  static convertHexColor(hexStr, format = 'rgba') {
    let hex;

    // if provided, remove hash character from start of color string
    if (hexStr[0] !== '#') {
      hex = hexStr;
    } else {
      hex = hexStr.slice(1);
    }

    // if this is not a rgba hex color, do not continue and return original color string
    if (hex.length !== 8) {
      return hexStr;
    }

    // split to four channels
    let c = hex.match(/.{2}/g);

    // guard against invalid color split
    if (c.length !== 4) {
      return hexStr;
    }

    // function: to decimals (for RGB)
    let d = function(v) {
      return parseInt(v, 16);
    };

    // function: to percentage (for alpha), to 3 decimals
    let p = function(v) {
      return parseFloat(parseInt((parseInt(v, 16)/255)*1000)/1000);
    };

    // check format - if it's argb, pop the alpha value from the end and move it to front
    let a;
    if (format === 'argb') {
      c.push(c.shift());
    }

    // convert array into rgba values
    a = p(c[3]);
    const cSlice = c.slice(0, 3);
    let rgb = [];
    for (let i in cSlice) {
      rgb.push(d(cSlice[i]));
    }

    // return color in rgba() format
    return `rgba(${rgb.join(', ')}, ${a})`;
  }

  static convertFont(fontStr) {
    // until theme font support is implemented, convert all font references to Hain-supported "Roboto"
    return '"Roboto", sans-serif';
  }

  processColors() {
    function recurse(initial) {
      for (let prop in initial) {
        if ({}.hasOwnProperty.call(initial, prop)) {
          if (typeof initial[prop] === 'object') {
            recurse(initial[prop]);
          } else {
            if (initial[prop][0] === '#') {
              if (initial[prop].length === 9) {
                initial[prop] = ThemeObject.convertHexColor(initial[prop]);
              }
            }

            if (prop === 'font') {
              initial[prop] = ThemeObject.convertFont(initial[prop]);
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
    let themeObj;
    if (themeVariant === 'dark') {
      themeObj = defaultThemeDark;
    } else {
      themeObj = defaultThemeLight;
    }

    // assign values to object
    super(themeObj);

    this.id = ThemeObject.stripThemeName(themeObj.name);
    this.name = themeObj.name;
    this.fullName = `${themeObj.name} (by ${themeObj.credit})`;
  }
}

class ThemeObjectAlfredJSON extends ThemeObject {
  constructor(themeObj, themeName) {
    if ((typeof themeObj.alfredtheme === 'object') && (typeof themeObj.alfredtheme.name === 'string')) {
      // assign values to object
      super(themeObj.alfredtheme);

      const strippedThemeName = ThemeObject.stripThemeName(themeObj.alfredtheme.name);
      const humanThemeName = ThemeObject.humanizeThemeName(strippedThemeName);

      this.id = strippedThemeName;
      this.name = humanThemeName;
      this.fullName = humanThemeName;

      // append theme credit to theme name (if present)
      if (typeof themeObj.alfredtheme.credit === 'string') {
        this.fullName += ` (by ${themeObj.alfredtheme.credit})`;
      }

    } else {
      super({}, false);

      this.id = themeName;

      console.log(
        `[theme-object] could not extract ${themeName} file into color scheme`
      );
    }
  }
}

class ThemeObjectAlfredXML extends ThemeObject {
  constructor(themeObj, themeName) {
    if (typeof themeObj === 'object') {
      try {
        //
        const keyObj = ThemeObject.keyObjToAlfredObj(themeObj);

        // assign values to object
        super(keyObj);

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
        super({}, false);

        this.id = themeName;

        if (err instanceof RangeError) {
          console.log(
            `[theme-object] ${err.message}`
          );

        } else {
          console.log(
            `[theme-object] error parsing "${themeName}" Alfred XML file into color scheme`
          );
        }
      }

    } else {
      super({}, false);

      this.id = themeName;

      console.log(
        `[theme-object] could not extract ${themeName} file into color scheme`
      );
    }
  }
}

class ThemeObjectThemer extends ThemeObject {
  constructor(themeObj, themeName) {
    // convert provided Themer format colors / values into Alfred-compatible format
    try {
      super(ThemeObject.themerObjToAlfredObj(themeObj));

      this.id = ThemeObject.stripThemeName(themeName);
      this.name = themeName;
      this.fullName = themeName;

    } catch (err) {
      super({}, false);

      this.id = themeName;

      console.log(
        `[theme-object] could not extract ${themeName} file into color scheme`
      );
    }
  }
}

module.exports = {
  ThemeObjectDefault,
  ThemeObjectAlfredJSON,
  ThemeObjectAlfredXML,
  ThemeObjectThemer
};
