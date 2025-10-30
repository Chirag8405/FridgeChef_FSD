// Vercel serverless function entry point
// This imports the built server and wraps it for serverless deployment
const serverless = require('serverless-http');

// Import the serverless build (no app.listen() calls)
const serverBuild = require('../dist/serverless/serverless.cjs');

// Get the Express app
const app = serverBuild.app || serverBuild.default?.app;

if (!app) {
  throw new Error('Express app not found in serverless build. Available exports: ' + Object.keys(serverBuild).join(', '));
}

// Wrap the Express app for serverless deployment
module.exports = serverless(app);