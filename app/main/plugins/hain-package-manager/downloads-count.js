'use strict';

const lo_assign = require('lodash.assign');
const got = require('got');
const moment = require('moment');

const now = moment();
const RANGE_START = now.subtract(364, 'days').format('YYYY-MM-DD');
const RANGE_END = now.format('YYYY-MM-DD');
const RANGE_ALL = `${RANGE_START}:${RANGE_END}`;
const PERIOD_LAST_MONTH = 'last-month';

function _getDownloadCountForPoint(packages, period) {
  const query = packages.join(',');
  const query_enc = encodeURIComponent(query);
  const baseUrl = `https://api.npmjs.org/downloads/point/${period}/${query_enc},`;
  return got(baseUrl, { json: true }).then((res) => res.body);
}

function _getDownloadCountForRange(packages, range) {
  const query = packages.join(',');
  const query_enc = encodeURIComponent(query);
  const baseUrl = `https://api.npmjs.org/downloads/range/${range}/${query_enc},`;
  return got(baseUrl, { json: true }).then((res) => {
    const { body } = res;
    const result = {};
    Object.keys(body).forEach((pkg) => {
      // skip empty keys
      if (!pkg) return;

      result[pkg] = {
        package: pkg,
        start: body[pkg].start,
        end: body[pkg].end,
        downloads: 0 // initialize to zero
      };

      if (body[pkg].downloads) {
        // update downloads if there are downloads
        result[pkg].downloads = body[pkg].downloads.reduce(
          (sum, dl) => sum + dl.downloads,
          0
        );
      }
    });
    return result;
  });
}

function splitIntoChunks(arr, chunkSize) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const begin = i;
    const end = begin + chunkSize;
    chunks.push(arr.slice(begin, end));
  }
  return chunks;
}

function getDownloadsCount(packages, period) {
  const packageChunks = splitIntoChunks(packages, 20);
  const promises = [];
  for (const packageChunk of packageChunks) {
    let promise;
    if (!period) {
      promise = _getDownloadCountForRange(packageChunk, RANGE_ALL);
    } else {
      promise = _getDownloadCountForPoint(
        packageChunk,
        period || PERIOD_LAST_MONTH
      );
    }
    promises.push(promise);
  }
  return Promise.all(promises).then((results) => {
    let merged = {};
    for (const ret of results) {
      merged = lo_assign(merged, ret);
    }
    return merged;
  });
}

module.exports = getDownloadsCount;
