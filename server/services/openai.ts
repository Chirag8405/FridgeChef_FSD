import OpenAI from "openai";
import {
  GenerateRecipeRequest,
  Recipe,
  Ingredient,
  UserPreferences,
} from "@shared/api";
import { v4 as uuidv4 } from "uuid";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

interface ParsedRecipe {
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  cuisine_type?: string;
}

export class OpenAIService {
  private buildPrompt(request: GenerateRecipeRequest): string {
    const { ingredients, preferences, allow_additional_ingredients } = request;

    const ingredientsList = ingredients.join(", ");

    let prompt = `Act as a professional chef who only suggests recipes using ingredients available at hand unless given permission to include others.

Available ingredients: ${ingredientsList}

${
  allow_additional_ingredients
    ? 'You may suggest additional essential ingredients if absolutely necessary, but clearly mark them as "ADDITIONAL NEEDED".'
    : "You must ONLY use the ingredients listed above. Do not suggest any additional ingredients."
}

User preferences:`;

    if (
      preferences?.dietary_restrictions &&
      preferences.dietary_restrictions.length > 0
    ) {
      prompt += `\n- Dietary restrictions: ${preferences.dietary_restrictions.join(", ")}`;
    }

    if (
      preferences?.preferred_cuisines &&
      preferences.preferred_cuisines.length > 0
    ) {
      prompt += `\n- Preferred cuisines: ${preferences.preferred_cuisines.join(", ")}`;
    }

    if (preferences?.spice_level) {
      prompt += `\n- Spice level: ${preferences.spice_level}`;
    }

    if (preferences?.cooking_time_preference) {
      prompt += `\n- Cooking time preference: ${preferences.cooking_time_preference}`;
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

  async generateRecipes(request: GenerateRecipeRequest, userId: string): Promise<Recipe[]> {
    console.log("=== OpenAI Service Debug Info ===");
    console.log("Environment OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
    console.log("OpenAI client initialized:", !!openai);
    
    if (process.env.OPENAI_API_KEY) {
      console.log("API Key format check:", process.env.OPENAI_API_KEY.startsWith('sk-'));
      console.log("API Key length:", process.env.OPENAI_API_KEY.length);
    }

    // Test API connection
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
            content:
              "You are a professional chef and recipe creator. Always respond with valid JSON arrays containing recipe objects. Be precise with measurements and realistic with cooking times. IMPORTANT: Return ONLY the JSON array, no markdown formatting, no code blocks, no backticks, no additional text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      console.log("OpenAI response received, parsing...");
      console.log("Raw response preview:", response.substring(0, 100));

      try {
        // Clean the response to handle markdown code blocks
        let cleanedResponse = response.trim();
        
        // Remove markdown code block formatting if present
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Additional cleanup for any backticks at the start/end
        cleanedResponse = cleanedResponse.replace(/^`+|`+$/g, '');
        
        console.log("Cleaned response preview:", cleanedResponse.substring(0, 100));
        
        // Parse the JSON response
        let parsedRecipes = JSON.parse(cleanedResponse);

        // Ensure parsedRecipes is always an array
        if (!Array.isArray(parsedRecipes)) {
          parsedRecipes = [parsedRecipes];
        }

        // Convert to our Recipe format
        const recipes: Recipe[] = parsedRecipes.map((recipe) => ({
          id: uuidv4(),
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
          created_at: new Date().toISOString(),
        }));

        console.log(`Successfully generated ${recipes.length} recipes from OpenAI`);
        return recipes;

      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        console.error("Raw OpenAI response:", response);
        console.error("Response length:", response?.length);
        console.error("First 200 chars:", response?.substring(0, 200));
        
        // Fall back to mock recipes on parsing error
        console.log("Falling back to mock recipes due to parsing error");
        return this.generateMockRecipes(request, userId);
      }

    } catch (error) {
      console.error("OpenAI API Error:", error);
      // Fall back to mock recipes on error
      console.log("Falling back to mock recipes due to API error");
      return this.generateMockRecipes(request, userId);
    }
  }

  private generateMockRecipes(
    request: GenerateRecipeRequest,
    userId: string,
  ): Recipe[] {
    const { ingredients } = request;

    // Generate 2-3 mock recipes based on ingredients
    const mockRecipes: Recipe[] = [
      {
        id: uuidv4(),
        user_id: userId,
        title: `Quick ${ingredients[0] || "Ingredient"} Stir-Fry`,
        description:
          "A simple and delicious stir-fry that brings out the best flavors of your available ingredients.",
        ingredients: ingredients
          .slice(0, 4)
          .map((ing) => ({
            name: ing,
            amount: "1",
            unit: "cup",
          }))
          .concat([
            { name: "oil", amount: "2", unit: "tbsp" },
            { name: "salt", amount: "1", unit: "tsp" },
          ]),
        instructions: [
          "Heat oil in a large pan over medium-high heat",
          "Add your main ingredients and cook for 5-7 minutes",
          "Season with salt and any available spices",
          "Stir-fry until ingredients are tender and well combined",
          "Serve hot and enjoy!",
        ],
        prep_time: 10,
        cook_time: 15,
        servings: 2,
        difficulty: "easy",
        cuisine_type: "fusion",
        liked: false,
        created_at: new Date().toISOString(),
      },
    ];

    if (ingredients.length > 1) {
      mockRecipes.push({
        id: uuidv4(),
        user_id: userId,
        title: `${ingredients[0] || "Mixed"} and ${ingredients[1] || "Vegetable"} Soup`,
        description:
          "A comforting, hearty soup that makes the most of your pantry ingredients.",
        ingredients: ingredients
          .slice(0, 3)
          .map((ing) => ({
            name: ing,
            amount: "1",
            unit: "cup",
          }))
          .concat([
            { name: "water or broth", amount: "4", unit: "cups" },
            { name: "seasoning", amount: "to taste", unit: "" },
          ]),
        instructions: [
          "Bring water or broth to a boil in a large pot",
          "Add your ingredients starting with the longest-cooking items",
          "Simmer for 20-25 minutes until everything is tender",
          "Season to taste with salt, pepper, or available herbs",
          "Serve hot with crusty bread if available",
        ],
        prep_time: 15,
        cook_time: 25,
        servings: 4,
        difficulty: "easy",
        cuisine_type: "comfort food",
        liked: false,
        created_at: new Date().toISOString(),
      });
    }

    return mockRecipes;
  }

  async validateApiKey(): Promise<boolean> {
    if (!openai) return false;

    try {
      await openai.models.list();
      return true;
    } catch (error) {
      console.error("OpenAI API key validation failed:", error);
      return false;
    }
  }
}

export const openAIService = new OpenAIService();
