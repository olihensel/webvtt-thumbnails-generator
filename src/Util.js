'use strict';

var FFmpeg = require('fluent-ffmpeg')
  , fs = require('fs')
  , moment = require('moment');


/**
 * generateThumbnails() callback
 *
 * @callback thumbnailsCallback
 * @param {Error} err Any kind of error
 * @param {string[]} filenames Thumbnails names
 */

/**
 * Generate thumbnails
 *
 * @param {string} inputVideo Path to video file
 * @param {object} options No comments
 * @param {thumbnailsCallback} callback Accepts arguments: (err, filenames)
 */
exports.generateThumbnails = function (inputVideo, options, callback) {
  new FFmpeg({source: inputVideo})
    .on('error', onError)
    .on('filenames', onFileName)
    .on('end', onSuccess)
    .takeScreenshots(
      {
        size: parseInt(options.thumbnailSize.width) + 'x' + options.thumbnailSize.height,
        timemarks: options.timemarks,
        filename: '%s.png'
      },
      options.outputThumbnailDirectory
    );

  function onFileName(filenames) {
    this.filenames = filenames;
  }

  function onError(err) {
    callback(err)
  }

  function onSuccess() {
    callback(null, this.filenames)
  }
};


/**
 * metadata() callback
 *
 * @callback metadataCallback
 * @param {Error} err Any kind of error
 * @param {object} metadata Duration, size, etc.
 */

/**
 * Get simple metadata for video
 *
 * @param {string} inputVideo Path to video file
 * @param {metadataCallback} callback Accepts arguments: (err, metadata)
 */
exports.metadata = function (inputVideo, callback) {
  FFmpeg.ffprobe(inputVideo, onData);

  function onData(err, metadata) {
    if (err) {
      return callback(err)
    }

    var streams = metadata.streams
      , stream;

    if (!streams) {
      return callback(new Error('Unknown error running ffprobe'))
    }

    while (stream = streams.shift()) {
      if (stream.codec_type === 'video') {
        return callback(null, {
          duration: parseFloat(metadata.format.duration),
          width: parseInt(stream.width, 10),
          height: parseInt(stream.height, 10),
          fps: parseInt((stream.r_frame_rate || stream.avg_frame_rate).replace(/\/1/, ''), 10)
        })
      }
    }

    return callback(new Error('Source video file does not have video stream.'))
  }
};

exports.deleteFiles = function (files, callback) {
  var i = files.length;
  files.forEach(function (path) {
    fs.unlink(path, function (err) {
      i--;
      if (err) {
        callback(err);
      } else if (i <= 0) {
        callback(null);
      }
    });
  });
};

/**
 * Create timemark from number
 *
 * @param {float|string} mark
 * @returns {string} Formatted timemark
 */
exports.toTimemark = function (mark) {
  var m = moment(mark + '', 'X.SSS');
  return m.utc().format('HH:mm:ss.SSS')
};