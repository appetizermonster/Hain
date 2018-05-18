'use strict';

import React from 'react'; // DO NOT REMOVE THIS LINE, JSX USES THIS LIBRARY

const lo_isString = require('lodash.isstring');
const textUtil = require('../../main/shared/text-util');

function wrapDescription(description) {
  if (description === undefined) return undefined;
  return (
    <p
      style={{ color: '#999' }}
      dangerouslySetInnerHTML={{ __html: textUtil.sanitize(description) }}
    />
  );
}

function wrapHelp(help) {
  if (help === undefined) return undefined;
  return (
    <div
      style={{
        margin: '24px 0 0 0',
        lineHeight: '1.4',
        color: '#222222',
        padding: '16px',
        background: '#f3f3f3',
        border: '1px solid #cccccc'
      }}
      dangerouslySetInnerHTML={{ __html: help }}
    />
  );
}

function findErrorMessage(errors, path) {
  const errorPath = `instance${path}`;
  for (const error of errors) {
    if (error.property !== errorPath) continue;

    const errorType = error.name;
    const customMessages = error.schema.errorMessages;
    if (customMessages !== undefined) {
      if (lo_isString(customMessages)) return customMessages;
      if (customMessages[errorType]) return customMessages[errorType];
    }
    return error.message;
  }
  return undefined;
}

module.exports = {
  wrapDescription,
  wrapHelp,
  findErrorMessage
};
