'use strict';

let fs = require('fs');
let util = require('util');
let utils = require('./Util');
let Writable = require('stream').Writable;

/**
 * Abstract WebVTT writer. Should be extended
 *
 * @constructor
 * @extends {Writable}
 * @param {object} metadata Video file metadata
 * @param {object} options Generator options
 * @param {string[]} filenames Thumbnail filenames
 */
function WebVTTWriter(metadata, options, filenames) {
  Writable.call(this, options);
  let self = this;

  this.metadata = metadata;
  this.options = options;
  this.filenames = filenames;

  this.ws = fs.createWriteStream(options.outputWebVTTPath);
  // write header first
  this.ws.write('WEBVTT', 'utf8');

  this.ws.on('error', onError);
  this.on('internalError', onIternalError);
  this.on('finish', onFinish);

  function onError(err) {
    self.emit('error', err);
  }

  function onIternalError() {
    self.emit('error');
    self.ws.end();
  }

  function onFinish() {
    self.ws.end();
  }
}
util.inherits(WebVTTWriter, Writable);

/**
 * Write thumbnail data
 *
 * @private
 * @param {string} str Data to write
 * @param {string} encoding Data encoding
 * @param {function} callback Accepts arguments: (err, data)
 */
WebVTTWriter.prototype._write = function (str, encoding, callback) {
  this.ws.write(str, encoding, callback);
};

/**
 * Write thumbnails specs to VTT
 *
 * @protected
 * @param {string[]} thumbnails List of thumbnails filenames
 */
WebVTTWriter.prototype._writeInfo = function (thumbnails) {
  let self = this;
  let thumbnailTimeBounds = this.options.thumbnailTimeBounds;
  let length = thumbnails.length;
  let element;
  let i = 0;
  let bound;
  let out = [];

  while ((element = thumbnails[i])) {
    bound = thumbnailTimeBounds[i];

    const data = {
      path: element,
      from: utils.toTimemark(bound),
    };

    if (i === length - 1) {
      data.to = utils.toTimemark(Number(this.metadata.duration).toFixed(3));
    } else {
      data.to = utils.toTimemark(thumbnailTimeBounds[i + 1]);
    }

    out.push(data);
    this.write(this.toThumbString(data));

    i++;
  }

  this.end();
  this.on('finish', function () {
    self.emit('success', out);
  });
};

/**
 * Write thumbnail data
 *
 * @protected
 * @param {object} data Thumbnail data
 * @returns {string} Thumbnail string
 */
WebVTTWriter.prototype.toThumbString = function (data) {
  return ['\n\n', data.from, ' --> ', data.to, '\n', data.path].join('');
};

module.exports = WebVTTWriter;
