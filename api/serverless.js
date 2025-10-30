// Vercel serverless function entry point
const serverless = require('serverless-http');
const path = require('path');

let handler;

try {
  // Load the server build from .output (copied during postbuild)
  const serverPath = path.join(__dirname, '.output/server.cjs');
  console.log('Loading server from:', serverPath);
  
  const serverModule = require(serverPath);
  
  // Use the pre-created app instance (not createServer which would reinitialize)
  const app = serverModule.app;
  
  if (!app) {
    throw new Error('Express app not found in server.cjs exports');
  }
  
  handler = serverless(app);
  console.log('✓ Serverless function initialized successfully');
} catch (error) {
  console.error('✗ Fatal error initializing serverless function:', error);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    cwd: process.cwd(),
    dirname: __dirname
  });
  
  // Export an error handler
  handler = (req, res) => {
    res.status(500).json({
      error: 'Serverless function failed to initialize',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  };
}

module.exports = handler;