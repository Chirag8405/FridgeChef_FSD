// Direct Express handler without serverless-http wrapper
const path = require('path');

let app;

try {
  const serverPath = path.join(__dirname, '.output/server.cjs');
  const serverModule = require(serverPath);
  app = serverModule.app;
  
  if (!app) {
    throw new Error('Express app not found');
  }
  
  console.log('✓ App loaded successfully');
} catch (error) {
  console.error('✗ Error loading app:', error);
}

// Export a handler that directly uses the Express app
module.exports = async (req, res) => {
  if (!app) {
    res.status(500).json({ error: 'App failed to initialize' });
    return;
  }
  
  // Let Express handle the request directly
  app(req, res);
};
