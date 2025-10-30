import { RequestHandler } from 'express';
import { sql } from '../database';
import { openAIService } from '../services/openai';
import { 
  GenerateRecipeRequest, 
  GenerateRecipeResponse, 
  DashboardData, 
  RecipeHistoryRequest,
  RecipeHistoryResponse,
  LikeRecipeRequest,
  LikeRecipeResponse,
  Recipe 
} from '@shared/api';

// Generate recipes using OpenAI
export const generateRecipes: RequestHandler = async (req, res) => {
  try {
    const { ingredients, preferences, allow_additional_ingredients }: GenerateRecipeRequest = req.body;
    
    // Support both authenticated users and guests
    const authHeader = req.headers.authorization;
    let userId = req.headers['user-id'] as string || `guest-${Date.now()}`;
    
    // If user is authenticated, get their ID from token
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const db = sql();
        const sessions = await db`
          SELECT user_id FROM sessions 
          WHERE token = ${token} AND expires_at > NOW()
        `;
        if (sessions.length > 0) {
          userId = sessions[0].user_id;
        }
      } catch (error) {
        console.warn('Failed to authenticate user, continuing as guest:', error);
      }
    }
    
    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one ingredient'
      });
    }

    const recipes = await openAIService.generateRecipes({
      ingredients,
      preferences,
      allow_additional_ingredients
    }, userId);

    // Save recipes to database (skip if no database connection)
    try {
      const db = sql();
      if (process.env.DATABASE_URL) {
        console.log(`Saving ${recipes.length} recipes to database for user ${userId}`);
        for (const recipe of recipes) {
          await db`
            INSERT INTO recipes (
              id, user_id, title, description, ingredients, instructions,
              prep_time, cook_time, servings, difficulty, cuisine_type, liked, created_at
            ) VALUES (
              ${recipe.id}, ${recipe.user_id}, ${recipe.title}, ${recipe.description},
              ${JSON.stringify(recipe.ingredients)}, ${JSON.stringify(recipe.instructions)},
              ${recipe.prep_time}, ${recipe.cook_time}, ${recipe.servings},
              ${recipe.difficulty}, ${recipe.cuisine_type}, ${recipe.liked}, ${recipe.created_at}
            )
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              ingredients = EXCLUDED.ingredients,
              instructions = EXCLUDED.instructions
          `;
        }
        console.log(`✓ Successfully saved ${recipes.length} recipes to database`);
      } else {
        console.log('No DATABASE_URL, skipping database save');
      }
    } catch (dbError) {
      console.error('✗ Database save failed:', dbError);
    }

    const response: GenerateRecipeResponse = {
      recipes,
      success: true
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recipes. Please try again.'
    });
  }
};

// Get dashboard data
export const getDashboardData: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string || `guest-${Date.now()}`;

    let db;
    try {
      db = sql();
    } catch (dbError) {
      console.warn('Database connection error:', dbError);
      db = null;
    }

    // Return empty dashboard data if no database connection
    if (!db) {
      const dashboardData: DashboardData = {
        trending_recipe: null,
        top_liked_recipes: [],
        total_recipes: 0,
        total_liked: 0
      };
      return res.json(dashboardData);
    }

    try {
      // Get random trending recipe from liked recipes
      const trendingRecipeResult = await db`
        SELECT * FROM recipes 
        WHERE user_id = ${userId} AND liked = true 
        ORDER BY RANDOM() 
        LIMIT 1
      `;

      // Get top 5 liked recipes
      const topLikedResult = await db`
        SELECT * FROM recipes 
        WHERE user_id = ${userId} AND liked = true 
        ORDER BY created_at DESC 
        LIMIT 5
      `;

      // Get total counts
      const totalRecipesResult = await db`
        SELECT COUNT(*) as count FROM recipes WHERE user_id = ${userId}
      `;

      const totalLikedResult = await db`
        SELECT COUNT(*) as count FROM recipes WHERE user_id = ${userId} AND liked = true
      `;

      const dashboardData: DashboardData = {
        trending_recipe: trendingRecipeResult[0] ? parseRecipeFromDb(trendingRecipeResult[0]) : null,
        top_liked_recipes: topLikedResult.map(parseRecipeFromDb),
        total_recipes: parseInt(totalRecipesResult[0].count),
        total_liked: parseInt(totalLikedResult[0].count)
      };

      console.log(`Dashboard data for user ${userId}:`, {
        total_recipes: dashboardData.total_recipes,
        total_liked: dashboardData.total_liked,
        trending_recipe: dashboardData.trending_recipe?.title || 'none'
      });

      res.json(dashboardData);
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      // Return empty data on database error
      const dashboardData: DashboardData = {
        trending_recipe: null,
        top_liked_recipes: [],
        total_recipes: 0,
        total_liked: 0
      };
      res.json(dashboardData);
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard data'
    });
  }
};

