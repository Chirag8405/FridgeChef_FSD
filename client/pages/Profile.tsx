import { useState, useEffect } from 'react';
import { User, Settings, Moon, Sun, Bell, Shield, Trash2, Save, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  preferences: {
    dietary_restrictions: string[];
    preferred_cuisines: string[];
    spice_level: 'mild' | 'medium' | 'hot';
    cooking_time_preference: 'quick' | 'medium' | 'long';
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  };
  stats: {
    total_recipes: number;
    liked_recipes: number;
    favorite_cuisine: string;
    avg_cooking_time: number;
  };
}

export function Profile() {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Guest User',
    email: 'guest@FridgeChef.com',
    bio: 'I love creating delicious recipes with AI assistance!',
    preferences: {
      dietary_restrictions: [],
      preferred_cuisines: [],
      spice_level: 'medium',
      cooking_time_preference: 'medium',
      theme: 'light',
      notifications: true,
    },
    stats: {
      total_recipes: 0,
      liked_recipes: 0,
      favorite_cuisine: 'Not available yet',
      avg_cooking_time: 0,
    }
  });

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if dark mode is already enabled
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Update profile preferences
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        theme: newDarkMode ? 'dark' : 'light'
      }
    }));
  };

  const handleSave = () => {
    // Here you would typically save to the backend
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const addDietaryRestriction = (restriction: string) => {
    if (restriction && !profile.preferences.dietary_restrictions.includes(restriction)) {
      setProfile(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          dietary_restrictions: [...prev.preferences.dietary_restrictions, restriction]
        }
      }));
    }
  };

  const removeDietaryRestriction = (restriction: string) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        dietary_restrictions: prev.preferences.dietary_restrictions.filter(r => r !== restriction)
      }
    }));
  };

  const addCuisine = (cuisine: string) => {
    if (cuisine && !profile.preferences.preferred_cuisines.includes(cuisine)) {
      setProfile(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          preferred_cuisines: [...prev.preferences.preferred_cuisines, cuisine]
        }
      }));
    }
  };

  const removeCuisine = (cuisine: string) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        preferred_cuisines: prev.preferences.preferred_cuisines.filter(c => c !== cuisine)
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto">
          <User className="h-10 w-10 text-orange-600" />
        </div>
        <div>
          <h1 className="text-4xl font-heading font-bold">{profile.name}</h1>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      {saved && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <Save className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Profile settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="recipe-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(!editing)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!editing}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!editing}
                  placeholder="Tell us about yourself and your cooking style..."
                  rows={3}
                />
              </div>

              {editing && (
                <div className="flex gap-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <div className="space-y-6">
            {/* Dietary Restrictions */}
            <Card className="recipe-card">
              <CardHeader>
                <CardTitle>Dietary Restrictions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.dietary_restrictions.map((restriction) => (
                    <Badge key={restriction} variant="secondary" className="flex items-center gap-1">
                      {restriction}
                      <button
                        onClick={() => removeDietaryRestriction(restriction)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={addDietaryRestriction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add dietary restriction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="gluten-free">Gluten-free</SelectItem>
                    <SelectItem value="dairy-free">Dairy-free</SelectItem>
                    <SelectItem value="nut-free">Nut-free</SelectItem>
                    <SelectItem value="low-carb">Low-carb</SelectItem>
                    <SelectItem value="keto">Keto</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Preferred Cuisines */}
            <Card className="recipe-card">
              <CardHeader>
                <CardTitle>Preferred Cuisines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.preferred_cuisines.map((cuisine) => (
                    <Badge key={cuisine} variant="secondary" className="flex items-center gap-1">
                      {cuisine}
                      <button
                        onClick={() => removeCuisine(cuisine)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={addCuisine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add cuisine preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Italian">Italian</SelectItem>
                    <SelectItem value="Asian">Asian</SelectItem>
                    <SelectItem value="Mexican">Mexican</SelectItem>
                    <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                    <SelectItem value="Indian">Indian</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="American">American</SelectItem>
                    <SelectItem value="Thai">Thai</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Cooking Preferences */}
            <Card className="recipe-card">
              <CardHeader>
                <CardTitle>Cooking Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Spice Level</Label>
                    <Select 
                      value={profile.preferences.spice_level} 
                      onValueChange={(value: 'mild' | 'medium' | 'hot') => 
                        setProfile(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, spice_level: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hot">Hot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Cooking Time Preference</Label>
                    <Select 
                      value={profile.preferences.cooking_time_preference} 
                      onValueChange={(value: 'quick' | 'medium' | 'long') => 
                        setProfile(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, cooking_time_preference: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quick">Quick (under 30 min)</SelectItem>
                        <SelectItem value="medium">Medium (30-60 min)</SelectItem>
                        <SelectItem value="long">Long (over 1 hour)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="recipe-card">
              <CardHeader>
                <CardTitle>Recipe Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{profile.stats.total_recipes}</div>
                    <div className="text-sm text-muted-foreground">Total Recipes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{profile.stats.liked_recipes}</div>
                    <div className="text-sm text-muted-foreground">Liked Recipes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {profile.stats.total_recipes > 0 ? Math.round((profile.stats.liked_recipes / profile.stats.total_recipes) * 100) : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{profile.stats.avg_cooking_time}m</div>
                    <div className="text-sm text-muted-foreground">Avg. Cook Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="recipe-card">
              <CardHeader>
                <CardTitle>Cooking Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Favorite Cuisine</Label>
                  <div className="text-lg font-semibold text-orange-600">{profile.stats.favorite_cuisine}</div>
                </div>
                <Separator />
                <div>
                  <Label>Most Active Day</Label>
                  <div className="text-lg font-semibold">Not available yet</div>
                </div>
                <Separator />
                <div>
                  <Label>Recipe Streak</Label>
                  <div className="text-lg font-semibold">0 days</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="space-y-6">
            {/* Theme Settings */}
            <Card className="recipe-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="recipe-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and tips
                    </p>
                  </div>
                  <Switch 
                    checked={profile.preferences.notifications}
                    onCheckedChange={(checked) => 
                      setProfile(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, notifications: checked }
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* API Information */}
            <Card className="recipe-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  AI Recipe Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Recipe generation is powered by OpenAI's advanced AI models. The API key is securely managed by the application and no configuration is required from users.
                  </AlertDescription>
                </Alert>
                <div className="text-sm text-muted-foreground">
                  <strong>Features available:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Intelligent recipe generation from your ingredients</li>
                    <li>Dietary restriction and preference support</li>
                    <li>Multiple cuisine style options</li>
                    <li>Personalized cooking recommendations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="recipe-card border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Clear All Recipes</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Clear all your generated recipes from local storage. This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm" onClick={() => {
                    localStorage.removeItem('FridgeChef_recipes');
                    window.location.reload();
                  }}>
                    Clear All Recipes
                  </Button>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold">Reset Preferences</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Reset all your preferences to default values.
                  </p>
                  <Button variant="destructive" size="sm" onClick={() => {
                    setProfile(prev => ({
                      ...prev,
                      preferences: {
                        dietary_restrictions: [],
                        preferred_cuisines: [],
                        spice_level: 'medium',
                        cooking_time_preference: 'medium',
                        theme: 'light',
                        notifications: true,
                      }
                    }));
                  }}>
                    Reset Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
