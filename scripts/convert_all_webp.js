const fsSync = require('fs');
const sharp = require('sharp')
const path = require('path')
const baseDir = './images'

let tokensDownloadedImage = fsSync.readdirSync(baseDir)

for (const image of tokensDownloadedImage) {
  if (image.indexOf('-') < 0) {
    continue
  }
  const filepath = path.join(baseDir, image)
  console.log(filepath)
  const inputBuffer = fsSync.readFileSync(filepath)
  if (inputBuffer.length <= 0) {
    continue
  }
  const filenameWithoutExtension = image.split('.')[0]
  sharp(inputBuffer)
    .resize(128, 128)
    .toFile('images-new/' + filenameWithoutExtension + '.webp', (err) => {
      if (err) {
        console.error(err)
      }
    })
}

console.log(tokensDownloadedImage)
