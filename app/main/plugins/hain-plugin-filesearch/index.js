'use strict';

let moduleName = './win32';

if (process.platform === 'darwin') moduleName = './darwin';

module.exports = require(moduleName);
