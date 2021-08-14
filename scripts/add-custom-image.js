const fsSync = require('fs');
const sharp = require('sharp')
const { ethers } = require('ethers')
const mime = require('mime-types')
const fs = require('fs/promises')
const axios = require('axios')
const path = require('path')

const config = require('../config')
const { uploadToS3 } = require('../spaces')

const baseDir = './images'
const TOKENS_BASE_URL = 'https://tokens.autofarm.network'

async function addCustomToken(chainId, addressRaw, logoURI) {
  const address = ethers.utils.getAddress(addressRaw)
  const chainConfig = config.chainConfigs[chainId]
  const customTokenList = require(`../tokenlists/${chainConfig.name}/custom.json`)

  const tokenIndex = customTokenList.tokens.map(({ address }) => address).indexOf(address)

  if (tokenIndex >= 0) {
    console.error('Token already in the list. This will replace the image')
    customTokenList.tokens.splice(tokenIndex, 1)
  }

  const { multicall } = chainConfig
  const { tokenInfo } = await multicall({
    tokenInfo: {
      abi: require('../abis/ERC20.json').abi,
      calls: [
        {
          address,
          name: 'decimals',
          params: [],
          unwrap: true,
        },
        {
          address,
          name: 'symbol',
          params: [],
          unwrap: true,
        },
        {
          address,
          name: 'name',
          params: [],
          unwrap: true,
        },
      ]
    }
  })
  const [decimals, symbol, name] = tokenInfo
  console.error(tokenInfo)
  console.error(chainConfig.name)

  let iamge, extension, filename, filepath

  if (logoURI.includes('png;base64')) {
    const base64Data = logoURI.replace(/^data:image\/png;base64,/, "");
    extension = 'png'
    filename = chainId + '-' + address.toLowerCase() + '.' + extension
    filepath = path.join(baseDir, filename)
    await fs.writeFile(filepath, base64Data, 'base64')
  } else if (!logoURI.includes('.svg')) {
    image = await axios({ method: 'get', url: logoURI, responseType: 'stream' })

    extension = mime.extension(image.headers['content-type'])
    filename = chainId + '-' + address.toLowerCase() + '.' + extension
    filepath = path.join(baseDir, filename)
    const stream = image.data.pipe(fsSync.createWriteStream(filepath))
    await new Promise(resolve => {
      stream.on('finish', () => {
        resolve()
      })
    })
    console.log(image.data)
    console.log('saved', logoURI, filepath)
  } else {
    image = await axios({ method: 'get', url: logoURI, responseType: 'text/plain' })

    extension = mime.extension(image.headers['content-type'])
    filename = chainId + '-' + address.toLowerCase() + '.' + extension
    filepath = path.join(baseDir, filename)
    await fs.writeFile(filepath, image.data)
  }


  if (!process.env.SPACES_KEY && !process.env.LOCAL) {
    // process.stdout.write(JSON.stringify(farmData))
    process.exit(0)
    return
  }
  console.error('Uploading image')

  console.log(filepath)
  const inputBuffer = fsSync.readFileSync(filepath)
  console.log(inputBuffer)

  const newFilename = chainId + '-' + address.toLowerCase() + '.webp'
  const newFilePath = 'images/' +  newFilename

  await sharp(inputBuffer)
    .resize(128, 128)
    .toFile(newFilePath)
  console.log('done')
  const imageData = fsSync.readFileSync(newFilePath)
  await uploadToS3(newFilename, imageData, 'image/webp')

  customTokenList.tokens.push({
    name,
    address,
    symbol,
    decimals,
    chainId: parseInt(chainId),
    logoURI: TOKENS_BASE_URL + '/' + newFilename
  })
  console.error(customTokenList)
  await fs.writeFile(`./tokenlists/${chainConfig.name}/custom.json`, JSON.stringify(customTokenList, null, 2))
}

addCustomToken(...process.argv.slice(2))