// Get recipe history with filters and pagination
export const getRecipeHistory: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string || `guest-${Date.now()}`;
    const {
      filter = 'all',
      sort_by = 'created_at',
      sort_order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const recipeHistoryRequest: RecipeHistoryRequest = {
      user_id: userId,
      filter: filter as 'all' | 'liked' | 'disliked',
      sort_by: sort_by as 'created_at' | 'title' | 'cook_time',
      sort_order: sort_order as 'asc' | 'desc',
      page: Number(page),
      limit: Number(limit)
    };

    let db;
    try {
      db = sql();
    } catch (dbError) {
      console.warn('Database connection error:', dbError);
      db = null;
    }

    // Return empty result if no database connection
    if (!db) {
      const response: RecipeHistoryResponse = {
        recipes: [],
        total: 0,
        page: Number(page),
        limit: Number(limit),
        has_more: false
      };
      return res.json(response);
    }

    try {
      const offset = (Number(page) - 1) * Number(limit);
      const validSortFields = ['created_at', 'title', 'cook_time'];
      const sortField = validSortFields.includes(sort_by as string) ? (sort_by as string) : 'created_at';
      const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

      console.log('Recipe history query params:', {
        userId,
        filter,
        sortField,
        sortDirection,
        limit: Number(limit),
        offset
      });

      // Get recipes with filtering, sorting and pagination
      let recipes;
      let countResult;
      
      // Build ORDER BY clause (sortField is already validated)
      const orderClause = sortDirection === 'ASC' 
        ? `ORDER BY ${sortField} ASC`
        : `ORDER BY ${sortField} DESC`;
      
      if (filter === 'liked') {
        const query = `SELECT * FROM recipes WHERE user_id = $1 AND liked = true ${orderClause} LIMIT $2 OFFSET $3`;
        recipes = await db.unsafe(query, [userId, Number(limit), offset]);
        
        countResult = await db`
          SELECT COUNT(*) as count FROM recipes 
          WHERE user_id = ${userId} AND liked = true
        `;
      } else if (filter === 'disliked') {
        const query = `SELECT * FROM recipes WHERE user_id = $1 AND liked = false ${orderClause} LIMIT $2 OFFSET $3`;
        recipes = await db.unsafe(query, [userId, Number(limit), offset]);
        
        countResult = await db`
          SELECT COUNT(*) as count FROM recipes 
          WHERE user_id = ${userId} AND liked = false
        `;
      } else {
        const query = `SELECT * FROM recipes WHERE user_id = $1 ${orderClause} LIMIT $2 OFFSET $3`;
        recipes = await db.unsafe(query, [userId, Number(limit), offset]);
        
        countResult = await db`
          SELECT COUNT(*) as count FROM recipes 
          WHERE user_id = ${userId}
        `;
      }

      console.log('Recipe history raw results:', {
        recipesCount: recipes?.length,
        countResult: countResult[0]
      });

      const total = parseInt(countResult[0]?.count || '0');
      const hasMore = offset + Number(limit) < total;

      console.log(`Recipe history for user ${userId}:`, {
        filter,
        total,
        returned: recipes.length,
        page: Number(page)
      });

      const response: RecipeHistoryResponse = {
        recipes: recipes.map(parseRecipeFromDb),
        total,
        page: Number(page),
        limit: Number(limit),
        has_more: hasMore
      };

      res.json(response);
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      // Return empty result on database error
      const response: RecipeHistoryResponse = {
        recipes: [],
        total: 0,
        page: Number(page),
        limit: Number(limit),
        has_more: false
      };
      res.json(response);
    }
  } catch (error) {
    console.error('Error fetching recipe history:', error);
    res.status(500).json({
      message: 'Failed to fetch recipe history'
    });
  }
};

// Like/unlike a recipe
export const likeRecipe: RequestHandler = async (req, res) => {
  try {
    const { recipe_id, liked }: LikeRecipeRequest = req.body;
    const userId = req.headers['user-id'] as string || `guest-${Date.now()}`;

    // If no database connection, return success (local storage will handle it)
    if (!process.env.DATABASE_URL) {
      return res.json({
        success: true,
        message: 'Like status updated locally'
      });
    }

    try {
      const db = sql();

      const result = await db`
        UPDATE recipes 
        SET liked = ${liked}
        WHERE id = ${recipe_id} AND user_id = ${userId}
        RETURNING *
      `;

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Recipe not found'
        });
      }

      const response: LikeRecipeResponse = {
        success: true,
        recipe: parseRecipeFromDb(result[0])
      };

      res.json(response);
    } catch (dbError) {
      console.warn('Database update failed:', dbError);
      // Return success anyway for guest mode compatibility
      res.json({
        success: true,
        message: 'Like status updated locally'
      });
    }
  } catch (error) {
    console.error('Error updating recipe like status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recipe'
    });
  }
};

