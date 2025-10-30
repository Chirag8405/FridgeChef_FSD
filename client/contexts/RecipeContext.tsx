import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Recipe } from "@shared/api";
import { useAuth } from "./AuthContext";

interface RecipeContextType {
  recipes: Recipe[];
  likedRecipes: Recipe[];
  totalRecipes: number;
  likeRecipe: (recipeId: string, liked: boolean) => Promise<void>;
  addRecipes: (newRecipes: Recipe[]) => void;
  getRecipe: (id: string) => Recipe | undefined;
  refreshStats: () => void;
  clearRecipes: () => void;
  syncWithDatabase: (userId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user to make localStorage user-specific
  const { user, guestId } = useAuth();
  const userId = user?.id || guestId;

  // Load recipes from localStorage when user changes
  useEffect(() => {
    if (userId && userId !== currentUserId) {
      const storageKey = `FridgeChef_recipes_${userId}`;
      const savedRecipes = localStorage.getItem(storageKey);
      if (savedRecipes) {
        try {
          setRecipes(JSON.parse(savedRecipes));
        } catch (error) {
          console.error("Error parsing saved recipes:", error);
          setRecipes([]);
        }
      } else {
        // Clear recipes if no saved data for this user
        setRecipes([]);
      }
      setCurrentUserId(userId);
    }
  }, [userId, currentUserId]);

  // Save recipes to localStorage whenever they change
  useEffect(() => {
    if (userId) {
      const storageKey = `FridgeChef_recipes_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(recipes));
    }
  }, [recipes, userId]);

  const clearRecipes = () => {
    setRecipes([]);
    if (userId) {
      const storageKey = `FridgeChef_recipes_${userId}`;
      localStorage.removeItem(storageKey);
    }
  };

  const syncWithDatabase = async (syncUserId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recipes?userId=${syncUserId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Synced recipes from database:', data.recipes?.length || 0);
        setRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error('Failed to sync recipes from database:', error);
    } finally {
      setLoading(false);
    }
  };

  const likeRecipe = async (recipeId: string, liked: boolean) => {
    setRecipes(prevRecipes =>
      prevRecipes.map(recipe =>
        recipe.id === recipeId ? { ...recipe, liked } : recipe
      )
    );
  };

  const addRecipes = (newRecipes: Recipe[]) => {
    setRecipes(prevRecipes => {
      const existingIds = new Set(prevRecipes.map(r => r.id));
      const uniqueNewRecipes = newRecipes.filter(r => !existingIds.has(r.id));
      return [...prevRecipes, ...uniqueNewRecipes];
    });
  };

  const getRecipe = (id: string): Recipe | undefined => {
    return recipes.find(recipe => recipe.id === id);
  };

  const refreshStats = () => {};

  const likedRecipes = recipes.filter(recipe => recipe.liked);
  const totalRecipes = recipes.length;

  const value: RecipeContextType = {
    recipes,
    likedRecipes,
    totalRecipes,
    likeRecipe,
    addRecipes,
    getRecipe,
    refreshStats,
    clearRecipes,
    syncWithDatabase,
    loading,
    error
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipes must be used within a RecipeProvider");
  }
  return context;
}
