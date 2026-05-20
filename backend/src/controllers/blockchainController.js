import { blockchainService } from '../services/blockchainService.js'
import { successResponse } from '../utils/response.js'

export const blockchainController = {
  status(req, res) {
    return successResponse(res, {
      configured: blockchainService.isConfigured(),
      network: 'Polygon Amoy',
      chainId: 80002,
    })
  },

  async testIssue(req, res, next) {
    try {
      const { credentialId, credentialHash, subjectAddress, expiresAt } = req.body
      const result = await blockchainService.issueCredentialOnChain({
        credentialId,
        credentialHash,
        subjectAddress,
        expiresAt,
      })
      return successResponse(res, result, 201)
    } catch (err) {
      next(err)
    }
  },

  async verify(req, res, next) {
    try {
      const result = await blockchainService.verifyCredentialOnChain(req.params.credentialId)
      return successResponse(res, result)
    } catch (err) {
      next(err)
    }
  },

  async revoke(req, res, next) {
    try {
      const { credentialId } = req.body
      const result = await blockchainService.revokeCredentialOnChain(credentialId)
      return successResponse(res, result)
    } catch (err) {
      next(err)
    }
  },
}
