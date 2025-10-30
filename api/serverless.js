// Vercel serverless function entry point
const serverless = require('serverless-http');
const path = require('path');

let handler;

try {
  // Load the server build from .output (copied during postbuild)
  const serverPath = path.join(__dirname, '.output/server.cjs');
  console.log('Loading server from:', serverPath);
  
  const serverModule = require(serverPath);
  
  if (serverModule.createServer && typeof serverModule.createServer === 'function') {
    const app = serverModule.createServer();
    handler = serverless(app);
    console.log('✓ Serverless function initialized successfully');
  } else {
    throw new Error('createServer function not found in server.cjs');
  }
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