import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Clock, Users, Heart, TrendingUp, ChefHat, Sparkles } from 'lucide-react';
import { DashboardData, Recipe } from '@shared/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isGuest, guestId } = useAuth();
  const { recipes, likedRecipes, totalRecipes, likeRecipe } = useRecipes();

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id, guestId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // For logged-in users, always fetch from API to get database data
      // For guests, use local context data if available
      if (isGuest && recipes.length > 0) {
        const trendingRecipe = likedRecipes.length > 0 
          ? likedRecipes[Math.floor(Math.random() * likedRecipes.length)]
          : null;
        
        const data: DashboardData = {
          trending_recipe: trendingRecipe,
          top_liked_recipes: likedRecipes.slice(0, 5),
          total_recipes: totalRecipes,
          total_liked: likedRecipes.length
        };
        
        setDashboardData(data);
        setLoading(false);
        return;
      }

      // Fetch from API (for logged-in users or when no local data)
      const userId = user?.id || guestId;
      console.log('Fetching dashboard data for user:', userId);
      
      const response = await fetch('/api/dashboard', {
        headers: {
          'user-id': userId,
        },
      });
      const data = await response.json();
      console.log('Dashboard data received:', data);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Use empty data as fallback
      setDashboardData({
        trending_recipe: null,
        top_liked_recipes: [],
        total_recipes: totalRecipes,
        total_liked: likedRecipes.length
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalRecipesCount = dashboardData?.total_recipes || totalRecipes;
  const totalLikedCount = dashboardData?.total_liked || likedRecipes.length;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        {isGuest ? (
          <>
            <h1 className="text-4xl font-heading font-bold text-balance">
              Welcome to FridgeChef
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Transform your ingredients into delicious recipes with the power of AI
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-heading font-bold text-balance">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Ready to create some amazing recipes today?
            </p>
          </>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="recipe-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecipesCount}</div>
            <p className="text-xs text-muted-foreground">Recipes generated</p>
          </CardContent>
        </Card>

        <Card className="recipe-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liked Recipes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLikedCount}</div>
            <p className="text-xs text-muted-foreground">Favorites saved</p>
          </CardContent>
        </Card>

        <Card className="recipe-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRecipesCount > 0
                ? Math.round((totalLikedCount / totalRecipesCount) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Recipes you loved</p>
          </CardContent>
        </Card>

        <Card className="recipe-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Generate</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-6">
            <Link to="/generate">
              <Button className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Create Recipe
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Trending Recipe of the Day */}
      {dashboardData?.trending_recipe && (
        <Card className="recipe-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Featured Recipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendingRecipeCard 
              recipe={dashboardData.trending_recipe} 
              onLike={likeRecipe}
            />
          </CardContent>
        </Card>
      )}

      {/* Top Liked Recipes */}
      {dashboardData?.top_liked_recipes && dashboardData.top_liked_recipes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-semibold">Your Top Recipes</h2>
            <Link to="/history?filter=liked">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dashboardData.top_liked_recipes.slice(0, 3).map((recipe) => (
              <RecipePreviewCard 
                key={recipe.id} 
                recipe={recipe} 
                onLike={likeRecipe}
              />
            ))}
          </div>
        </div>
      )}

      {/* Getting Started / Empty State */}
      {totalRecipesCount === 0 && (
        <Card className="recipe-card text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <ChefHat className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-heading font-semibold">Ready to cook something amazing?</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start by adding ingredients you have at home and let our AI create the perfect recipe for you.
              </p>
            </div>
            
            {/* Steps illustration */}
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground py-4">
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                <span>Add ingredients</span>
              </div>
              <span>→</span>
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                <span>AI generates</span>
              </div>
              <span>→</span>
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                <span>Enjoy cooking!</span>
              </div>
            </div>
            
            <Link to="/generate">
              <Button size="lg" className="mt-4">
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Your First Recipe
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TrendingRecipeCard({ 
  recipe, 
  onLike 
}: { 
  recipe: Recipe; 
  onLike: (recipeId: string, liked: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-heading font-semibold">{recipe.title}</h3>
          <p className="text-muted-foreground">{recipe.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="recipe-badge recipe-badge-difficulty-easy">
            {recipe.difficulty}
          </Badge>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(recipe.id, !recipe.liked);
            }}
            className={`transition-colors ${
              recipe.liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${recipe.liked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {recipe.prep_time + recipe.cook_time} min
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {recipe.servings} servings
        </div>
        {recipe.cuisine_type && (
          <Badge variant="outline">{recipe.cuisine_type}</Badge>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Ingredients</h4>
          <div className="flex flex-wrap gap-1">
            {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
              <span key={index} className="ingredient-chip">
                {ingredient.name}
              </span>
            ))}
            {recipe.ingredients.length > 4 && (
              <span className="ingredient-chip">
                +{recipe.ingredients.length - 4} more
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-end">
          <Link to={`/history`}>
            <Button variant="outline" size="sm">
              View Full Recipe
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function RecipePreviewCard({ 
  recipe, 
  onLike 
}: { 
  recipe: Recipe; 
  onLike: (recipeId: string, liked: boolean) => void;
}) {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="recipe-card hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => navigate('/history')}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-heading font-medium text-lg leading-tight">{recipe.title}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike(recipe.id, !recipe.liked);
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
            <Badge className={`recipe-badge recipe-badge-difficulty-${recipe.difficulty}`}>
              {recipe.difficulty}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
