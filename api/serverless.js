// Vercel serverless function entry point
// This imports the built server and wraps it for serverless deployment
const serverless = require('serverless-http');

// Import the built server module
const { createServer } = require('../dist/server/production.js');

const app = createServer();

module.exports = serverless(app);