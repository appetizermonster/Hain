'use strict';

const lo_assign = require('lodash.assign');
const lo_isFunction = require('lodash.isfunction');
const lo_isPlainObject = require('lodash.isplainobject');

const matcher = require('./matcher');
const logger = require('../../shared/logger');

const SECONDARY_RATIO = 0.5;
const MIN_SCORE = 0.01;

class Indexer {
  constructor(pluginId, defaultIcon) {
    this.pluginId = pluginId;
    this.defaultIcon = defaultIcon;
    this.items = {};
    this._cachedResults = [];
  }
  set(key, funcOrArray) {
    if (!Array.isArray(funcOrArray) && !lo_isFunction(funcOrArray)) return;

    this.items[key] = funcOrArray;
  }
  unset(key) {
    delete this.items[key];
  }
  remove(key) {
    this.unset(key);
  }
  search(query) {
    this._cachedResults.length = 0;
    // Search items
    for (const key in this.items) {
      const item = this.items[key];
      const searchResult = this._searchItem(item, query);
      if (Array.isArray(searchResult))
        this._cachedResults.push(...searchResult);
      else if (lo_isPlainObject(searchResult))
        this._cachedResults.push(searchResult);
    }
    // Inject default plugin properties into results
    for (const elem of this._cachedResults) {
      elem.pluginId = this.pluginId;
      if (!elem.icon) elem.icon = this.defaultIcon;
    }
    return this._cachedResults;
  }
  _searchItem(item, query) {
    try {
      if (Array.isArray(item)) return this._searchArrayItem(item, query);
      else if (lo_isFunction(item))
        return this._searchFunctionItem(item, query);
    } catch (e) {
      logger.error(e);
    }
    return null;
  }
  _searchArrayItem(item, query) {
    const arr = item;
    const matched = [];
    const query_lower = query.toLowerCase();
    for (const elem of arr) {
      if (!elem.primaryText) continue;

      const primaryMatch = matcher.computeMatchScore(
        elem.primaryText,
        query_lower
      );
      let score = primaryMatch.score;

      if (elem.secondaryText) {
        const secondaryMatch = matcher.computeMatchScore(
          elem.secondaryText,
          query_lower
        );
        const secondaryScore = secondaryMatch.score * SECONDARY_RATIO;
        score = Math.max(score, secondaryScore);
      }

      const failedToMatch = score <= MIN_SCORE;
      if (failedToMatch) continue;

      const elemWithScore = lo_assign(elem, { score });
      matched.push(elemWithScore);
    }
    return matched;
  }
  _searchFunctionItem(item, query) {
    const matched = [];
    const result = item(query);
    if (Array.isArray(result)) matched.push(...result);
    else if (lo_isPlainObject(result)) matched.push(result);
    return matched;
  }
}

module.exports = Indexer;
