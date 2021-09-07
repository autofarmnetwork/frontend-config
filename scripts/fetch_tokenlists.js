const axios = require('axios')

const dexTokenLists = [
  { chain: "bsc", name: "pcs", eval:"res.data.tokens", tokenList: "https://raw.githubusercontent.com/pancakeswap/pancake-toolkit/master/packages/token-lists/lists/pancakeswap-extended.json" },
  { chain: "polygon", name: "quickswap", eval:"res.data", tokenList: "https://raw.githubusercontent.com/sameepsi/quickswap-default-token-list/master/src/tokens/mainnet.json" },
  { chain: "polygon", name: "cometh", eval:"res.data", tokenList: "https://raw.githubusercontent.com/cometh-game/default-token-list/master/src/tokens/matic.json" },
  
  { chain: "bsc", name: "sushi", eval:"res.data", tokenList: "https://raw.githubusercontent.com/sushiswap/list/master/packages/default-token-list/tokens/bsc.json" },
  { chain: "heco", name: "sushi", eval:"res.data", tokenList: "https://raw.githubusercontent.com/sushiswap/list/master/packages/default-token-list/tokens/heco.json" },
  { chain: "polygon", name: "sushi", eval:"res.data", tokenList: "https://raw.githubusercontent.com/sushiswap/list/master/packages/default-token-list/tokens/matic.json" },
  { chain: "avax", name: "sushi", eval:"res.data", tokenList: "https://raw.githubusercontent.com/sushiswap/list/master/packages/default-token-list/tokens/avalanche.json" },
  { chain: "fantom", name: "sushi", eval:"res.data", tokenList: "https://raw.githubusercontent.com/sushiswap/list/master/packages/default-token-list/tokens/fantom.json" },
  { chain: "xdai", name: "sushi", eval:"res.data", tokenList: "https://raw.githubusercontent.com/sushiswap/list/master/packages/default-token-list/tokens/xdai.json" },
  
]

const getAggregatedTokenList = async () => {
  let aggregatedTokenList = []
  for (let obj of dexTokenLists){
    let res = await axios({ method: 'get', url: obj.tokenList, })
    aggregatedTokenList = aggregatedTokenList.concat(eval(obj.eval))
  }
  console.log(aggregatedTokenList,"aggregatedTokenList", aggregatedTokenList.length, "aggregatedTokenList.length")
  return aggregatedTokenList
}

getAggregatedTokenList()


