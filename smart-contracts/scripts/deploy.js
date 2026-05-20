const { ethers } = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with account:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Account balance:', ethers.formatEther(balance), 'ETH')

  const CredentialRegistry = await ethers.getContractFactory('CredentialRegistry')
  const registry = await CredentialRegistry.deploy()
  await registry.waitForDeployment()

  const address = await registry.getAddress()
  console.log('CredentialRegistry deployed to:', address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
