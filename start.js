const Web3 = require('web3');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const axios = require('axios');
const coinMarketApi = '0fc76be4-e648-49d3-8e8a-d09b758bc675';
const coinUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?symbol=&`;
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");
const BananaGunRouter = '0xdB5889E35e379Ef0498aaE126fc2CCE1fbD23216'; // Replace with the actual token contract address
const mastroRouter = '0x80a64c6D7f12C47B7c66c5B4E20E72bc1FCd5d9e'; // Replace with the actual token contract address
let wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH token address
let daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI token address

const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = '6380901957:AAH9MwW4odTi3SwUZmeCn-JzwfFXXr5oh4Q';

const providerUrl = 'wss://mainnet.infura.io/ws/v3/3420579b4eb641de9cca55a9f72687b4';
const web3 = new Web3(providerUrl);

// Define the smart contract ABI and address of each exchange you want to monitor:
const uniswapEthAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const uniswapV3EthAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const uniswapEthABI = require('./uniswapV2.json');
const uniswapV3ABI = require('./uniswapV3.json');
const uniswapFactoryContract = new web3.eth.Contract(uniswapEthABI, uniswapEthAddress);
const uniswapV3FactoryContract = new web3.eth.Contract(uniswapV3ABI, uniswapV3EthAddress);

const bot = new TelegramBot(BOT_TOKEN, {
    polling: true,
  });

  
let bananaGunCount = 0;
let mastroCount = 0;

bot.onText(/\/start/, async function (msg) {
    const getTokenStatusFor20s = async (tokenAddress,msg) => {
        bananaGunCount = 0
        mastroCount = 0;
        // Set timeout of 20s
        const timeout = 20 * 1000;
      
        // Track start time
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
      
          // Subscribe to logs
          const subscription = web3.eth.subscribe('logs', {
            address: tokenAddress
          });
      
          subscription.on('data', async (blockHeader) => {
            const tx = await getTransactionReceipt(blockHeader.transactionHash);
            if(tx?.to?.toLowerCase() === BananaGunRouter.toLowerCase()){
                bananaGunCount ++;   
                console.log('BananaGunRouter');
            }
            if(tx?.to?.toLowerCase() === mastroRouter.toLowerCase()){
                console.log('mastroRouter');
                mastroCount ++;
            }
          });
      
          // Handle timeout
          setTimeout(() => {
            subscription.unsubscribe();
            resolve(); // resolve promise
          }, timeout);
      
        }).then(async() => {
            await getTokenInfos(tokenAddress, async function (result, result2) {
                console.log(bananaGunCount , mastroCount,'bananaGunCount + mastroCount');
                if(bananaGunCount + mastroCount >= 10){
                    bot.sendMessage(msg.chat.id,
                        `🏵 Massive Buys Detected: ${bananaGunCount+mastroCount} txs in 20 secs \n🍌Banana: ${bananaGunCount} \n🤖Mastro: ${mastroCount} \nSymbol : ${result.data[0]?.contract_ticker_symbol} \nAddress : https://etherscan.io/address/${tokenAddress}`,{
                            parse_mode:'HTML',
                            entities: [
                                {
                                  type: 'url',
                                  url: `https://etherscan.io/address/${tokenAddress}`,
                                  user: 'Address'
                                }
                              ]
                            
                          }
                    );
                    // bananaGunCount = 0;
                    // mastroCount = 0;
                }
            })
          // Calculate elapsed time
          // Resolve once timeout reached
        });
      
    }// Repeat the above process for each exchange you want to monitor
    bot.sendMessage(msg.chat.id, `Welcome ${msg.chat.first_name}`);
    uniswapFactoryContract.events.PairCreated({}, async (error, event) => {
        const pair = event.returnValues;
        const token0 = pair.token0?.toLowerCase();
        const token1 = pair.token1?.toLowerCase();
        wethAddress = wethAddress.toLowerCase();
        daiAddress = daiAddress.toLowerCase();
        let tokenAddr = token0;

        if(token0 == wethAddress || token0 == daiAddress){
            tokenAddr = token1
        }        
        if(token1 == wethAddress || token1 == daiAddress){
            tokenAddr = token0
        }
        await getTokenStatusFor20s(tokenAddr,msg)
    });
    uniswapV3FactoryContract.events.PoolCreated({},async (error,event)=>{
        const pair = event.returnValues;
        const token0 = pair.token0?.toLowerCase();
        const token1 = pair.token1?.toLowerCase();
        wethAddress = wethAddress.toLowerCase();
        daiAddress = daiAddress.toLowerCase();
        let tokenAddr = token0;

        if(token0 == wethAddress || token0 == daiAddress){
            tokenAddr = token1
        }        
        if(token1 == wethAddress || token1 == daiAddress){
            tokenAddr = token0
        }
        
        if(token0 != wethAddress && token0 != daiAddress && token1 != wethAddress && token1 != daiAddress){
           await getTokenStatusFor20s(tokenAddr,msg)
        }

    })
})
// Connect to an Ethereum node

let pairsList = [];

// Listen for new pair creation events on Uniswap (ETH)



