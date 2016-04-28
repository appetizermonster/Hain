'use strict';

const fs = require('fs');
const path = require('path');
const applicationConfigPath = require('application-config-path');

const firstLaunchFile = path.join(applicationConfigPath('hain-user'), '_launched_');
const isFirstLaunch = !fs.existsSync(firstLaunchFile);

if (isFirstLaunch) {
  fs.writeFileSync(firstLaunchFile, 'HELLO');
}

module.exports = { isFirstLaunch };
