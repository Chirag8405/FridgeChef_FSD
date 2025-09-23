import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthRequest, AuthResponse } from '@shared/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isGuest: boolean;
  loading: boolean;
  guestId: string;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestId, setGuestId] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved authentication
    const savedToken = localStorage.getItem('FridgeChef_token');
    const savedUser = localStorage.getItem('FridgeChef_user');
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setToken(savedToken);
        
        // Apply theme
        if (userData.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
        
        // Verify token is still valid
        verifyToken(savedToken);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('FridgeChef_user');
        localStorage.removeItem('FridgeChef_token');
      }
    }
    
    // Generate or get guest ID for anonymous users
    let guestUserId = localStorage.getItem('FridgeChef_guest_id');
    if (!guestUserId) {
      guestUserId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('FridgeChef_guest_id', guestUserId);
    }
    setGuestId(guestUserId);
    
    setLoading(false);
  }, []);

  const verifyToken = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Token verification failed');
      }
      
      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
        if (data.user.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      } else {
        throw new Error('Invalid token response');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      // Clear invalid token
      localStorage.removeItem('FridgeChef_token');
      localStorage.removeItem('FridgeChef_user');
      setToken(null);
      setUser(null);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const requestBody: AuthRequest = { email, password };
      
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data: AuthResponse = await response.json();
      
      if (data.success && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('FridgeChef_user', JSON.stringify(data.user));
        localStorage.setItem('FridgeChef_token', data.token);
        
        // Apply theme
        if (data.user.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
        
        return true;
      } else {
        console.error('Login failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const requestBody: AuthRequest = { name, email, password };
      
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data: AuthResponse = await response.json();
      
      if (data.success && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('FridgeChef_user', JSON.stringify(data.user));
        localStorage.setItem('FridgeChef_token', data.token);
        
        // Apply theme
        if (data.user.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
        
        return true;
      } else {
        console.error('Registration failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('FridgeChef_user');
    localStorage.removeItem('FridgeChef_token');
    
    // Reset theme to light
    document.documentElement.classList.remove('dark');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('FridgeChef_user', JSON.stringify(updatedUser));
    
    // Apply theme changes immediately
    if (updates.theme) {
      if (updates.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // TODO: In a real app, sync with backend
    // await updateUserPreferences(updates);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isGuest: !user,
    loading,
    guestId,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
