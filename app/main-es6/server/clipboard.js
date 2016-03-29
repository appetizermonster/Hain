'use strict';

const cb = require('electron').clipboard;
const nativeImage = require('electron').nativeImage;
const got = require('got');

module.exports = (context) => {

  function get(type = null) {
    if (type === null) {
      return cb.readText();
    }
    return cb.readText(type);
  }

  function getImage(type = null) {
    if (type === null) {
      return cb.readImage();
    }
    return cb.readImage(type);
  }

  function set(text, type = null) {
    if (type === null) {
      cb.writeText(text);
    }
    return cb.writeText(text, type);
  }

  function setImage(imgUrl, type = null) {
    const pat = /https?:\/\//i;
    if (pat.test(imgUrl) === false) {
      return this.getLocalImage(imgUrl);
    }
    return this.getImageFromUrl(imgUrl, type);
  }

  function getLocalImage(path, type) {
    const image = nativeImage.createFromPath(path);
    if (type === null) {
      return cb.writeImage(image);
    }
    return cb.writeImage(image, type);
  }

  function getImageFromUrl(url, type) {
    got(url, { encoding: null })
      .then(response => {
        const bufString = response.body.toString('base64');
        const contentType = response.headers['content-type'];
        const data = `data:${contentType};base64,${bufString}`;
        const image = nativeImage.createFromDataURL(data);
        if (type === null) {
          return cb.writeImage(image);
        }
        return cb.writeImage(image, type);
      });
  }

  function has(data, type = null) {
    return cb.has(data, type);
  }

  function clear(type = null) {
    return cb.clear(type);
  }

  return { get, getImage, set, setImage, getLocalImage, getImageFromUrl, has, clear };
};
