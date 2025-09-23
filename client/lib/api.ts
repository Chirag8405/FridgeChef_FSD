/**
 * API utility functions for interacting with the FridgeChef backend
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to get auth headers
export const getAuthHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function to handle API responses
export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If we can't parse the error response, use the status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new ApiError(errorMessage, response.status);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new ApiError('Invalid JSON response', response.status);
  }
};

// API request wrapper with error handling
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> => {
  const url = `${API_BASE}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(token),
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    return await handleApiResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
};

// Specific API functions
export const api = {
  // Health checks
  health: () => apiRequest('/health'),
  
  // Authentication
  auth: {
    register: (name: string, email: string, password: string) =>
      apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    
    login: (email: string, password: string) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    
    logout: (token: string) =>
      apiRequest('/auth/logout', {
        method: 'POST',
      }, token),
    
    getCurrentUser: (token: string) =>
      apiRequest('/auth/me', {}, token),
  },
  
  // Recipes
  recipes: {
    generate: (data: any, token?: string | null) =>
      apiRequest('/recipes/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }, token),
    
    getHistory: (params?: URLSearchParams, token?: string | null) => {
      const endpoint = params ? `/recipes/history?${params.toString()}` : '/recipes/history';
      return apiRequest(endpoint, {}, token);
    },
    
    get: (id: string, token?: string | null) =>
      apiRequest(`/recipes/${id}`, {}, token),
    
    like: (data: { recipe_id: string; liked: boolean }, token?: string | null) =>
      apiRequest('/recipes/like', {
        method: 'POST',
        body: JSON.stringify(data),
      }, token),
    
    delete: (id: string, token: string) =>
      apiRequest(`/recipes/${id}`, {
        method: 'DELETE',
      }, token),
    
    rate: (data: { recipe_id: string; rating: number; review?: string }, token: string) =>
      apiRequest('/recipes/rate', {
        method: 'POST',
        body: JSON.stringify(data),
      }, token),
  },
  
  // Dashboard
  dashboard: (token?: string | null) =>
    apiRequest('/dashboard', {}, token),
};

export default api;