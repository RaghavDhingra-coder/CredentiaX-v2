import http from 'http'

console.log('Testing server endpoints...\n')

function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        console.log(`${method} ${path}`)
        console.log(`Status: ${res.statusCode}`)
        console.log(`Response: ${data}`)
        console.log('---\n')
        resolve()
      })
    })

    req.on('error', (error) => {
      console.log(`${method} ${path}`)
      console.log(`Error: ${error.message}`)
      console.log('---\n')
      resolve()
    })

    req.end()
  })
}

async function runTests() {
  await testEndpoint('/api/v1/health')
  await testEndpoint('/api/v1/certificates/test')
  await testEndpoint('/api/v1/certificates/issue', 'POST')
  
  console.log('Tests complete!')
  process.exit(0)
}

runTests()
