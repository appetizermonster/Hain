'use strict';

const sanitizeHtml = require('sanitize-html');

function sanitize(text) {
  if (text === undefined) {
    return undefined;
  }
  return sanitizeHtml(text, {
    allowedTags: ['a', 'b', 'i', 'u', 'em', 'strong', 'span'],
    allowedAttributes: {
      'a': ['href'],
      'i': ['class'],
      'span': ['class', 'style']
    }
  });
}

module.exports = { sanitize };
