'use strict';

let path = require('path');
let util = require('util');
let WebVTTWriter = require('./WebVTTWriter');

/**
 * Plain writer writes info about thumbnails to WebVTT
 * without creating spritesheet.
 *
 * @constructor
 * @extends {WebVTTWriter}
 */
function PlainImages(metadata, options, filenames) {
  WebVTTWriter.call(this, metadata, options, filenames);

  let thumbnailPaths = [];
  let thumbnail;
  let i = 0;

  while ((thumbnail = filenames[i++])) {
    const imagePath = util.format('/%s', path.join(options.outputDirectory, thumbnail));
    thumbnailPaths.push(imagePath);
  }

  this._writeInfo(thumbnailPaths);
}
util.inherits(PlainImages, WebVTTWriter);

module.exports = PlainImages;
