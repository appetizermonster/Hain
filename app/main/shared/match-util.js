'use strict';

const lo_isObject = require('lodash.isobject');
const lo_orderBy = require('lodash.orderby');

function fuzzyMatchFallback(elem, keyword, testStr, fuzzyScore) {
  let srcStr = keyword;
  let score = fuzzyScore * 0.5;
  for (let i = 0; i < testStr.length; ++i) {
    const chr = testStr.charAt(i);
    const occurIndex = srcStr.indexOf(chr);
    if (occurIndex < 0) {
      score = 0;
      break;
    }
    score++;
    srcStr = srcStr.substring(0, occurIndex) + srcStr.substring(occurIndex + 1);
  }
  if (srcStr.length > 0) score /= srcStr.length;
  score *= 0.05;
  return { elem, matches: [], score, length: srcStr.length };
}

const MAX_MATCH_LENGTH = 15;
const MAX_MATCH_SCORE =
  (MAX_MATCH_LENGTH + MAX_MATCH_LENGTH * MAX_MATCH_LENGTH) * 0.5;

function fuzzyMatch(elem, testStr, keywordGetter) {
  const srcStr = keywordGetter(elem).toLowerCase();
  let fuzzyScore = 0;
  let pattern_i = testStr.length - 1;
  let add = 1;
  const matches = [];

  for (let i = srcStr.length - 1; i >= 0; --i) {
    const srcChrCode = srcStr.charCodeAt(i);
    const testChrCode = testStr.charCodeAt(pattern_i);
    if (pattern_i < 0 || srcChrCode !== testChrCode) {
      add *= 0.5;
      continue;
    }
    pattern_i--;
    add += 1;
    fuzzyScore += add;
    matches.push(i);
  }

  fuzzyScore = Math.min(MAX_MATCH_SCORE, fuzzyScore);
  fuzzyScore /= MAX_MATCH_SCORE;

  const success = pattern_i < 0;
  if (success)
    return {
      elem,
      matches: matches.reverse(),
      score: fuzzyScore,
      length: srcStr.length
    };
  return fuzzyMatchFallback(elem, srcStr, testStr, fuzzyScore);
}

function fwdFuzzyMatch(elem, testStr, keywordGetter) {
  const srcStr = keywordGetter(elem).toLowerCase();
  let fuzzyScore = 0;
  let pattern_i = 0;
  let add = 1;
  const matches = [];

  for (let i = 0; i < srcStr.length; ++i) {
    const srcChrCode = srcStr.charCodeAt(i);
    const testChrCode = testStr.charCodeAt(pattern_i);
    if (pattern_i >= testStr.length || srcChrCode !== testChrCode) {
      add *= 0.5;
      continue;
    }
    pattern_i++;
    add += 1;
    fuzzyScore += add;
    matches.push(i);
  }

  fuzzyScore = Math.min(MAX_MATCH_SCORE, fuzzyScore);
  fuzzyScore /= MAX_MATCH_SCORE;

  const success = pattern_i >= testStr.length;
  if (success)
    return { elem, matches, score: fuzzyScore, length: srcStr.length };
  return fuzzyMatchFallback(elem, srcStr, testStr, fuzzyScore);
}

function headMatch(elem, testStr, keywordGetter) {
  const srcStr = keywordGetter(elem);
  const testLength = Math.min(srcStr.length, testStr.length);
  const matches = [];
  for (let i = 0; i < testLength; ++i) {
    if (srcStr.charCodeAt(i) !== testStr.charCodeAt(i)) {
      return { elem: elem, matches: [], score: 0 };
    }
    matches.push(i);
  }
  return { elem: elem, matches: matches, score: 1 };
}

function _defaultKeywordGetter(str) {
  return str;
}

function search(elems, testStr, keywordGetter, matchFunc) {
  const results = [];
  const _keywordGetter = keywordGetter || _defaultKeywordGetter;

  if (testStr === null || testStr === undefined || testStr.length === 0)
    return results;

  const testStr_norm = testStr.toLowerCase();
  if (Array.isArray(elems)) {
    // array
    for (let i = 0; i < elems.length; ++i) {
      const matchResult = matchFunc(elems[i], testStr_norm, _keywordGetter);
      if (matchResult.score === 0) continue;
      results.push(matchResult);
    }
  } else if (lo_isObject(elems)) {
    // object like { [], [], [], ... }
    for (const prop in elems) {
      const arr = elems[prop];
      for (let i = 0; i < arr.length; ++i) {
        const matchResult = matchFunc(arr[i], testStr_norm, _keywordGetter);
        if (matchResult.score === 0) continue;
        results.push(matchResult);
      }
    }
  } else {
    // can't process
    return results;
  }
  return lo_orderBy(results, ['score', 'length'], ['desc', 'asc']); // stable sort
}

function fuzzy(elems, testStr, keywordGetter) {
  return search(elems, testStr, keywordGetter, fuzzyMatch);
}

function fwdfuzzy(elems, testStr, keywordGetter) {
  return search(elems, testStr, keywordGetter, fwdFuzzyMatch);
}

function head(elems, testStr, keywordGetter) {
  return search(elems, testStr, keywordGetter, headMatch);
}

function makeStringBoldHtml(str, boldIndices) {
  if (boldIndices === null || boldIndices.length === 0) {
    return str;
  }
  let p = '';
  let b_i = 0;
  for (let i = 0; i < str.length; ++i) {
    if (i === boldIndices[b_i]) {
      p += `<b>${str.charAt(i)}</b>`;
      b_i++;
    } else {
      p += str.charAt(i);
    }
  }
  return p;
}

module.exports = {
  fuzzy,
  fwdfuzzy,
  head,
  makeStringBoldHtml
};
