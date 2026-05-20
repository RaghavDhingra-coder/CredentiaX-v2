export function getHealth(req, res) {
  res.json({
    success: true,
    message: 'CredentiaX API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
}
