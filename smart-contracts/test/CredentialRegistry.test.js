const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('CredentialRegistry', () => {
  let registry
  let owner, issuer, subject, other

  const futureExpiry = () => Math.floor(Date.now() / 1000) + 86400 * 365

  beforeEach(async () => {
    ;[owner, issuer, subject, other] = await ethers.getSigners()
    const Factory = await ethers.getContractFactory('CredentialRegistry')
    registry = await Factory.deploy()
    await registry.waitForDeployment()
  })

  describe('Issuer management', () => {
    it('owner is authorized issuer by default', async () => {
      expect(await registry.authorizedIssuers(owner.address)).to.be.true
    })

    it('owner can authorize a new issuer', async () => {
      await registry.authorizeIssuer(issuer.address)
      expect(await registry.authorizedIssuers(issuer.address)).to.be.true
    })

    it('non-owner cannot authorize issuers', async () => {
      await expect(
        registry.connect(other).authorizeIssuer(issuer.address)
      ).to.be.revertedWith('Not owner')
    })
  })

  describe('Credential lifecycle', () => {
    const credId = ethers.keccak256(ethers.toUtf8Bytes('cred-001'))
    const credHash = ethers.keccak256(ethers.toUtf8Bytes('data-hash'))

    it('authorized issuer can issue a credential', async () => {
      await expect(
        registry.issueCredential(credId, credHash, subject.address, futureExpiry())
      ).to.emit(registry, 'CredentialIssued')
    })

    it('issued credential is verifiable', async () => {
      await registry.issueCredential(credId, credHash, subject.address, futureExpiry())
      const [valid, reason] = await registry.verifyCredential(credId)
      expect(valid).to.be.true
      expect(reason).to.equal('Valid')
    })

    it('revoked credential fails verification', async () => {
      await registry.issueCredential(credId, credHash, subject.address, futureExpiry())
      await registry.revokeCredential(credId)
      const [valid, reason] = await registry.verifyCredential(credId)
      expect(valid).to.be.false
      expect(reason).to.equal('Credential has been revoked')
    })

    it('unauthorized address cannot issue credentials', async () => {
      await expect(
        registry.connect(other).issueCredential(credId, credHash, subject.address, futureExpiry())
      ).to.be.revertedWith('Not an authorized issuer')
    })
  })
})