// Get single recipe
export const getRecipe: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string || `guest-${Date.now()}`;

    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        message: 'Database not available'
      });
    }

    try {
      const db = sql();

      const result = await db`
        SELECT * FROM recipes 
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (result.length === 0) {
        return res.status(404).json({
          message: 'Recipe not found'
        });
      }

      res.json(parseRecipeFromDb(result[0]));
    } catch (dbError) {
      console.warn('Database query failed:', dbError);
      res.status(503).json({
        message: 'Database operation failed'
      });
    }
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({
      message: 'Failed to fetch recipe'
    });
  }
};

// Delete recipe
export const deleteRecipe: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    let userId = req.headers['user-id'] as string;

    // If user is authenticated, get their ID from token
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const db = sql();
        const sessions = await db`
          SELECT user_id FROM sessions 
          WHERE token = ${token} AND expires_at > NOW()
        `;
        if (sessions.length > 0) {
          userId = sessions[0].user_id;
        }
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
      }
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    try {
      const db = sql();

      const result = await db`
        DELETE FROM recipes 
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id
      `;

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Recipe not found or not authorized to delete'
        });
      }

      res.json({
        success: true,
        message: 'Recipe deleted successfully'
      });
    } catch (dbError) {
      console.error('Database delete failed:', dbError);
      res.status(500).json({
        success: false,
        message: 'Database operation failed'
      });
    }
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipe'
    });
  }
};

// Rate recipe
export const rateRecipe: RequestHandler = async (req, res) => {
  try {
    const { recipe_id, rating, review } = req.body;
    const authHeader = req.headers.authorization;
    let userId = req.headers['user-id'] as string;

    // Authentication required for rating
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const db = sql();
      const sessions = await db`
        SELECT user_id FROM sessions 
        WHERE token = ${token} AND expires_at > NOW()
      `;
      if (sessions.length > 0) {
        userId = sessions[0].user_id;
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    try {
      const db = sql();

      // Check if recipe exists
      const recipeExists = await db`
        SELECT id FROM recipes WHERE id = ${recipe_id}
      `;

      if (recipeExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Recipe not found'
        });
      }

      // Insert or update rating
      const result = await db`
        INSERT INTO recipe_ratings (recipe_id, user_id, rating, review)
        VALUES (${recipe_id}, ${userId}, ${rating}, ${review || null})
        ON CONFLICT (recipe_id, user_id) 
        DO UPDATE SET 
          rating = EXCLUDED.rating,
          review = EXCLUDED.review,
          created_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      res.json({
        success: true,
        rating: result[0],
        message: 'Recipe rated successfully'
      });
    } catch (dbError) {
      console.error('Database rating operation failed:', dbError);
      res.status(500).json({
        success: false,
        message: 'Database operation failed'
      });
    }
  } catch (error) {
    console.error('Error rating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate recipe'
    });
  }
};

// Helper function to parse database result to Recipe type
function parseRecipeFromDb(dbRow: any): Recipe {
  return {
    id: dbRow.id,
    user_id: dbRow.user_id,
    title: dbRow.title,
    description: dbRow.description,
    ingredients: JSON.parse(dbRow.ingredients),
    instructions: JSON.parse(dbRow.instructions),
    prep_time: dbRow.prep_time,
    cook_time: dbRow.cook_time,
    servings: dbRow.servings,
    difficulty: dbRow.difficulty,
    cuisine_type: dbRow.cuisine_type,
    liked: dbRow.liked,
    created_at: dbRow.created_at
  };
}

// Get detailed explanation for a recipe
export const getDetailedExplanation: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID is required'
      });
    }

    // Try to get recipe from database or memory
    let recipe: Recipe | null = null;
    
    try {
      const db = sql();
      if (process.env.DATABASE_URL) {
        const result = await db`
          SELECT * FROM recipes WHERE id = ${id} LIMIT 1
        `;
        if (result.length > 0) {
          recipe = parseRecipeFromDb(result[0]);
        }
      }
    } catch (error) {
      console.warn('Database query failed, continuing without recipe data:', error);
    }

    // If no database recipe found, try to get from request body (for guest users)
    if (!recipe && req.body.recipe) {
      recipe = req.body.recipe;
    }

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found. Please provide recipe data in request body or ensure database is configured.'
      });
    }

    // Generate detailed explanation using OpenAI
    const explanation = await openAIService.generateDetailedExplanation(recipe);

    res.json({
      success: true,
      explanation
    });
  } catch (error) {
    console.error('Error generating detailed explanation:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate detailed explanation'
    });
  }
};
