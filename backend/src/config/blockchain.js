import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { config } from './env.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadABI() {
  const artifactPath = join(__dirname, '../../../smart-contracts/artifacts/contracts/CredentialRegistry.sol/CredentialRegistry.json')
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))
  return artifact.abi
}

export function isBlockchainConfigured() {
  // Contract address and RPC are sufficient — private key is no longer used for issuance
  return !!(config.blockchain.rpcUrl && config.blockchain.contractAddress)
}

export function getProvider() {
  // For local hardhat, fall back to localhost:8545
  const url = config.blockchain.rpcUrl || 'http://127.0.0.1:8545'
  return new ethers.JsonRpcProvider(url)
}

export function getSigner() {
  const provider = getProvider()
  if (!config.blockchain.privateKey) throw new Error('PRIVATE_KEY is not configured')
  return new ethers.Wallet(config.blockchain.privateKey, provider)
}

export function getContract() {
  if (!config.blockchain.contractAddress) throw new Error('CONTRACT_ADDRESS is not configured')
  const signer = getSigner()
  const abi = loadABI()
  return new ethers.Contract(config.blockchain.contractAddress, abi, signer)
}

export function getReadOnlyContract() {
  if (!config.blockchain.contractAddress) throw new Error('CONTRACT_ADDRESS is not configured')
  const provider = getProvider()
  const abi = loadABI()
  return new ethers.Contract(config.blockchain.contractAddress, abi, provider)
}
