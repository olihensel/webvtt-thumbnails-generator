const ThumbnailGenerator = require('../src/index');
ThumbnailGenerator(
  './249b85cc8518ddd150fffb1b8068c103e373ef38.mp4',
  {
    secondsPerThumbnail: 5,
    outputDirectory: './result',
    outputFileName: '249b85cc8518ddd150fffb1b8068c103e373ef38'
  },
  function (data) {
    console.log(data)
  }
);
