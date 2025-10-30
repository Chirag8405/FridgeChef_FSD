import { useState, useRef, useEffect } from 'react';
import { Plus, X, Sparkles, Clock, Users, ChefHat, BookOpen } from 'lucide-react';
import { GenerateRecipeRequest, GenerateRecipeResponse, Recipe } from '@shared/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';

export function GenerateRecipe() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [allowAdditional, setAllowAdditional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const recipeDetailsRef = useRef<HTMLDivElement>(null);
  
  const { user, isGuest, guestId } = useAuth();
  const { addRecipes, likeRecipe } = useRecipes();

  const addIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addIngredient();
    }
  };

  const generateRecipes = async () => {
    if (ingredients.length === 0) {
      return;
    }

    setLoading(true);
    setGeneratedRecipes([]);
    setSelectedRecipe(null);

    try {
      const request: GenerateRecipeRequest = {
        ingredients,
        allow_additional_ingredients: allowAdditional,
        preferences: {
          spice_level: 'medium',
          cooking_time_preference: 'medium'
        }
      };

      const userId = user?.id || guestId;
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId,
        },
        body: JSON.stringify(request),
      });

      const data: GenerateRecipeResponse = await response.json();
      
      if (data.success) {
        setGeneratedRecipes(data.recipes);
        // Add to global recipe context
        addRecipes(data.recipes);
      } else {
        console.error('Failed to generate recipes:', data.message);
      }
    } catch (error) {
      console.error('Error generating recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeRecipe = async (recipeId: string, liked: boolean) => {
    await likeRecipe(recipeId, liked);
    
    // Update local state
    setGeneratedRecipes(recipes => 
      recipes.map(recipe => 
        recipe.id === recipeId ? { ...recipe, liked } : recipe
      )
    );
    
    // Update selected recipe if it's the one being liked
    if (selectedRecipe?.id === recipeId) {
      setSelectedRecipe({ ...selectedRecipe, liked });
    }
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    // Smooth scroll to recipe details after a brief delay for rendering
    setTimeout(() => {
      recipeDetailsRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }, 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-heading font-bold">Generate Recipes</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {isGuest 
            ? "Tell us what ingredients you have, and we'll create amazing recipes for you"
            : "Add your ingredients and let AI create personalized recipes just for you"
          }
        </p>
        {isGuest && (
          <div className="text-sm text-muted-foreground bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg max-w-md mx-auto">
            🍳 No account needed! Start generating recipes right away.
          </div>
        )}
      </div>

      {/* Ingredients Input */}
      <Card className="recipe-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            Available Ingredients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add an ingredient (e.g., chicken breast, onions, garlic)"
              value={currentIngredient}
              onChange={(e) => setCurrentIngredient(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={addIngredient} disabled={!currentIngredient.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {ingredients.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient) => (
                  <Badge
                    key={ingredient}
                    variant="secondary"
                    className="text-sm px-3 py-1 flex items-center gap-2"
                  >
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow-additional"
                  checked={allowAdditional}
                  onCheckedChange={(checked) => setAllowAdditional(checked as boolean)}
                />
                <Label htmlFor="allow-additional" className="text-sm">
                  Allow AI to suggest additional essential ingredients if needed
                </Label>
              </div>

              <Button
                onClick={generateRecipes}
                disabled={loading || ingredients.length === 0}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating Recipes...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Recipes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Recipes */}
      {generatedRecipes.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-heading font-semibold">Your Recipe Options</h2>
            <p className="text-muted-foreground">Click on a recipe to see the full instructions</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {generatedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSelect={() => handleRecipeSelect(recipe)}
                onLike={(liked) => handleLikeRecipe(recipe.id, liked)}
                isSelected={selectedRecipe?.id === recipe.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Selected Recipe Details */}
      {selectedRecipe && (
        <Card ref={recipeDetailsRef} className="recipe-card scroll-mt-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-heading">{selectedRecipe.title}</CardTitle>
                <p className="text-muted-foreground mt-1">{selectedRecipe.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRecipe(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <RecipeDetails recipe={selectedRecipe} onLike={handleLikeRecipe} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecipeCard({ 
  recipe, 
  onSelect, 
  onLike, 
  isSelected 
}: { 
  recipe: Recipe; 
  onSelect: () => void; 
  onLike: (liked: boolean) => void;
  isSelected: boolean;
}) {
  return (
    <Card 
      className={`recipe-card cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-heading font-medium text-lg leading-tight">{recipe.title}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike(!recipe.liked);
              }}
              className={`transition-colors ${
                recipe.liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              <ChefHat className={`h-4 w-4 ${recipe.liked ? 'fill-current' : ''}`} />
            </button>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {recipe.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {recipe.prep_time + recipe.cook_time}m
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {recipe.servings}
            </div>
            <Badge className={`recipe-badge recipe-badge-difficulty-${recipe.difficulty}`}>
              {recipe.difficulty}
            </Badge>
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-1">Ingredients needed:</p>
            <div className="flex flex-wrap gap-1">
              {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                <span key={index} className="ingredient-chip text-xs">
                  {ingredient.name}
                </span>
              ))}
              {recipe.ingredients.length > 3 && (
                <span className="ingredient-chip text-xs">
                  +{recipe.ingredients.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecipeDetails({ 
  recipe, 
  onLike 
}: { 
  recipe: Recipe; 
  onLike: (recipeId: string, liked: boolean) => void;
}) {
  const [detailedExplanation, setDetailedExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const getDetailedExplanation = async () => {
    setLoadingExplanation(true);
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/detailed-explanation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe: recipe  // Send recipe data for guest users without database
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDetailedExplanation(data.explanation);
      } else {
        console.error('Failed to get detailed explanation:', data.message);
      }
    } catch (error) {
      console.error('Error getting detailed explanation:', error);
    } finally {
      setLoadingExplanation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recipe Info and Like Button */}
      <div className="flex items-center justify-between">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Total Time</p>
              <p className="text-sm text-muted-foreground">{recipe.prep_time + recipe.cook_time} minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Servings</p>
              <p className="text-sm text-muted-foreground">{recipe.servings} people</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Difficulty</p>
              <Badge className={`recipe-badge recipe-badge-difficulty-${recipe.difficulty}`}>
                {recipe.difficulty}
              </Badge>
            </div>
          </div>
        </div>
        
        <Button
          variant={recipe.liked ? "default" : "outline"}
          size="sm"
          onClick={() => onLike(recipe.id, !recipe.liked)}
          className={recipe.liked ? "bg-red-500 hover:bg-red-600" : ""}
        >
          <ChefHat className={`h-4 w-4 mr-2 ${recipe.liked ? 'fill-current' : ''}`} />
          {recipe.liked ? 'Liked!' : 'Like Recipe'}
        </Button>
      </div>

      <Separator />

      {/* Ingredients */}
      <div>
        <h4 className="text-lg font-heading font-semibold mb-3">Ingredients</h4>
        <div className="grid md:grid-cols-2 gap-2">
          {recipe.ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <span className="text-sm">
                <span className="font-medium">{ingredient.amount}</span>
                {ingredient.unit && <span> {ingredient.unit}</span>}
                <span className="ml-1">{ingredient.name}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Instructions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-heading font-semibold">Instructions</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={getDetailedExplanation}
            disabled={loadingExplanation}
          >
            {loadingExplanation ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Get Detailed Explanation
              </>
            )}
          </Button>
        </div>
        
        <ol className="space-y-3">
          {recipe.instructions.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>

        {/* Detailed Explanation Section */}
        {detailedExplanation && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h5 className="font-semibold text-blue-900 dark:text-blue-100">Detailed Cooking Guide</h5>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap leading-relaxed">
                {detailedExplanation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
