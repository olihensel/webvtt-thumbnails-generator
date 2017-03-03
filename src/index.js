let path = require('path');
let SpriteImages = require('./SpriteImages');
let Utils = require('./Util');
let Promise = require('bluebird');


/**
 * @callback thumbgenCallback
 * @param {Error} err Any error
 * @param {object} metadata Metadata
 */

/**
 * Generate thumbnails and pack them into WebVTT file
 *
 * @param {string} inputVideo Video file
 * @param {object} options Various options
 * @param {thumbgenCallback} callback Accepts arguments: (err, metadata)
 */
module.exports = function (inputVideo, options, callback) {

  if (!inputVideo) {
    return callback(new Error('Source video file is not specified'))
  } else if (!options.secondsPerThumbnail && !options.framesPerThumbnail && !options.timemarks) {
    return callback(new Error('You should specify the way timemarks are calculated.'))
  } else if (!options.outputDirectory) {
    return callback(new Error('You should specify an output directory.'));
  } else if (!options.outputFileName) {
    return callback(new Error('You should specify an output file name.'));
  }

  options.inputVideoPath = inputVideo;
  options.outputWebVTTPath = path.join(options.outputDirectory, options.outputFileName + '.vtt');
  options.spritesImagePath = path.join(options.outputDirectory, options.outputFileName + '.png');
  options.outputThumbnailDirectory = options.outputDirectory;

  Utils.metadata(inputVideo)
    .then(metadataHandler)
    .then(Utils.generateThumbnails)
    .then(generateResult)
    .then(callback)
    .catch(callback);

  function metadataHandler(data) {
    return new Promise(function (resolve, reject) {
      metadata = data;
      if (!options.timemarks) {
        options.timemarks = []
      }
      options.thumbnailTimeBounds = [];

      let mark;
      if (options.secondsPerThumbnail) {
        mark = 0;

        while (mark < metadata.duration) {
          options.thumbnailTimeBounds.push(Number(mark).toFixed(3));
          options.timemarks.push(Number(mark).toFixed(3));

          mark += options.secondsPerThumbnail
        }
      }
      else if (options.framesPerThumbnail) {
        mark = 0;
        while (mark < metadata.duration) {
          options.thumbnailTimeBounds.push(Number(mark).toFixed(3));
          options.timemarks.push(Number(mark).toFixed(3));
          if (!metadata.fps) {
            return callback(new Error('Can\'t determine video FPS.'))
          }
          mark += options.framesPerThumbnail / metadata.fps
        }
      }

      if (!options.thumbnailSize) {
        options.thumbnailSize = {
          width: metadata.width,
          height: metadata.height
        }
      }
      else if (!options.thumbnailSize.height) {
        options.thumbnailSize.height = options.thumbnailSize.width * metadata.height / metadata.width
      }
      else if (!options.thumbnailSize.width) {
        options.thumbnailSize.width = options.thumbnailSize.height * metadata.width / metadata.height
      }

      const result = {
        inputVideo: inputVideo,
        options: {
          outputThumbnailDirectory: options.outputThumbnailDirectory,
          thumbnailSize: options.thumbnailSize,
          timemarks: options.timemarks
        }
      };
      resolve(result);
    });
  }

  function generateResult(filenames) {
    return new Promise(function (resolve, reject) {
      let writer;
      writer = new SpriteImages(metadata, options, filenames);
      writer.on('error', onError);
      writer.on('success', onSuccess);

      function onError(err) {
        reject(err);
      }

      function onSuccess(data) {
        resolve(data);
      }
    });
  }
};