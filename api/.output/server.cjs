"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const path = require("path");
const url = require("url");
const express = require("express");
const cors = require("cors");
const serverless = require("@neondatabase/serverless");
const OpenAI = require("openai");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const express__namespace = /* @__PURE__ */ _interopNamespaceDefault(express);
let sql = null;
const getDb = () => {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set, database operations will be disabled");
      return null;
    }
    try {
      sql = serverless.neon(databaseUrl);
      console.log("✅ Database connection established successfully");
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error;
    }
  }
  return sql;
};
const initializeDatabase = async () => {
  try {
    const sql2 = getDb();
    if (!process.env.DATABASE_URL) {
      console.log("⚠️  Skipping database initialization - no DATABASE_URL configured");
      return;
    }
    console.log("🔄 Initializing database schema...");
    await sql2`
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
    await sql2`
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
    await sql2`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql2`
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
    await sql2`
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
    await sql2`
      CREATE TABLE IF NOT EXISTS recipe_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(recipe_id, user_id)
      )
    `;
    await sql2`CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id)`;
    await sql2`CREATE INDEX IF NOT EXISTS idx_recipes_liked ON recipes(liked)`;
    await sql2`CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at)`;
    await sql2`CREATE INDEX IF NOT EXISTS idx_recipes_user_liked ON recipes(user_id, liked)`;
    await sql2`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`;
    await sql2`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`;
    await sql2`CREATE INDEX IF NOT EXISTS idx_user_ingredients_user_id ON user_ingredients(user_id)`;
    await sql2`CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id)`;
    await sql2`CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON recipe_ratings(user_id)`;
    await sql2`CREATE INDEX IF NOT EXISTS idx_recipe_likes_recipe_id ON recipe_likes(recipe_id)`;
    await sql2`CREATE INDEX IF NOT EXISTS idx_recipe_likes_user_id ON recipe_likes(user_id)`;
    console.log("✅ Database schema initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    console.log("⚠️  Continuing without database - using local storage only");
  }
};
const healthCheck = async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime(),
    environment: "production",
    version: "1.0.0",
    services: {
      database: "unknown",
      openai: "unknown"
    }
  };
  try {
    if (process.env.DATABASE_URL) {
      const db = getDb();
      await db`SELECT 1 as test`;
      health.services.database = "connected";
    } else {
      health.services.database = "not_configured";
    }
  } catch (error) {
    health.services.database = "error";
    health.status = "degraded";
  }
  if (process.env.OPENAI_API_KEY) {
    health.services.openai = "configured";
  } else {
    health.services.openai = "not_configured";
    health.status = "degraded";
  }
  const statusCode = health.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(health);
};
const readinessCheck = async (req, res) => {
  try {
    const checks = {
      database: false,
      openai: false
    };
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        await db`SELECT 1 as test`;
        checks.database = true;
      } catch (error) {
        console.warn("Database readiness check failed:", error);
      }
    } else {
      checks.database = true;
    }
    if (process.env.OPENAI_API_KEY) {
      checks.openai = true;
    }
    const isReady = Object.values(checks).every((check) => check);
    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      checks
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: "Readiness check failed"
    });
  }
};
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;
class OpenAIService {
  buildPrompt(request) {
    const { ingredients, preferences, allow_additional_ingredients } = request;
    const ingredientsList = ingredients.join(", ");
    let prompt = `Act as a professional chef who only suggests recipes using ingredients available at hand unless given permission to include others.

Available ingredients: ${ingredientsList}

${allow_additional_ingredients ? 'You may suggest additional essential ingredients if absolutely necessary, but clearly mark them as "ADDITIONAL NEEDED".' : "You must ONLY use the ingredients listed above. Do not suggest any additional ingredients."}

User preferences:`;
    if (preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
      prompt += `
- Dietary restrictions: ${preferences.dietary_restrictions.join(", ")}`;
    }
    if (preferences?.preferred_cuisines && preferences.preferred_cuisines.length > 0) {
      prompt += `
- Preferred cuisines: ${preferences.preferred_cuisines.join(", ")}`;
    }
    if (preferences?.spice_level) {
      prompt += `
- Spice level: ${preferences.spice_level}`;
    }
    if (preferences?.cooking_time_preference) {
      prompt += `
- Cooking time preference: ${preferences.cooking_time_preference}`;
    }
    prompt += `

