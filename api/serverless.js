// Vercel serverless function entry point
// This imports the built server and wraps it for serverless deployment
const serverless = require('serverless-http');
const path = require('path');

// Import the serverless build (no app.listen() calls)
// Try both possible paths - Vercel might change directory structure
let serverBuild;
try {
  serverBuild = require('../dist/serverless/serverless.cjs');
} catch (err) {
  console.error('Failed to load from dist/serverless, trying alternative path:', err.message);
  try {
    // Try from root if dist/serverless doesn't exist
    serverBuild = require(path.join(__dirname, '../dist/serverless/serverless.cjs'));
  } catch (err2) {
    console.error('Failed to load serverless build:', err2.message);
    throw new Error('Could not load serverless build from any known path. Build may have failed or files are missing.');
  }
}

// Get the Express app
const app = serverBuild.app || serverBuild.default?.app;

if (!app) {
  const availableExports = Object.keys(serverBuild).join(', ');
  throw new Error(`Express app not found in serverless build. Available exports: ${availableExports || 'none'}`);
}

console.log('Serverless function initialized successfully');

// Wrap the Express app for serverless deployment
module.exports = serverless(app);