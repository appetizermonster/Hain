'use strict';

const lo_assign = require('lodash.assign');
const lo_isPlainObject = require('lodash.isplainobject');

const iconFmt = require('./icon-fmt');
const textUtil = require('../../shared/text-util');

function createSanitizeSearchResultFunc(pluginId, pluginConfig) {
  return (x) => {
    const _icon = x.icon ? iconFmt.parse(pluginConfig.path, x.icon) : null;
    const _title = textUtil.sanitize(x.title);
    const _desc = textUtil.sanitize(x.desc);
    const _group = x.group;
    const _preview = x.preview;
    const sanitizedProps = {
      context: pluginId,
      title: _title,
      desc: _desc,
      icon: _icon || pluginConfig.icon,
      group: _group || pluginConfig.group,
      preview: _preview || false
    };
    return lo_assign(x, sanitizedProps);
  };
}

function createResponseObject(resFunc, pluginId, pluginConfig) {
  const sanitizeSearchResult = createSanitizeSearchResultFunc(
    pluginId,
    pluginConfig
  );
  return {
    add: (result) => {
      let searchResults = [];
      if (Array.isArray(result)) {
        searchResults = result.map(sanitizeSearchResult);
      } else if (lo_isPlainObject(result)) {
        searchResults = [sanitizeSearchResult(result)];
      } else {
        throw new Error('argument must be an array or an object');
      }
      if (searchResults.length <= 0) return;
      resFunc({
        type: 'add',
        payload: searchResults
      });
    },
    remove: (id) => {
      resFunc({
        type: 'remove',
        payload: { id, context: pluginId }
      });
    }
  };
}

module.exports = {
  createResponseObject
};