Please provide 3-5 complete recipes that can be made with these ingredients. For each recipe, provide:

1. Recipe title
2. Brief description (1-2 sentences)
3. Complete ingredients list with exact amounts
4. Step-by-step cooking instructions
5. Preparation time in minutes
6. Cooking time in minutes
7. Number of servings
8. Difficulty level (easy/medium/hard)
9. Cuisine type

Format your response as a JSON array with the following structure. DO NOT wrap the JSON in markdown code blocks or backticks:
[
  {
    "title": "Recipe Name",
    "description": "Brief description",
    "ingredients": [
      {"name": "ingredient name", "amount": "quantity", "unit": "measurement unit"}
    ],
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "prep_time": minutes,
    "cook_time": minutes,
    "servings": number,
    "difficulty": "easy|medium|hard",
    "cuisine_type": "cuisine name"
  }
]

IMPORTANT: Return ONLY the JSON array, no additional text, no markdown formatting, no code block backticks.

Important guidelines:
- Be realistic about quantities and measurements
- Provide clear, actionable cooking steps
- Do not hallucinate ingredients not provided
- Ensure recipes are actually cookable with the given ingredients
- If additional ingredients are absolutely essential, clearly mark them
- Focus on practical, achievable recipes`;
    return prompt;
  }
  async generateRecipes(request, userId) {
    console.log("=== OpenAI Service Debug Info ===");
    console.log("Environment OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
    console.log("OpenAI client initialized:", !!openai);
    if (process.env.OPENAI_API_KEY) {
      console.log("API Key format check:", process.env.OPENAI_API_KEY.startsWith("sk-"));
      console.log("API Key length:", process.env.OPENAI_API_KEY.length);
    }
    if (openai) {
      try {
        const isValid = await this.validateApiKey();
        console.log("API Key validation successful:", isValid);
        if (!isValid) {
          console.error("API key validation failed - using mock recipes");
          return this.generateMockRecipes(request, userId);
        }
      } catch (error) {
        console.error("API validation error:", error);
        return this.generateMockRecipes(request, userId);
      }
    }
    if (!openai || !process.env.OPENAI_API_KEY) {
      console.warn("OpenAI not configured - using mock recipes");
      return this.generateMockRecipes(request, userId);
    }
    try {
      console.log("Making OpenAI API call...");
      const prompt = this.buildPrompt(request);
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional chef and recipe creator. Always respond with valid JSON arrays containing recipe objects. Be precise with measurements and realistic with cooking times. IMPORTANT: Return ONLY the JSON array, no markdown formatting, no code blocks, no backticks, no additional text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4e3
      });
      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }
      console.log("OpenAI response received, parsing...");
      console.log("Raw response preview:", response.substring(0, 100));
      try {
        let cleanedResponse = response.trim();
        if (cleanedResponse.startsWith("```json")) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (cleanedResponse.startsWith("```")) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
        cleanedResponse = cleanedResponse.replace(/^`+|`+$/g, "");
        console.log("Cleaned response preview:", cleanedResponse.substring(0, 100));
        let parsedRecipes = JSON.parse(cleanedResponse);
        if (!Array.isArray(parsedRecipes)) {
          parsedRecipes = [parsedRecipes];
        }
        const recipes = parsedRecipes.map((recipe) => ({
          id: uuid.v4(),
          user_id: userId,
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          cuisine_type: recipe.cuisine_type,
          liked: false,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        }));
        console.log(`Successfully generated ${recipes.length} recipes from OpenAI`);
        return recipes;
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        console.error("Raw OpenAI response:", response);
        console.error("Response length:", response?.length);
        console.error("First 200 chars:", response?.substring(0, 200));
        console.log("Falling back to mock recipes due to parsing error");
        return this.generateMockRecipes(request, userId);
      }
    } catch (error) {
      console.error("OpenAI API Error:", error);
      console.log("Falling back to mock recipes due to API error");
      return this.generateMockRecipes(request, userId);
    }
  }
  generateMockRecipes(request, userId) {
    const { ingredients } = request;
    const mockRecipes = [
      {
        id: uuid.v4(),
        user_id: userId,
        title: `Quick ${ingredients[0] || "Ingredient"} Stir-Fry`,
        description: "A simple and delicious stir-fry that brings out the best flavors of your available ingredients.",
        ingredients: ingredients.slice(0, 4).map((ing) => ({
          name: ing,
          amount: "1",
          unit: "cup"
        })).concat([
          { name: "oil", amount: "2", unit: "tbsp" },
          { name: "salt", amount: "1", unit: "tsp" }
        ]),
        instructions: [
          "Heat oil in a large pan over medium-high heat",
          "Add your main ingredients and cook for 5-7 minutes",
          "Season with salt and any available spices",
          "Stir-fry until ingredients are tender and well combined",
          "Serve hot and enjoy!"
        ],
        prep_time: 10,
        cook_time: 15,
        servings: 2,
        difficulty: "easy",
        cuisine_type: "fusion",
        liked: false,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    if (ingredients.length > 1) {
      mockRecipes.push({
        id: uuid.v4(),
        user_id: userId,
        title: `${ingredients[0] || "Mixed"} and ${ingredients[1] || "Vegetable"} Soup`,
        description: "A comforting, hearty soup that makes the most of your pantry ingredients.",
        ingredients: ingredients.slice(0, 3).map((ing) => ({
          name: ing,
          amount: "1",
          unit: "cup"
        })).concat([
          { name: "water or broth", amount: "4", unit: "cups" },
          { name: "seasoning", amount: "to taste", unit: "" }
        ]),
        instructions: [
          "Bring water or broth to a boil in a large pot",
          "Add your ingredients starting with the longest-cooking items",
          "Simmer for 20-25 minutes until everything is tender",
          "Season to taste with salt, pepper, or available herbs",
          "Serve hot with crusty bread if available"
        ],
        prep_time: 15,
        cook_time: 25,
        servings: 4,
        difficulty: "easy",
        cuisine_type: "comfort food",
        liked: false,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    return mockRecipes;
  }
  async validateApiKey() {
    if (!openai) return false;
    try {
      await openai.models.list();
      return true;
    } catch (error) {
      console.error("OpenAI API key validation failed:", error);
      return false;
    }
  }
  async generateDetailedExplanation(recipe) {
    if (!openai) {
      return this.getMockDetailedExplanation(recipe);
    }
    try {
      const prompt = `Act as a professional chef providing detailed, in-depth cooking guidance.

