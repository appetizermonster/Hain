'use strict';

const _ = require('lodash');
const math = require('mathjs');

module.exports = ({ app }) => {

  function search(query, res) {
    try {
      const ans = math.eval(query);
      if (_.isNumber(ans) || _.isString(ans) || (_.isObject(ans) && _.has(ans, 'value'))) {
        res.add({
          title: `${query.trim()} = ${ans.toString()}`,
          group: 'Math',
          payload: ans.toString()
        });
      }
    } catch (e) {
    }
  }

  function execute(id, payload) {
    app.setInput(`=${payload}`);
  }

  return { search, execute };
};
