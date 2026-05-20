import { ethers } from 'ethers'

// Encode a human-readable cert ID string into bytes32 (UTF-8, zero-padded right).
// Must match the frontend's toBytes32Id() implementation exactly.
export function encodeId(certId) {
  const hex = ethers.hexlify(ethers.toUtf8Bytes(certId))
  return ethers.zeroPadBytes(hex, 32)
}

// Convert a 64-char SHA-256 hex string into a 0x-prefixed bytes32 value.
export function encodeHash(sha256Hex) {
  return '0x' + sha256Hex.padStart(64, '0').slice(0, 64)
}

// Unix timestamp 100 years from now — used as a non-expiring credential marker.
export function farFutureExpiry() {
  return Math.floor(Date.now() / 1000) + 100 * 365 * 24 * 3600
}