Recipe: ${recipe.title}
Description: ${recipe.description}
Difficulty: ${recipe.difficulty}

Ingredients:
${recipe.ingredients.map((ing) => `- ${ing.amount} ${ing.unit || ""} ${ing.name}`.trim()).join("\n")}

Basic Instructions:
${recipe.instructions.map((step, i) => `${i + 1}. ${step}`).join("\n")}

Please provide a comprehensive, detailed explanation of how to prepare this recipe. Include:

1. **Preparation Tips**: How to properly prep each ingredient, any advance preparation needed
2. **Cooking Techniques**: Detailed explanation of each cooking method used (sautéing, boiling, etc.)
3. **Visual and Sensory Cues**: What to look for at each stage (color changes, textures, aromas, sounds)
4. **Timing Details**: More specific timing for each step and why it matters
5. **Common Mistakes**: What to avoid and troubleshooting tips
6. **Pro Tips**: Professional chef secrets to elevate the dish
7. **Variations**: Possible substitutions or modifications
8. **Serving Suggestions**: How to plate and what to serve with

Write in a friendly, conversational tone as if you're teaching someone in your kitchen. Be thorough but not overwhelming. Aim for about 400-500 words.`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an experienced professional chef who loves teaching others. You provide detailed, helpful cooking guidance with enthusiasm and clarity."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });
      return completion.choices[0]?.message?.content || this.getMockDetailedExplanation(recipe);
    } catch (error) {
      console.error("Error generating detailed explanation:", error);
      return this.getMockDetailedExplanation(recipe);
    }
  }
  getMockDetailedExplanation(recipe) {
    return `**Preparation Tips:**
Start by organizing your ingredients - this is called "mise en place" in professional kitchens. ${recipe.ingredients.slice(0, 3).map((ing) => `Prep your ${ing.name}`).join(", ")} before you begin cooking. This ensures smooth execution.

**Cooking Techniques:**
This ${recipe.difficulty} recipe uses fundamental cooking methods. Pay attention to heat levels - ${recipe.difficulty === "easy" ? "medium heat works well for most steps" : recipe.difficulty === "medium" ? "you'll want to adjust between medium and high heat" : "precise temperature control is crucial here"}. 

**Visual and Sensory Cues:**
Watch for golden-brown colors when sautéing, listen for the sizzle (it should be steady, not frantic), and trust your nose - aromatic ingredients release their full fragrance when cooked properly.

**Timing Details:**
The ${recipe.prep_time} minute prep time accounts for chopping and measuring. The ${recipe.cook_time} minute cook time can vary by 5-10 minutes depending on your equipment and ingredient sizes.

**Common Mistakes to Avoid:**
Don't overcrowd the pan - this causes steaming instead of browning. Don't rush the process - patience yields better flavors. Taste and adjust seasoning throughout.

**Pro Tips:**
Season in layers rather than all at once. Room temperature ingredients cook more evenly. Let the dish rest for a few minutes before serving to allow flavors to meld.

**Variations:**
Feel free to substitute ingredients based on what you have. The techniques remain the same, so don't be afraid to experiment while maintaining the basic cooking methods.

**Serving Suggestions:**
This dish serves ${recipe.servings} and pairs wonderfully with a fresh salad or crusty bread. Consider garnishing with fresh herbs for a professional presentation.`;
  }
}
const openAIService = new OpenAIService();
const generateRecipes = async (req, res) => {
  try {
    const { ingredients, preferences, allow_additional_ingredients } = req.body;
    const authHeader = req.headers.authorization;
    let userId = req.headers["user-id"] || `guest-${Date.now()}`;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const db = getDb();
        const sessions = await db`
          SELECT user_id FROM sessions 
          WHERE token = ${token} AND expires_at > NOW()
        `;
        if (sessions.length > 0) {
          userId = sessions[0].user_id;
        }
      } catch (error) {
        console.warn("Failed to authenticate user, continuing as guest:", error);
      }
    }
    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one ingredient"
      });
    }
    const recipes = await openAIService.generateRecipes({
      ingredients,
      preferences,
      allow_additional_ingredients
    }, userId);
    try {
      const db = getDb();
      if (process.env.DATABASE_URL) {
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
      }
    } catch (dbError) {
      console.warn("Database save failed, continuing without persistence:", dbError);
    }
    const response = {
      recipes,
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error("Error generating recipes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate recipes. Please try again."
    });
  }
};
const getDashboardData = async (req, res) => {
  try {
    const userId = req.headers["user-id"] || `guest-${Date.now()}`;
    if (!process.env.DATABASE_URL) {
      const dashboardData = {
        trending_recipe: null,
        top_liked_recipes: [],
        total_recipes: 0,
        total_liked: 0
      };
      return res.json(dashboardData);
    }
    try {
      const db = getDb();
      const trendingRecipeResult = await db`
        SELECT * FROM recipes 
        WHERE user_id = ${userId} AND liked = true 
        ORDER BY RANDOM() 
        LIMIT 1
      `;
      const topLikedResult = await db`
        SELECT * FROM recipes 
        WHERE user_id = ${userId} AND liked = true 
        ORDER BY created_at DESC 
        LIMIT 5
      `;
      const totalRecipesResult = await db`
        SELECT COUNT(*) as count FROM recipes WHERE user_id = ${userId}
      `;
      const totalLikedResult = await db`
        SELECT COUNT(*) as count FROM recipes WHERE user_id = ${userId} AND liked = true
      `;
      const dashboardData = {
        trending_recipe: trendingRecipeResult[0] ? parseRecipeFromDb(trendingRecipeResult[0]) : null,
        top_liked_recipes: topLikedResult.map(parseRecipeFromDb),
        total_recipes: parseInt(totalRecipesResult[0].count),
        total_liked: parseInt(totalLikedResult[0].count)
      };
      res.json(dashboardData);
    } catch (dbError) {
      console.warn("Database query failed:", dbError);
      const dashboardData = {
        trending_recipe: null,
        top_liked_recipes: [],
        total_recipes: 0,
        total_liked: 0
      };
      res.json(dashboardData);
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard data"
    });
  }
};
const getRecipeHistory = async (req, res) => {
  try {
    const userId = req.headers["user-id"] || `guest-${Date.now()}`;
    const {
      filter = "all",
      sort_by = "created_at",
      sort_order = "desc",
      page = 1,
      limit = 10
    } = req.query;
    const recipeHistoryRequest = {
      user_id: userId,
      filter,
      sort_by,
      sort_order,
      page: Number(page),
      limit: Number(limit)
    };
    if (!process.env.DATABASE_URL) {
      const response = {
        recipes: [],
        total: 0,
        page: Number(page),
        limit: Number(limit),
        has_more: false
      };
      return res.json(response);
    }
    try {
      const db = getDb();
      const offset = (Number(page) - 1) * Number(limit);
      let baseQuery = db`SELECT * FROM recipes WHERE user_id = ${userId}`;
      let countQuery = db`SELECT COUNT(*) as count FROM recipes WHERE user_id = ${userId}`;
      if (filter === "liked") {
        baseQuery = db`SELECT * FROM recipes WHERE user_id = ${userId} AND liked = true`;
        countQuery = db`SELECT COUNT(*) as count FROM recipes WHERE user_id = ${userId} AND liked = true`;
      } else if (filter === "disliked") {
        baseQuery = db`SELECT * FROM recipes WHERE user_id = ${userId} AND liked = false`;
        countQuery = db`SELECT COUNT(*) as count FROM recipes WHERE user_id = ${userId} AND liked = false`;
      }
      const validSortFields = ["created_at", "title", "cook_time"];
      const sortField = validSortFields.includes(sort_by) ? sort_by : "created_at";
      const sortDirection = sort_order === "asc" ? "ASC" : "DESC";
      let recipes;
      if (filter === "liked") {
        const query = `
          SELECT * FROM recipes 
          WHERE user_id = $1 AND liked = true
          ORDER BY ${sortField} ${sortDirection}
          LIMIT $2 OFFSET $3
        `;
        recipes = await db(query, [userId, Number(limit), offset]);
      } else if (filter === "disliked") {
        const query = `
          SELECT * FROM recipes 
          WHERE user_id = $1 AND liked = false
          ORDER BY ${sortField} ${sortDirection}
          LIMIT $2 OFFSET $3
        `;
        recipes = await db(query, [userId, Number(limit), offset]);
      } else {
        const query = `
          SELECT * FROM recipes 
          WHERE user_id = $1
          ORDER BY ${sortField} ${sortDirection}
          LIMIT $2 OFFSET $3
        `;
        recipes = await db(query, [userId, Number(limit), offset]);
      }
      const totalResult = await countQuery;
      const total = parseInt(totalResult[0]?.count || "0");
      const hasMore = offset + Number(limit) < total;
      const response = {
        recipes: recipes.map(parseRecipeFromDb),
        total,
        page: Number(page),
        limit: Number(limit),
        has_more: hasMore
      };
      res.json(response);
    } catch (dbError) {
      console.warn("Database query failed:", dbError);
      const response = {
        recipes: [],
        total: 0,
        page: Number(page),
        limit: Number(limit),
        has_more: false
      };
      res.json(response);
    }
  } catch (error) {
    console.error("Error fetching recipe history:", error);
    res.status(500).json({
      message: "Failed to fetch recipe history"
    });
  }
};
const likeRecipe = async (req, res) => {
  try {
    const { recipe_id, liked } = req.body;
    const userId = req.headers["user-id"] || `guest-${Date.now()}`;
    if (!process.env.DATABASE_URL) {
      return res.json({
        success: true,
        message: "Like status updated locally"
      });
    }
    try {
      const db = getDb();
      const result = await db`
        UPDATE recipes 
        SET liked = ${liked}
        WHERE id = ${recipe_id} AND user_id = ${userId}
        RETURNING *
      `;
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Recipe not found"
        });
      }
      const response = {
        success: true,
        recipe: parseRecipeFromDb(result[0])
      };
      res.json(response);
    } catch (dbError) {
      console.warn("Database update failed:", dbError);
      res.json({
        success: true,
        message: "Like status updated locally"
      });
    }
  } catch (error) {
    console.error("Error updating recipe like status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update recipe"
    });
  }
};
const getRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["user-id"] || `guest-${Date.now()}`;
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        message: "Database not available"
      });
    }
    try {
      const db = getDb();
      const result = await db`
        SELECT * FROM recipes 
        WHERE id = ${id} AND user_id = ${userId}
      `;
      if (result.length === 0) {
        return res.status(404).json({
          message: "Recipe not found"
        });
      }
      res.json(parseRecipeFromDb(result[0]));
    } catch (dbError) {
      console.warn("Database query failed:", dbError);
      res.status(503).json({
        message: "Database operation failed"
      });
    }
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({
      message: "Failed to fetch recipe"
    });
  }
};
const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    let userId = req.headers["user-id"];
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const db = getDb();
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
          message: "Authentication failed"
        });
      }
    }
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        success: false,
        message: "Database not available"
      });
    }
    try {
      const db = getDb();
      const result = await db`
        DELETE FROM recipes 
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id
      `;
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Recipe not found or not authorized to delete"
        });
      }
      res.json({
        success: true,
        message: "Recipe deleted successfully"
      });
    } catch (dbError) {
      console.error("Database delete failed:", dbError);
      res.status(500).json({
        success: false,
        message: "Database operation failed"
      });
    }
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete recipe"
    });
  }
};
const rateRecipe = async (req, res) => {
  try {
    const { recipe_id, rating, review } = req.body;
    const authHeader = req.headers.authorization;
    let userId = req.headers["user-id"];
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    try {
      const token = authHeader.replace("Bearer ", "");
      const db = getDb();
      const sessions = await db`
        SELECT user_id FROM sessions 
        WHERE token = ${token} AND expires_at > NOW()
      `;
      if (sessions.length > 0) {
        userId = sessions[0].user_id;
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token"
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed"
      });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        success: false,
        message: "Database not available"
      });
    }
    try {
      const db = getDb();
      const recipeExists = await db`
        SELECT id FROM recipes WHERE id = ${recipe_id}
      `;
      if (recipeExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Recipe not found"
        });
      }
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
        message: "Recipe rated successfully"
      });
    } catch (dbError) {
      console.error("Database rating operation failed:", dbError);
      res.status(500).json({
        success: false,
        message: "Database operation failed"
      });
    }
  } catch (error) {
    console.error("Error rating recipe:", error);
    res.status(500).json({
      success: false,
      message: "Failed to rate recipe"
    });
  }
};
function parseRecipeFromDb(dbRow) {
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
const getDetailedExplanation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Recipe ID is required"
      });
    }
    let recipe = null;
    try {
      const db = getDb();
      if (process.env.DATABASE_URL) {
        const result = await db`
          SELECT * FROM recipes WHERE id = ${id} LIMIT 1
        `;
        if (result.length > 0) {
          recipe = parseRecipeFromDb(result[0]);
        }
      }
    } catch (error) {
      console.warn("Database query failed, continuing without recipe data:", error);
    }
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found"
      });
    }
    const explanation = await openAIService.generateDetailedExplanation(recipe);
    res.json({
      success: true,
      explanation
    });
  } catch (error) {
    console.error("Error generating detailed explanation:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to generate detailed explanation"
    });
  }
};
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-development";
const SALT_ROUNDS = 12;
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required"
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }
    const db = getDb();
    const existingUser = await db`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = uuid.v4();
    const newUser = await db`
      INSERT INTO users (id, name, email, password_hash, preferences, theme)
      VALUES (${userId}, ${name}, ${email.toLowerCase()}, ${passwordHash}, '{}', 'light')
      RETURNING id, name, email, preferences, theme, created_at
    `;
    if (newUser.length === 0) {
      throw new Error("Failed to create user");
    }
    const token = jwt.sign(
      { userId, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    const sessionId = uuid.v4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    await db`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (${sessionId}, ${userId}, ${token}, ${expiresAt})
    `;
    const user = {
      id: newUser[0].id,
      name: newUser[0].name,
      email: newUser[0].email,
      preferences: newUser[0].preferences || {},
      theme: newUser[0].theme,
      created_at: newUser[0].created_at
    };
    const response = {
      success: true,
      user,
      token,
      message: "User registered successfully"
    };
    res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register user. Please try again."
    });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }
    const db = getDb();
    const users = await db`
      SELECT id, name, email, password_hash, preferences, theme, created_at
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `;
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    const userData = users[0];
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    const token = jwt.sign(
      { userId: userData.id, email: userData.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    await db`
      DELETE FROM sessions 
      WHERE user_id = ${userData.id} AND expires_at < NOW()
    `;
    const sessionId = uuid.v4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    await db`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (${sessionId}, ${userData.id}, ${token}, ${expiresAt})
    `;
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      preferences: userData.preferences || {},
      theme: userData.theme,
      created_at: userData.created_at
    };
    const response = {
      success: true,
      user,
      token,
      message: "Login successful"
    };
    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to login. Please try again."
    });
  }
};
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }
    const db = getDb();
    await db`
      DELETE FROM sessions WHERE token = ${token}
    `;
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to logout"
    });
  }
};
const getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const sessions = await db`
      SELECT s.expires_at, u.id, u.name, u.email, u.preferences, u.theme, u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `;
    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
    const userData = sessions[0];
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      preferences: userData.preferences || {},
      theme: userData.theme,
      created_at: userData.created_at
    };
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};
const updateProfile = async (req, res) => {
  try {
    const userId = req.headers["user-id"];
    const { name, preferences } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID required"
      });
    }
    const db = getDb();
    if (!db) {
      return res.json({
        success: true,
        user: {
          id: userId,
          name: name || "Guest User",
          email: "guest@fridgechef.com",
          preferences: preferences || {},
          theme: "light",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        },
        message: "Profile updated successfully (stored locally - database not available)"
      });
    }
    const updateFields = {};
    if (name !== void 0) updateFields.name = name;
    if (preferences !== void 0) updateFields.preferences = preferences;
    const updatedUsers = await db`
      UPDATE users 
      SET 
        name = COALESCE(${name}, name),
        preferences = COALESCE(${JSON.stringify(preferences)}, preferences),
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, name, email, preferences, theme, created_at
    `;
    if (updatedUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const user = {
      id: updatedUsers[0].id,
      name: updatedUsers[0].name,
      email: updatedUsers[0].email,
      preferences: updatedUsers[0].preferences || {},
      theme: updatedUsers[0].theme,
      created_at: updatedUsers[0].created_at
    };
    res.json({
      success: true,
      user,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};
const getProfile = async (req, res) => {
  try {
    const userId = req.headers["user-id"];
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID required"
      });
    }
    const db = getDb();
    if (!db) {
      return res.json({
        success: true,
        user: {
          id: userId,
          name: "Guest User",
          email: "guest@fridgechef.com",
          preferences: {},
          theme: "light",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    }
    const users = await db`
      SELECT id, name, email, preferences, theme, created_at
      FROM users 
      WHERE id = ${userId}
    `;
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const user = {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email,
      preferences: users[0].preferences || {},
      theme: users[0].theme,
      created_at: users[0].created_at
    };
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
};
function createServer() {
  const app2 = express();
  app2.use(cors({
    origin: ["https://*.vercel.app", "https://*.netlify.app", "https://*.netlify.com"],
    credentials: true
  }));
  app2.use(express.json({ limit: "10mb" }));
  app2.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app2.get("/api/health", healthCheck);
  app2.get("/api/ready", readinessCheck);
  app2.get("/api/ping", (req, res) => {
    res.json({
      message: "FridgeChef API is running!",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: "production"
    });
  });
  app2.post("/api/auth/register", register);
  app2.post("/api/auth/login", login);
  app2.post("/api/auth/logout", logout);
  app2.get("/api/auth/me", getCurrentUser);
  app2.get("/api/profile", getProfile);
  app2.put("/api/profile", updateProfile);
  app2.post("/api/recipes/generate", generateRecipes);
  app2.get("/api/dashboard", getDashboardData);
  app2.get("/api/recipes/history", getRecipeHistory);
  app2.post("/api/recipes/like", likeRecipe);
  app2.get("/api/recipes/:id", getRecipe);
  app2.delete("/api/recipes/:id", deleteRecipe);
  app2.post("/api/recipes/rate", rateRecipe);
  app2.post("/api/recipes/:id/detailed-explanation", getDetailedExplanation);
  app2.use((err, req, res, next) => {
    console.error("Server error:", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  setImmediate(() => {
    initializeDatabase().catch((err) => {
      console.warn("Database initialization failed, continuing without database:", err.message);
    });
  });
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
let __dirname$1;
if (typeof __dirname$1 === "undefined") {
  __dirname$1 = path.dirname(url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("production.cjs", document.baseURI).href));
}
const distPath = path.join(__dirname$1, "../spa");
app.use(express__namespace.static(distPath));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API endpoint not found",
      path: req.path,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
exports.createServer = createServer;
//# sourceMappingURL=production.cjs.map
