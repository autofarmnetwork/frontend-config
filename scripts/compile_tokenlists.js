const fs = require('fs');
const path = require('path')
const tokenlistsRoot = '../tokenlists/';

const aggregatedTokenList = fs.readdirSync(tokenlistsRoot, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(({ name: chain }) => {
    const chainTokenlistsRoot = path.join(tokenlistsRoot, chain)
    const ts = fs.readdirSync(chainTokenlistsRoot)
      .map(t => {
        const f = path.join(chainTokenlistsRoot, t)
        const tokenlist = JSON.parse(fs.readFileSync(f, {encoding:'utf8'}))
        return tokenlist.tokens
      })
      .reduce((acc, x) => [...acc, ...x], [])
      // remove duplicates
      .reduce((acc, token) => {
        const { byAddress, tokens } = acc
        if (byAddress[token.address.toLowerCase()]) {
          return acc
        }
        return {
          byAddress: {
            ...byAddress,
            [token.address.toLowerCase()]: true
          },
          tokens: [...tokens, token]
        }
      }, { byAddress: {}, tokens: []})
      .tokens

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
    return chain
  })
  .reduce((acc, x) => [...acc, ...x], [])

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
console.log(JSON.stringify(result))

