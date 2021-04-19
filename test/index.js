const ThumbnailGenerator = require("../src/index");
async function main() {
  try {
    const thumbs = await ThumbnailGenerator(
      "249b85cc8518ddd150fffb1b8068c103e373ef38.mp4",
      {
        secondsPerThumbnail: 30,
        thumbnailSize: { width: 128, height: 72 },
        spriteColumns: 8,
        spriteImages: true,
        outputDirectory: "./result",
        outputFileName: "249b85cc8518ddd150fffb1b8068c103e373ef38",
      }
    );
    console.log(thumbs);
  } catch (e) {
    console.error("Error!", e);
  }
}
main();
