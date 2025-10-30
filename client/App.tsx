import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RecipeProvider } from "@/contexts/RecipeContext";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { GenerateRecipe } from "@/pages/GenerateRecipe";
import { History } from "@/pages/History";
import { Profile } from "@/pages/Profile";
import { Auth } from "@/pages/Auth";
import { NotFound } from "@/pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <RecipeProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/generate" element={<GenerateRecipe />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/auth" element={<Auth />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </RecipeProvider>
    </AuthProvider>
  );
}

export default App;
