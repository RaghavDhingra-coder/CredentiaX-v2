const hre = require('hardhat')

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  console.log('Deploying with:', deployer.address)

  const Factory = await hre.ethers.getContractFactory('CredentialRegistry')
  const contract = await Factory.deploy()
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log('CredentialRegistry deployed to:', address)
  console.log('')
  console.log('Add to backend/.env:')
  console.log('CONTRACT_ADDRESS=' + address)
  console.log('')
  console.log('Add to frontend/.env:')
  console.log('VITE_CONTRACT_ADDRESS=' + address)
  console.log('VITE_CHAIN_ID=31337')
}

main().catch((err) => { console.error(err); process.exit(1) })
