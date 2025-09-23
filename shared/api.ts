/**
 * Shared API types between client and server for the AI Recipe Generator
 */

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
  theme: 'light' | 'dark';
  created_at: string;
}

export interface UserPreferences {
  dietary_restrictions?: string[];
  preferred_cuisines?: string[];
  spice_level?: 'mild' | 'medium' | 'hot';
  cooking_time_preference?: 'quick' | 'medium' | 'long';
}

// Recipe types
export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prep_time: number; // minutes
  cook_time: number; // minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine_type?: string;
  liked: boolean;
  created_at: string;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit?: string;
}

// API Request/Response types
export interface GenerateRecipeRequest {
  ingredients: string[];
  preferences?: UserPreferences;
  allow_additional_ingredients?: boolean;
}

export interface GenerateRecipeResponse {
  recipes: Recipe[];
  success: boolean;
  message?: string;
}

export interface DashboardData {
  trending_recipe: Recipe | null;
  top_liked_recipes: Recipe[];
  total_recipes: number;
  total_liked: number;
}

export interface RecipeHistoryRequest {
  user_id: string;
  filter?: 'all' | 'liked' | 'disliked';
  sort_by?: 'created_at' | 'title' | 'cook_time';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface RecipeHistoryResponse {
  recipes: Recipe[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface LikeRecipeRequest {
  recipe_id: string;
  liked: boolean;
}

export interface LikeRecipeResponse {
  success: boolean;
  recipe: Recipe;
}

// Authentication types
export interface AuthRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Recipe rating types
export interface RateRecipeRequest {
  recipe_id: string;
  rating: number; // 1-5
  review?: string;
}

export interface RateRecipeResponse {
  success: boolean;
  rating?: any;
  message?: string;
}
