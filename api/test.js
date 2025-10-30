// Simple test endpoint to verify Vercel functions work
module.exports = (req, res) => {
  res.status(200).json({
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasJWT: !!process.env.JWT_SECRET,
      nodeVersion: process.version
    }
  });
};
