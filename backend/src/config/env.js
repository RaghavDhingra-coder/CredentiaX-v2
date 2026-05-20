import 'dotenv/config'

function required(key) {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  blockchain: {
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || '',
    privateKey: process.env.PRIVATE_KEY || '',
    contractAddress: process.env.CONTRACT_ADDRESS || '',
    chainId: parseInt(process.env.CHAIN_ID || '31337', 10),
  },
  appUrl: process.env.APP_URL || 'http://127.0.0.1:5173',
}
