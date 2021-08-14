const AWS = require('aws-sdk')
const fs = require('fs')

const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT)
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET
})

function uploadToS3(fileName, fileContent, ContentType = 'application/json') {
  var params = {
    Bucket: process.env.SPACES_BUCKET,
    Key: fileName,
    Body: fileContent,
    ACL: "public-read",
    ContentType
  }

  return new Promise((resolve, reject) => {
    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        reject(err)
      }
      else {
        console.log(data);
        resolve(data)
      }
    })
  })
}

module.exports = {
  uploadToS3
}

