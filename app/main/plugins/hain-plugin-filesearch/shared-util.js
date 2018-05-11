'use strict';

const path = require('path');

function injectEnvVariable(dirPath) {
  if (dirPath.length <= 0)
    return dirPath;

  // for macOS
  let _path = dirPath;
  if (process.platform !== 'win32') {
    if (_path[0] === '~')
      _path = path.join(process.env.HOME, _path.slice(1));
  }

  // Inject Environment Variables
  let tokens = dirPath.match(/\${.*?}/g);

  if (tokens) {
    for (const i in tokens) {
      const tokenId = tokens[i].slice(2, -1);
      const value = process.env[tokenId];

      if (value === undefined) {
        throw new Error(`can't translate provided token ${tokens[i]} into a valid environment variable`);
      }

      _path = _path.replace(tokens[i], value);
    }
  }

  return _path;
}

function injectEnvVariables(dirArr) {
  const newArr = [];
  for (let i = 0; i < dirArr.length; ++i) {
    const dirPath = dirArr[i];
    newArr.push(injectEnvVariable(dirPath));
  }
  return newArr;
}

module.exports = { injectEnvVariables };
