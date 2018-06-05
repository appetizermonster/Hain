'use strict';

const lo_isNumber = require('lodash.isnumber');
const lo_isString = require('lodash.isstring');
const lo_isObject = require('lodash.isobject');
const lo_has = require('lodash.has');

const math = require('mathjs');

const DECIMAL_SEPARATOR_UK = '.';
const DECIMAL_SEPARATOR_EUROPE = ',';

module.exports = (context) => {
  const app = context.app;
  const clipboard = context.clipboard;
  const toast = context.toast;
  const indexer = context.indexer;

  function startup() {
    indexer.set('math', (query) => {
      const answer = calculate(query, false);
      if (!answer) return;
      return makeResultItem('primaryText', query, answer);
    });
  }

  function search(query, res) {
    const answer = calculate(query, true);
    if (!answer) return;
    res.add(makeResultItem('title', query, answer));
  }

  function makeResultItem(titleKey, query, answer) {
    const result = {};
    result[titleKey] = `${query.trim()} = <b>${answer}</b>`;
    result.group = 'Math';
    result.payload = answer;
    return result;
  }

  function calculate(rawQuery, showRedundantResult) {
    try {
      let query = rawQuery;

      // determine input mode by the presence of European-style decimal separators
      let inputMode = DECIMAL_SEPARATOR_UK;

      if (query.includes(DECIMAL_SEPARATOR_EUROPE)) {
        inputMode = DECIMAL_SEPARATOR_EUROPE;

        // replace European-style decimal separators with UK-style decimal separators as required by the MathJS library:
        // http://mathjs.org/examples/browser/custom_separators.html.html
        query = query.replace(
          new RegExp(DECIMAL_SEPARATOR_EUROPE, 'g'),
          DECIMAL_SEPARATOR_UK
        );
      }

      // calculate value by passing the query into MathJS
      const ans = math.eval(query);

      if (
        lo_isNumber(ans) ||
        lo_isString(ans) ||
        (lo_isObject(ans) && lo_has(ans, 'value'))
      ) {
        let ansString = Number.parseFloat(ans.toPrecision(10)).toString();
        const isResultMeaningful = ansString.trim() !== query.trim();

        // if the input mode is the non-standard European-style, take the UK-style output of MathJS and transform it
        // back into the European-style that the user expects
        if (inputMode === DECIMAL_SEPARATOR_EUROPE && ansString.includes('.')) {
          ansString = ansString.replace(
            new RegExp(`\\${DECIMAL_SEPARATOR_UK}`, 'g'),
            DECIMAL_SEPARATOR_EUROPE
          );
        }

        if (isResultMeaningful || showRedundantResult) return ansString;
      }
    } catch (e) {}
  }

  function execute(id, payload, extra) {
    app.setQuery(`=${payload}`);
    clipboard.writeText(payload);
    toast.enqueue(`${payload} has copied into clipboard`);
  }

  return { startup, search, execute };
};
