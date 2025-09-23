import { ChefHat, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="recipe-card text-center max-w-md">
        <CardContent className="p-8 space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <ChefHat className="h-10 w-10 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-heading font-bold">Recipe Not Found</h1>
            <p className="text-muted-foreground">
              Looks like this page went missing! Let's get you back to cooking.
            </p>
          </div>
          
          <Link to="/">
            <Button size="lg" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Back to Kitchen
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
