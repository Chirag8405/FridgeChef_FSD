import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Recipe } from "@shared/api";

interface RecipeContextType {
  recipes: Recipe[];
  likedRecipes: Recipe[];
  totalRecipes: number;
  likeRecipe: (recipeId: string, liked: boolean) => Promise<void>;
  addRecipes: (newRecipes: Recipe[]) => void;
  getRecipe: (id: string) => Recipe | undefined;
  refreshStats: () => void;
  loading: boolean;
  error: string | null;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedRecipes = localStorage.getItem("FridgeChef_recipes");
    if (savedRecipes) {
      try {
        setRecipes(JSON.parse(savedRecipes));
      } catch (error) {
        console.error("Error parsing saved recipes:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("FridgeChef_recipes", JSON.stringify(recipes));
  }, [recipes]);

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
