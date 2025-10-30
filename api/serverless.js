// Vercel serverless function entry point
// This imports the built server and wraps it for serverless deployment
const serverless = require('serverless-http');

// Import the built server module
const serverBuild = require('../dist/server/production.cjs');

// Get the createServer function and create the app
const createServer = serverBuild.createServer || serverBuild.default?.createServer;

if (!createServer) {
  throw new Error('createServer function not found in server build. Available exports: ' + Object.keys(serverBuild).join(', '));
}

const app = createServer();

// Wrap the Express app for serverless deployment
module.exports = serverless(app);