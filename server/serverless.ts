// Serverless entry point - exports the app without starting the server
import { createServer } from "./index";

// Create and export the Express app for serverless deployment
export const app = createServer();

// Also export createServer for compatibility
export { createServer };
