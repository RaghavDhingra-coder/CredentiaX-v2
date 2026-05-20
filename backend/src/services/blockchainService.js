import { ethers } from 'ethers'
import { getContract, getReadOnlyContract, isBlockchainConfigured } from '../config/blockchain.js'
import { AppError } from '../utils/AppError.js'

function toBytes32(value) {
  const hex = ethers.hexlify(ethers.toUtf8Bytes(value))
  if (hex.length > 66) throw new AppError('ID too long for bytes32', 400)
  return ethers.zeroPadBytes(hex, 32)
}

export const blockchainService = {
  isConfigured: isBlockchainConfigured,

  async issueCredentialOnChain({ credentialId, credentialHash, subjectAddress, expiresAt }) {
    if (!isBlockchainConfigured()) throw new AppError('Blockchain is not configured on this server', 503)

    const contract = getContract()
    const idBytes32   = toBytes32(credentialId)
    const hashBytes32 = typeof credentialHash === 'string' && credentialHash.startsWith('0x')
      ? credentialHash.padEnd(66, '0').slice(0, 66)
      : toBytes32(credentialHash)

    const expiryTimestamp = expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : 0

    const tx = await contract.issueCredential(idBytes32, hashBytes32, subjectAddress, expiryTimestamp)
    const receipt = await tx.wait()

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      credentialId,
      credentialHash,
      subjectAddress,
      expiresAt,
    }
  },

  async verifyCredentialOnChain(credentialId) {
    if (!isBlockchainConfigured()) throw new AppError('Blockchain is not configured on this server', 503)

    const contract = getReadOnlyContract()
    const idBytes32 = toBytes32(credentialId)

    const [valid, statusCode] = await contract.verifyCredential(idBytes32)
    const STATUS_REASONS = ['Valid', 'Credential does not exist', 'Credential has been revoked', 'Credential has expired']
    const reason = STATUS_REASONS[Number(statusCode)] || 'Unknown'

    const issuer   = await contract.credIssuer(idBytes32)
    const issuedAt = await contract.credIssuedAt(idBytes32)
    const expiresAt = await contract.credExpiresAt(idBytes32)
    const revoked  = await contract.credRevoked(idBytes32)

    return {
      credentialId,
      valid,
      reason,
      issuer,
      issuedAt: Number(issuedAt),
      expiresAt: Number(expiresAt),
      revoked,
    }
  },

  async revokeCredentialOnChain(credentialId) {
    if (!isBlockchainConfigured()) throw new AppError('Blockchain is not configured on this server', 503)

    const contract = getContract()
    const idBytes32 = toBytes32(credentialId)

    const tx = await contract.revokeCredential(idBytes32)
    const receipt = await tx.wait()

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      credentialId,
    }
  },
}
