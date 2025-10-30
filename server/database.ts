import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let sql: NeonQueryFunction<false, false> | null = null;

// Lazy initialization of database connection
export const getDb = (): NeonQueryFunction<false, false> | null => {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.warn('⚠️  DATABASE_URL not set, database operations will be disabled');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DB')));
      // Return null when no database is configured
      return null;
    }
    
    try {
      // Log partial connection string for debugging (hide password)
      const urlParts = databaseUrl.split('@');
      const maskedUrl = urlParts.length > 1 
        ? `${urlParts[0].split(':')[0]}:****@${urlParts[1]}` 
        : '****';
      console.log('🔌 Attempting database connection to:', maskedUrl);
      
      sql = neon(databaseUrl);
      console.log('✅ Database connection established successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }
  return sql;
};

// Connection pool configuration for better performance
export const getDbWithRetry = async (maxRetries = 3): Promise<NeonQueryFunction<false, false>> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database not configured');
      }
      // Test connection
      await db`SELECT 1`;
      return db;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.warn(`Database connection attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Failed to establish database connection after retries');
};

// Database schema initialization
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Starting database initialization...');
    
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  Skipping database initialization - no DATABASE_URL configured');
      console.log('Set DATABASE_URL environment variable to enable database features');
      return;
    }

    const sql = getDb();
    
    if (!sql) {
      console.log('⚠️  Database connection is null, skipping initialization');
      return;
    }

    console.log('🔄 Creating database schema...');
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        preferences JSONB DEFAULT '{}',
        theme VARCHAR(10) DEFAULT 'light',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create recipes table
    await sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients JSONB NOT NULL,
        instructions JSONB NOT NULL,
        prep_time INTEGER DEFAULT 0,
        cook_time INTEGER DEFAULT 0,
        servings INTEGER DEFAULT 1,
        difficulty VARCHAR(10) DEFAULT 'easy',
        cuisine_type VARCHAR(100),
        liked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create sessions table for authentication
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create user_ingredients table for tracking user's pantry
    await sql`
      CREATE TABLE IF NOT EXISTS user_ingredients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ingredient_name VARCHAR(255) NOT NULL,
        quantity VARCHAR(100),
        unit VARCHAR(50),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, ingredient_name)
      )
    `;

    // Create recipe_ratings table for user feedback
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(recipe_id, user_id)
      )
    `;

    // Create recipe_likes table for user likes
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(recipe_id, user_id)
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_liked ON recipes(liked)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_user_liked ON recipes(user_id, liked)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_ingredients_user_id ON user_ingredients(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON recipe_ratings(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recipe_likes_recipe_id ON recipe_likes(recipe_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recipe_likes_user_id ON recipe_likes(user_id)`;

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    // Don't throw error to allow development without database
    console.log('⚠️  Continuing without database - using local storage only');
  }
};

// Export getDb as sql for backwards compatibility
export { getDb as sql };
