'use strict';

let Promise = require('bluebird')
let Spritesmith = require('spritesmith');
let Layout = require('layout');
let _ = require('lodash');
let path = require('path');
let util = require('util');
let Writer = require('./WebVTTWriter');
let Util = require('./Util');
let fs = Promise.promisifyAll(require('fs-extra'));


/**
 * Creates spritesheet then writes files
 *
 * @constructor
 * @extends {Writer}
 */
function SpriteImages(metadata, options, filenames) {
  Writer.call(this, metadata, options, filenames);

  const self = this;
  let src = [];

  for (let element in filenames) {
    src.push(path.join(options.outputThumbnailDirectory, filenames[element]))
  }

  Layout.addAlgorithm('left-right-wrap', {
    sort: function (items) {
      // Sort items by their name (e.g. '00:00:00.png', '00:05:00.png')
      items.sort(function (a, b) {
        let aName = a.meta.img._filepath;
        let bName = b.meta.img._filepath;
        return aName.localeCompare(bName);
      });
      return items;
    },
    placeItems: function (items) {
      // Iterate over each of the items
      let x = 0;
      let y = 0;
      items.forEach(function (item, i) {
        // Update the x to the current width
        item.x = x;
        item.y = y;

        // If this was the 4th item, then wrap our row
        if ((i + 1) % 4 === 0) {
          y += item.height;
          x = 0;
          // Otherwise, increment the x by the item's width
        } else {
          x += item.width;
        }
      });

      // Return the items
      return items;
    }
  });

  let coordinates;
  let properties;
  Spritesmith.run({
    src: src,
    algorithm: 'left-right-wrap'
  }, function handleResult(err, result) {
    if (err) {
      throw new Error('Cannot generate sprites!')
    }
    coordinates = result.coordinates;
    properties = result.properties;
    fs.writeFileAsync(options.spritesImagePath, result.image)
      .then(createWebVTT)
      .catch(function (err) {
        console.log(err);
      })
  });

  let thumbnailPaths = [];

  function createWebVTT(data) {
    for (let element in coordinates) {
      const image = coordinates[element];
      const imagePath = util.format(
        '/%s#xywh=%d,%d,%d,%d',
        options.spritesImagePath,
        image.x,
        image.y,
        image.width,
        image.height
      );
      thumbnailPaths.push(imagePath)
    }

    Util.deleteFiles(src)
      .then(self._writeInfo(thumbnailPaths))
      .catch(function (err) {
        console.log(err);
      })
  }
}
util.inherits(SpriteImages, Writer);


module.exports = SpriteImages;