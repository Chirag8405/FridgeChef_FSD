// Test script to verify serverless function works locally
const handler = require('./api/serverless.js');

// Simulate a Vercel request
const mockReq = {
  method: 'GET',
  url: '/api/health',
  path: '/api/health',
  headers: {
    host: 'localhost:3000',
    'user-agent': 'test'
  },
  query: {},
  body: {}
};

const mockRes = {
  statusCode: 200,
  headers: {},
  setHeader(key, value) {
    this.headers[key] = value;
  },
  writeHead(statusCode, headers) {
    this.statusCode = statusCode;
    if (headers) Object.assign(this.headers, headers);
  },
  write(data) {
    console.log('Response body:', data.toString());
  },
  end(data) {
    if (data) console.log('Response end:', data.toString());
    console.log('Status:', this.statusCode);
    console.log('Headers:', this.headers);
  }
};

console.log('Testing serverless function...');
handler(mockReq, mockRes);
