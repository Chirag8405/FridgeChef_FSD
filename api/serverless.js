// Vercel serverless function entry point
// Directly creates the Express app without relying on build artifacts
const serverless = require('serverless-http');

// We need to transpile TypeScript on-the-fly or use the built files
// Since dist/ is gitignored, we'll require the built production.cjs directly
// Vercel builds the project, so dist/server/production.cjs should exist

let app;

try {
  // Try to load the main server build (includes app.listen but we'll extract the app)
  const serverModule = require('../dist/server/production.cjs');
  
  // The production.cjs exports createServer function
  if (serverModule.createServer) {
    app = serverModule.createServer();
  } else {
    throw new Error('createServer not found in production.cjs');
  }
} catch (err) {
  console.error('Error loading server:', err.message);
  
  // Fallback: try to load server files directly and create app
  try {
    // This won't work without transpilation, but let's try
    const { createServer } = require('../server/index.ts');
    app = createServer();
  } catch (err2) {
    console.error('Fallback failed:', err2.message);
    throw new Error('Could not load server. Ensure build completed successfully.');
  }
}

if (!app) {
  throw new Error('Failed to create Express app');
}

console.log('Serverless function initialized successfully');

// Wrap the Express app for serverless deployment
module.exports = serverless(app);