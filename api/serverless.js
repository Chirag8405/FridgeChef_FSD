// Vercel serverless function entry point
const serverless = require('serverless-http');
const path = require('path');

let handler;

try {
  // Load the server build from .output (copied during postbuild)
  const serverPath = path.join(__dirname, '.output/server.cjs');
  
  const serverModule = require(serverPath);
  
  // Use the pre-created app instance (not createServer which would reinitialize)
  const app = serverModule.app;
  
  if (!app) {
    throw new Error('Express app not found in server.cjs exports');
  }
  
  // Create serverless handler
  handler = serverless(app, {
    binary: ['image/*', 'application/octet-stream']
  });
  
  console.log('✓ Serverless function initialized successfully');
} catch (error) {
  console.error('✗ Fatal error initializing serverless function:', error);
  
  // Export an error handler
  handler = async (req, res) => {
    console.error('Error handler called:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Serverless function failed to initialize',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  };
}

module.exports = handler;