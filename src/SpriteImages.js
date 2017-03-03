'use strict';

var fs = require('fs-extra')
  , Spritesmith = require('spritesmith')
  , Layout = require('layout')
  , _ = require('lodash')
  , path = require('path')
  , util = require('util')
  , Writer = require('./WebVTTWriter')
  , Util = require('./Util');


/**
 * Creates spritesheet then writes files
 *
 * @constructor
 * @extends {Writer}
 */
function SpriteSheetWriter(metadata, options, filenames) {
  Writer.call(this, metadata, options, filenames);

  var self = this
    , src = [];

  for (var element in filenames) {
    src.push(path.join(options.outputThumbnailDirectory, filenames[element]))
  }

  Layout.addAlgorithm('left-right-wrap', {
    sort: function (items) {
      // Sort items by their name (e.g. '00:00:00.png', '00:05:00.png')
      items.sort(function (a, b) {
        var aName = a.meta.img._filepath;
        var bName = b.meta.img._filepath;
        return aName.localeCompare(bName);
      });
      return items;
    },
    placeItems: function (items) {
      // Iterate over each of the items
      var x = 0;
      var y = 0;
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

  var coordinates
    , properties;

  Spritesmith.run({
    src: src,
    algorithm: 'left-right-wrap'
  }, function handleResult(err, result) {
    if (err) {
      throw new Error('Cannot generate sprites!')
    }
    coordinates = result.coordinates;
    properties = result.properties;
    fs.writeFile(options.spritesImagePath, result.image, createWebVTT);
  });

  var thumbnailPaths = [];
  
  function createWebVTT(err) {
    if (err) {
      throw new Error('Cannot Write Sprite Images to File!')
    }
    for (var element in coordinates) {
      var image = coordinates[element];
      var imagePath = util.format(
        '/%s#xywh=%d,%d,%d,%d',
        options.spritesImagePath,
        image.x,
        image.y,
        image.width,
        image.height
      );
      thumbnailPaths.push(imagePath)
    }

    Util.deleteFiles(src, writeInfo);
  }

  function writeInfo(err) {
    if (err) {
      return self.emit('internalError', err)
    }
    self._writeInfo(thumbnailPaths)
  }
}
util.inherits(SpriteSheetWriter, Writer);


module.exports = SpriteSheetWriter;