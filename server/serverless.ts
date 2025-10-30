// Serverless entry point - exports the app without starting the server
import { createServer } from "./index";
import { initializeDatabase } from "./database";

// Initialize database immediately for serverless
console.log('🚀 Serverless function initializing...');
console.log('Environment check:', {
  hasDbUrl: !!process.env.DATABASE_URL,
  hasOpenAI: !!process.env.OPENAI_API_KEY,
  hasJWT: !!process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV
});

// Initialize database schema on first load
initializeDatabase().catch(err => {
  console.warn('⚠️  Database initialization failed in serverless mode:', err.message);
  console.log('Continuing without database - using guest mode');
});

// Create and export the Express app for serverless deployment
export const app = createServer();

// Also export createServer for compatibility
export { createServer };
