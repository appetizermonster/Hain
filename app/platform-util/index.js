'use strict';

// determine native module name
let nativeModuleName = null;
if (process.platform === 'win32') {
  nativeModuleName = `${process.platform}-${process.arch}`;
}

// find module
let native = null;
try {
  const _native = require(`./${nativeModuleName}`);
  native = _native;
} catch (e) {
}

// assign mock object
if (native === null) {
  native = {
    fetchFileIconAsPng: (path, cb) => {
      cb([]);
    },
    saveFocus: () => {},
    restoreFocus: () => {}
  };
}

function fetchFileIconAsPng(filePath, callback) {
  try {
    native.fetchFileIconAsPng(filePath, callback);
  } catch (e) {
    console.log(e);
  }
}

function saveFocus() {
  native.saveFocus();
}


function restoreFocus() {
  native.restoreFocus();
}

module.exports = { fetchFileIconAsPng, saveFocus, restoreFocus };
