// Vercel catch-all API route for all /api/* requests
const serverless = require('serverless-http');

// Import the built server module
const { createServer } = require('../../dist/server/node-build.js');

const app = createServer();

// Wrap with serverless-http
const handler = serverless(app);

module.exports = async (req, res) => {
  // Set CORS headers for all API requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  return handler(req, res);
};