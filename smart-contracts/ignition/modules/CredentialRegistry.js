const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules')

module.exports = buildModule('CredentialRegistryModule', (m) => {
  const credentialRegistry = m.contract('CredentialRegistry')
  return { credentialRegistry }
})
