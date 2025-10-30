import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();

// Export the app for serverless deployments
export { createServer };

const port = process.env.PORT || 3000;

// In production, serve the built SPA files
// For CommonJS builds, use __dirname directly; for ESM, derive from import.meta.url
let __dirname: string;
if (typeof __dirname === 'undefined') {
  __dirname = path.dirname(fileURLToPath(import.meta.url));
}
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes - let them return 404
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ 
      success: false,
      message: "API endpoint not found",
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }

  // Serve index.html for all other routes (React Router will handle client-side routing)
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
