#!/usr/bin/env node

import http from 'http';

console.log('🧪 Testing Backend Routes Directly\n');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body, headers: res.headers });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  try {
    console.log('1️⃣  Testing: GET /api/v1/health');
    const health = await makeRequest('GET', '/api/v1/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Body: ${health.body}\n`);

    console.log('2️⃣  Testing: GET /api/v1/certificates/test');
    const test = await makeRequest('GET', '/api/v1/certificates/test');
    console.log(`   Status: ${test.status}`);
    console.log(`   Body: ${test.body}\n`);

    console.log('3️⃣  Testing: POST /api/v1/certificates/issue (no auth - should fail)');
    const issue = await makeRequest('POST', '/api/v1/certificates/issue', {
      holderId: 'test',
      title: 'Test',
      course: 'Test',
      issueDate: '2026-05-20'
    });
    console.log(`   Status: ${issue.status}`);
    console.log(`   Body: ${issue.body}\n`);

    console.log('✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log('   - Health endpoint: ' + (health.status === 200 ? '✅ Working' : '❌ Failed'));
    console.log('   - Test endpoint: ' + (test.status === 200 ? '✅ Working' : '❌ Failed'));
    console.log('   - Issue endpoint: ' + (issue.status === 401 ? '✅ Working (auth required)' : '❌ Failed'));
    
    if (health.status === 200 && test.status === 200 && issue.status === 401) {
      console.log('\n🎉 Backend routes are working correctly!');
      console.log('   The issue is with the frontend proxy, not the backend.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Backend server might not be running on port 3001');
  }
  
  process.exit(0);
}

// Wait 3 seconds for server to start
setTimeout(runTests, 3000);