const getTokenInfos = async (tokenAddress, callback) => {

    console.log(tokenAddress, 'tokenAddress')
    // setTimeout(async () => {
    // let response;
    const apiKey = "cqt_rQfBvGFQfc4vy9wmGTJqHVF4KfPH";
    const url = `https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/eth-mainnet/usd/${tokenAddress}/`
    const url2 = `https://api.covalenthq.com/v1/eth-mainnet/tokens/${tokenAddress}/token_holders_v2/`
    axios.all([
        axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        }),
        axios.get(url2, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        })
    ]).then(axios.spread((res1, res2) => {
        return callback(res1.data, res2.data);
    }))
        .catch(error => {
            // console.log(error, '333333333333333');
            return callback(false);
        })
}

const checkPair = (pair) => {
    for (var i = 0; i < pairsList.length; i++) {
        if (Object.keys(pairsList[i]).includes(pair)) {
            return true;
        }
    }
    return false;
}
const getHoldersPer5m = async (tokenAddress, pairAddress /*address */, minutes /** minutes */, index /**index */) => {

    setTimeout(() => {
        console.log(tokenAddress, pairAddress /*address */, minutes /** minutes */, index /**index */);
        const apiKey = "cqt_rQfBvGFQfc4vy9wmGTJqHVF4KfPH";
        const url2 = `https://api.covalenthq.com/v1/eth-mainnet/tokens/${tokenAddress}/token_holders_v2/`
        axios.get(url2, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        })
            .then(res => {
                result = res.data.data;
                var itemIndex = pairsList.findIndex(item => Object.keys(item)[0] == pairAddress);
                if (itemIndex != -1) { pairsList[itemIndex][pairAddress][index] = result.pagination.total_count; }
                io.emit("updatePair", { min_index: index, min_value: result.pagination.total_count, addr: tokenAddress })

                // pairsList.map((obj, _in) => {
                //     if (Object.keys(obj)[0] == pairAddress) {

                //         pairsList[_in][tokenAddress][index] = result.pagination.total_count;
                //         // Object.values(obj)[0][index] = result.pagination.total_count;
                //     }
                // })
                // return res.data;
            })
            .catch(error => {

                return false;
            })
    }, 1000 * 60 * minutes);

}

const getTxsper5m = async (tokenAddress, pairAddress, minutes, index) => {

    setTimeout(() => {
        console.log(tokenAddress, minutes, '333333333334444');
        var query = `
            query {
                ethereum(network: ethereum) {
                
                transfers(currency: {is: "${tokenAddress}"}) {
                    count
                }
                }
            }
            `
        var data = JSON.stringify({ query });

        var config = {
            method: 'post',
            url: 'https://graphql.bitquery.io',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': 'BQYUWG8NvrMJ96Qmuqjq6mPLLPFG48Dr'
            },
            data: data
        };
        axios(config)
            .then(res => {
                var result = res.data.data.ethereum.transfers[0].count;

                console.log(result, '343434334343')
                var itemIndex = pairsList.findIndex(item => Object.keys(item)[0] == pairAddress);
                if (itemIndex != -1) { pairsList[itemIndex][pairAddress][index] = result; }

                io.emit("updatePair", { min_index: index, min_value: result, addr: tokenAddress })

                // pairsList.map((obj, _in) => {
                //     if (Object.keys(obj)[0] == pairAddress) {
                //         console.log(result.pagination.total_count, 'result.pagination.total_count;')
                //         pairsList[_in][tokenAddress][index] = result.pagination.total_count;
                //         // console.log(Object.values(obj)[0][index], 'Object.values(obj)[0][_index]');
                //         // Object.values(obj)[0][index] = result.pagination.total_count;
                //     }
                // })
            }).catch(error => {
                console.log(error);
            })
    }, 1000 * 60 * minutes);
}

const getCoinPrice = (tokenAddress, pairAddress, minutes, index) => {

    setTimeout(() => {

        const apiKey = "6yQovJ4FlVFcu4o6rSmnPbCsIXgpM62X9vY8xHFfB3I1d2xKmwBTCs9hM9ky3hSp";
        const url = `https://deep-index.moralis.io/api/v2/erc20/${tokenAddress}/price?chain=eth&include=percent_change`
        axios.get(url, {
            headers: {
                'accept': 'application/json',
                'X-API-Key': `${apiKey}`
            }
        })
            .then(res => {
                var price = res.data.usdPrice;
                console.log(price, 'price', 'res.data.data[0].prices')
                var itemIndex = pairsList.findIndex(item => Object.keys(item)[0] == pairAddress);
                if (itemIndex != -1) { pairsList[itemIndex][pairAddress][index] = price; }
                io.emit("updatePair", { min_index: index, min_value: price, addr: tokenAddress })
            })
            .catch(error => {

            })
    }, 1000 * 60 * minutes)
}

async function getTransactionReceipt(tx) {
    return await web3.eth.getTransactionReceipt(tx);
}

// Create an express app and server
const app = express();
const server = http.createServer(app);

// Start the server
const port = 8080;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
