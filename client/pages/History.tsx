import { useState, useEffect, useRef } from 'react';
import { Heart, Clock, Users, Search, SortAsc, SortDesc, ChefHat, BookOpen, Sparkles } from 'lucide-react';
import { RecipeHistoryResponse, Recipe } from '@shared/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';

type FilterType = 'all' | 'liked' | 'disliked';
type SortField = 'created_at' | 'title' | 'cook_time';
type SortOrder = 'desc' | 'asc';

export function History() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const recipeDetailsRef = useRef<HTMLDivElement>(null);

  const { user, guestId } = useAuth();
  const { recipes: contextRecipes, likeRecipe } = useRecipes();

  useEffect(() => {
    fetchRecipeHistory();
  }, [filter, sortBy, sortOrder, user, guestId]);

  const fetchRecipeHistory = async () => {
    try {
      setLoading(true);
      
      // Use context recipes if available, otherwise try API
      if (contextRecipes.length > 0) {
        let filteredRecipes = [...contextRecipes];
        
        // Apply filter
        if (filter === 'liked') {
          filteredRecipes = filteredRecipes.filter(recipe => recipe.liked);
        } else if (filter === 'disliked') {
          filteredRecipes = filteredRecipes.filter(recipe => !recipe.liked);
        }
        
        // Apply sorting
        filteredRecipes.sort((a, b) => {
          let aValue, bValue;
          switch (sortBy) {
            case 'title':
              aValue = a.title.toLowerCase();
              bValue = b.title.toLowerCase();
              break;
            case 'cook_time':
              aValue = a.cook_time + a.prep_time;
              bValue = b.cook_time + b.prep_time;
              break;
            default: // created_at
              aValue = new Date(a.created_at).getTime();
              bValue = new Date(b.created_at).getTime();
          }
          
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        
        setRecipes(filteredRecipes);
        setTotalRecipes(filteredRecipes.length);
        setLoading(false);
        return;
      }

      // Fallback to API
      const queryParams = new URLSearchParams({
        filter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: '1',
        limit: '50'
      });

      const userId = user?.id || guestId;
      const response = await fetch(`/api/recipes/history?${queryParams}`, {
        headers: {
          'user-id': userId,
        },
      });

      if (response.ok) {
        const data: RecipeHistoryResponse = await response.json();
        setRecipes(data.recipes);
        setTotalRecipes(data.total);
      } else {
        // No demo data fallback - just show empty state
        setRecipes([]);
        setTotalRecipes(0);
      }
    } catch (error) {
      console.error('Failed to fetch recipe history:', error);
      // No demo data fallback - just show empty state
      setRecipes([]);
      setTotalRecipes(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeRecipe = async (recipeId: string, liked: boolean) => {
    try {
      await likeRecipe(recipeId, liked);
      
      // Update local state
      setRecipes(prevRecipes =>
        prevRecipes.map(recipe =>
          recipe.id === recipeId ? { ...recipe, liked } : recipe
        )
      );
      
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe({ ...selectedRecipe, liked });
      }
    } catch (error) {
      console.error('Error updating recipe like status:', error);
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

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const likedCount = recipes.filter(recipe => recipe.liked).length;
  const dislikedCount = recipes.filter(recipe => !recipe.liked).length;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-heading font-bold">Recipe History</h1>
        <p className="text-xl text-muted-foreground">
          Manage and explore your generated recipes
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="recipe-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{totalRecipes}</div>
            <p className="text-sm text-muted-foreground">Total Recipes</p>
          </CardContent>
        </Card>
        <Card className="recipe-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{likedCount}</div>
            <p className="text-sm text-muted-foreground">Liked</p>
          </CardContent>
        </Card>
        <Card className="recipe-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{dislikedCount}</div>
            <p className="text-sm text-muted-foreground">Disliked</p>
          </CardContent>
        </Card>
        <Card className="recipe-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {totalRecipes > 0 ? Math.round((likedCount / totalRecipes) * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="recipe-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: SortField) => setSortBy(value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="title">Recipe Name</SelectItem>
                  <SelectItem value="cook_time">Cooking Time</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Recipes ({totalRecipes})</TabsTrigger>
          <TabsTrigger value="liked">Liked ({likedCount})</TabsTrigger>
          <TabsTrigger value="disliked">Disliked ({dislikedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-6">
          {filteredRecipes.length === 0 ? (
            <Card className="recipe-card text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">No recipes found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Try adjusting your search terms" 
                    : filter === 'all' 
                      ? "Start by generating some recipes!" 
                      : `No ${filter} recipes yet`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={() => handleRecipeSelect(recipe)}
                  onLike={(liked) => handleLikeRecipe(recipe.id, liked)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <Card ref={recipeDetailsRef} className="recipe-card scroll-mt-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-heading">{selectedRecipe.title}</CardTitle>
                <p className="text-muted-foreground mt-1">{selectedRecipe.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLikeRecipe(selectedRecipe.id, !selectedRecipe.liked)}
                  className={selectedRecipe.liked ? 'text-red-500' : 'text-muted-foreground'}
                >
                  <Heart className={`h-4 w-4 ${selectedRecipe.liked ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecipe(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RecipeDetails recipe={selectedRecipe} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecipeCard({ 
  recipe, 
  onSelect, 
  onLike 
}: { 
  recipe: Recipe; 
  onSelect: () => void; 
  onLike: (liked: boolean) => void;
}) {
  return (
    <Card className="recipe-card cursor-pointer hover:shadow-lg transition-all duration-200">
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
              <Heart className={`h-4 w-4 ${recipe.liked ? 'fill-current' : ''}`} />
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
            <Badge className={`text-xs ${
              recipe.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {recipe.difficulty}
            </Badge>
          </div>

          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onSelect}
            >
              View Recipe
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecipeDetails({ recipe }: { recipe: Recipe }) {
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
      {/* Recipe Info */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{recipe.prep_time}</div>
          <div className="text-sm text-muted-foreground">Prep (min)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{recipe.cook_time}</div>
          <div className="text-sm text-muted-foreground">Cook (min)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{recipe.servings}</div>
          <div className="text-sm text-muted-foreground">Servings</div>
        </div>
        <div className="text-center">
          <Badge className={`text-sm ${
            recipe.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {recipe.difficulty}
          </Badge>
        </div>
      </div>

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
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
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
