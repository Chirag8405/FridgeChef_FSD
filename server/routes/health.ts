import { RequestHandler } from 'express';
import { sql } from '../database';

export const healthCheck: RequestHandler = async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: 'unknown',
      openai: 'unknown'
    }
  };

  // Check database connection
  try {
    if (process.env.DATABASE_URL) {
      const db = sql();
      await db`SELECT 1 as test`;
      health.services.database = 'connected';
    } else {
      health.services.database = 'not_configured';
    }
  } catch (error) {
    health.services.database = 'error';
    health.status = 'degraded';
  }

  // Check OpenAI API key
  if (process.env.OPENAI_API_KEY) {
    health.services.openai = 'configured';
  } else {
    health.services.openai = 'not_configured';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
};

export const readinessCheck: RequestHandler = async (req, res) => {
  try {
    // Basic readiness checks
    const checks = {
      database: false,
      openai: false
    };

    // Database check
    if (process.env.DATABASE_URL) {
      try {
        const db = sql();
        await db`SELECT 1 as test`;
        checks.database = true;
      } catch (error) {
        console.warn('Database readiness check failed:', error);
      }
    } else {
      checks.database = true; // OK if not configured
    }

    // OpenAI check
    if (process.env.OPENAI_API_KEY) {
      checks.openai = true;
    }

    const isReady = Object.values(checks).every(check => check);
    
    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      checks
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: 'Readiness check failed'
    });
  }
};

export const testDbConnection: RequestHandler = async (req, res) => {
  const dbInfo: any = {
    timestamp: new Date().toISOString(),
    hasDbUrl: !!process.env.DATABASE_URL,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasJWT: !!process.env.JWT_SECRET,
  };

  if (process.env.DATABASE_URL) {
    // Mask the password in the URL
    const url = process.env.DATABASE_URL;
    const urlParts = url.split('@');
    const hostPart = urlParts.length > 1 ? urlParts[1].split('/')[0] : 'unknown';
    dbInfo.dbHost = hostPart;
    dbInfo.dbUrlLength = url.length;
    
    try {
      const db = sql();
      if (!db) {
        dbInfo.status = 'getDb returned null';
      } else {
        const result = await db`SELECT NOW() as current_time, version() as pg_version`;
        dbInfo.status = 'connected';
        dbInfo.currentTime = result[0]?.current_time;
        dbInfo.pgVersion = result[0]?.pg_version;
        
        // Check recipe counts
        const totalRecipes = await db`SELECT COUNT(*) as count FROM recipes`;
        dbInfo.totalRecipes = parseInt(totalRecipes[0]?.count || '0');
        
        // Get recipes by user
        const recipesByUser = await db`
          SELECT user_id, COUNT(*) as count 
          FROM recipes 
          GROUP BY user_id 
          ORDER BY count DESC 
          LIMIT 10
        `;
        dbInfo.recipesByUser = recipesByUser;
      }
    } catch (error: any) {
      dbInfo.status = 'error';
      dbInfo.error = error.message;
      dbInfo.errorType = error.constructor.name;
    }
  } else {
    dbInfo.status = 'no_database_url';
  }

  res.json(dbInfo);
};
