// Vercel API route for /api/dashboard
const { createServer } = require('../dist/server/node-build.js');

// Create the Express app
const app = createServer();

// Export the handler
module.exports = (req, res) => {
  // Setting the CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Create a mock request object that matches Express expectations
  req.url = '/api/dashboard';
  req.path = '/api/dashboard';
  
  // Use the Express app to handle the request
  app(req, res);
};