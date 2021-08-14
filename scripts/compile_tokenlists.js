const fsSync = require('fs');
const axios = require('axios')
const mime = require('mime-types')
const fs = require('fs/promises')
const path = require('path')
const { set, over, lensPath } = require('ramda')
const tokenlistsRoot = './tokenlists/';

const SKIP_LIST = [
  '0xaF6Bd11A6F8f9c44b9D18f5FA116E403db599f8E',
  '0x8C851d1a123Ff703BD1f9dabe631b69902Df5f97',
  '0xA6c897CaaCA3Db7fD6e2D2cE1a00744f40aB87Bb',
  '0x8D047F4F57A190C96c8b9704B39A1379E999D82B',
  '0xb3a6381070B1a15169DEA646166EC0699fDAeA79',
  '0xc732B6586A93b6B7CF5FeD3470808Bc74998224D',
  '0x68E374F856bF25468D365E539b700b648Bf94B67',
  '0x09607078980CbB0665ABa9c6D1B84b8eAD246aA0',
  '0x394bBA8F309f3462b31238B3fd04b83F71A98848',
  '0xE4Ae305ebE1AbE663f261Bc00534067C80ad677C',
  '0xFAfD4CB703B25CB22f43D017e7e0d75FEBc26743',
  '0xFbe0b4aE6E5a200c36A341299604D5f71A5F0a48',
  '0xD90BBdf5904cb7d275c41f897495109B9A5adA58',
]

const CHAINS = {
  BSC: 56,
  HECO: 128,
  POLYGON: 137,
  AVAX: 43114,
  FANTOM: 250,
  MOONRIVER: 1285,
  OKEX: 66,
  CELO: 42220,
  HARMONY: 1666600000,
  XDAI: 100,
  // ARBITRUM: 42161,
  CRONOS: 25,
  BOBA: 288,
  VELAS: 106,
  AURORA: 1313161554,
  OASIS: 42262,
}

const aggregatedTokenList = fsSync.readdirSync(tokenlistsRoot, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(({ name: chain }) => {
    const chainTokenlistsRoot = path.join(tokenlistsRoot, chain)
    let ts = fsSync.readdirSync(chainTokenlistsRoot)
      .map(t => {
        const f = path.join(chainTokenlistsRoot, t)
        const tokenlist = JSON.parse(fsSync.readFileSync(f, {encoding:'utf8'}))
        return tokenlist.tokens
      })
      .reduce((acc, x) => [...acc, ...x], [])
      // remove duplicates
      .reduce((acc, token) => {
        if (acc[token.address.toLowerCase()]) {
          const urisLens = lensPath([token.address.toLowerCase(), 'logoURIs'])
          const addBackup = (arr) => arr.includes(token.logoURI) ? arr : [...arr, token.logoURI]
          return over(urisLens, addBackup, acc)
        }
        return {
          ...acc,
          [token.address.toLowerCase()]: {
            ...token,
            logoURIs: [token.logoURI]
          }
        }
      }, {})
    ts = Object.values(ts)

    // Order by symbol
    ts.sort((a, b) => {
      const symbolA = a.symbol.toUpperCase()
      const symbolB = b.symbol.toUpperCase()
      if (symbolA < symbolB) {
        return -1;
      }
      if (symbolA > symbolB) {
          return 1;
      }
      return 0;
    })
    return ts
  })
  .reduce((acc, x) => [...acc, ...x], [])
  // remove duplicates cross-chain
  .reduce((acc, token) => {
    if (!acc.map[token.chainId]) {
      acc.map[token.chainId] = {}
    }
    if (acc.map[token.chainId][token.address.toLowerCase()]) {
      return acc
    }
    if (!Object.values(CHAINS).includes(parseInt(token.chainId))) {
      return acc
    }
    return {
      tokenlist: [...acc.tokenlist, token],
      map: {
        ...acc.map,
        [token.chainId]: {
          ...acc.map[token.chainId],
          [token.address.toLowerCase()]: true
        }
      }
    }
  }, { tokenlist: [], map: {} })
  .tokenlist


const result = {
  name: "Autofarm Default List",
  timestamp: new Date(),
  version: {
    "major": 1,
    "minor": 1,
    "patch": 0
  },
  tags: {},
  logoURI: "",
  keywords: [
    "autofarm",
    "default"
  ],
  tokens: aggregatedTokenList
}
// console.log(JSON.stringify(result, null, 2))

const baseDir = './images'
const tokensBaseURL = 'https://tokens.autofarm.network'

async function downloadImages() {
  let tokensDownloadedImage = fsSync.readdirSync(baseDir)
    .reduce((acc, f) => {
      const ca = f.split('.')[0]
      const [c, a] = ca.split('-')
      if (!a) {
        return acc
      }
      return { ...acc, [c]: { ...(acc[c] || {}), [a]: acc[c]?.[a]?.includes('webp') ? acc[c][a] : f } }
    }, {})

  for (const token of result.tokens) {
    if (token.logoURIs?.every(uri => uri?.includes('http://'))) {
      token.exclude = true
      continue
    }
    if (tokensDownloadedImage[token.chainId]?.[token.address.toLowerCase()] ||
      SKIP_LIST.includes(token.address)
    ) {
      token.logoURI = tokensBaseURL + '/' + tokensDownloadedImage[token.chainId]?.[token.address.toLowerCase()]
      delete token.logoURIs
      continue
    }
    const logoURIs = token.logoURIs
    console.error('Downloading', token.chainId, token.address, token.symbol, token.logoURIs)
    const images = await Promise.all(
      logoURIs.map(uri => axios({
        method: 'get',
        url: uri,
        responseType: 'stream'
      }).catch(err => {}))
    )
    const image = images.filter(Boolean)
      .filter(({ status, headers }) =>
        status === 200 && mime.extension(headers['content-type']) !== 'html'
      )[0]

    if (!image) {
      console.error('not found', token.address, token.symbol)
      continue
    }
    const extension = mime.extension(image.headers['content-type'])
    const filename = token.chainId + '-' + token.address.toLowerCase() + '.' + extension
    const filepath = path.join(baseDir, filename)
    image.data.pipe(fsSync.createWriteStream(filepath))
    token.logoURI = tokensBaseURL + '/' + filename
    delete token.logoURIs
    // await fs.writeFile(, image.data)
    //break
  }

  result.tokens = result.tokens.filter(({ exclude }) => exclude !== true)

  console.log(JSON.stringify(result, null, 2))
}

downloadImages()
