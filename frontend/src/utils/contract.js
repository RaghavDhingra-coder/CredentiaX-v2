import { ethers, Contract } from 'ethers'
import ABI from '../abis/CredentialRegistry.json'

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || ''
export const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '31337', 10)

export function isContractConfigured() {
  return !!CONTRACT_ADDRESS
}

// Encode cert ID string → bytes32 (must match backend encodeId())
export function toBytes32Id(certId) {
  const hex = ethers.hexlify(ethers.toUtf8Bytes(certId))
  return ethers.zeroPadBytes(hex, 32)
}

// Convert 64-char SHA-256 hex → 0x-prefixed bytes32
export function toBytes32Hash(hexHash) {
  return '0x' + hexHash.padStart(64, '0').slice(0, 64)
}

// Instantiate contract with a MetaMask signer for write operations
export function getIssuerContract(signer) {
  if (!CONTRACT_ADDRESS) throw new Error('VITE_CONTRACT_ADDRESS is not configured')
  return new Contract(CONTRACT_ADDRESS, ABI, signer)
}

/**
 * Call issueCredential on-chain with all metadata hashes.
 *
 * payload comes directly from the /prepare-issuance backend response:
 *   { credentialIdBytes32, credentialHashBytes32,
 *     nameHash, usnHash, courseHash, gradeHash, dateHash,
 *     subjectAddress, expiresAt }
 */
export async function issueOnChain({ signer, certId, payload }) {
  const contract = getIssuerContract(signer)

  const credentialId   = payload.credentialIdBytes32   || toBytes32Id(certId)
  const credentialHash = payload.credentialHashBytes32 || ethers.ZeroHash
  const nameHash       = payload.nameHash   || ethers.ZeroHash
  const usnHash        = payload.usnHash    || ethers.ZeroHash
  const courseHash     = payload.courseHash || ethers.ZeroHash
  const gradeHash      = payload.gradeHash  || ethers.ZeroHash
  const dateHash       = payload.dateHash   || ethers.ZeroHash
  const subject        = payload.subjectAddress || ethers.ZeroAddress
  const expiry         = payload.expiresAt  || Math.floor(Date.now() / 1000) + 100 * 365 * 24 * 3600

  return contract.issueCredential(
    credentialId,
    credentialHash,
    nameHash,
    usnHash,
    courseHash,
    gradeHash,
    dateHash,
    subject,
    expiry,
  )
}
