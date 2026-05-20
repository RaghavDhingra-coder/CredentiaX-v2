require('dotenv').config()
require('@nomicfoundation/hardhat-toolbox')

const PRIVATE_KEY = process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.startsWith('0x')
  ? process.env.PRIVATE_KEY
  : '0x' + '0'.repeat(64)

const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/placeholder'
const AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    sepolia: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    amoy: {
      url: AMOY_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 80002,
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
}
