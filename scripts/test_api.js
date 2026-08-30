// Test the API routes directly
const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`GET ${path} => status: ${res.statusCode}`);
        try {
          console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
        } catch {
          console.log('Raw response:', data);
        }
        resolve();
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  await get('/api/business-categories');
  await get('/api/business-types');
}

main().catch(console.error);
