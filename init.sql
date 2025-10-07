-- FridgeChef Database Initialization Script
-- This script creates the necessary tables for the FridgeChef application

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    ingredients TEXT[] NOT NULL,
    instructions TEXT NOT NULL,
    cooking_time INTEGER, -- in minutes
    servings INTEGER,
    difficulty VARCHAR(50), -- easy, medium, hard
    cuisine_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipe_history table for tracking generated recipes
CREATE TABLE IF NOT EXISTS recipe_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_history_user_id ON recipe_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);

-- Insert sample data (optional for testing)
INSERT INTO users (email, password_hash, name) VALUES 
('demo@fridgechef.com', '$2b$10$example.hash.for.testing', 'Demo User')
ON CONFLICT (email) DO NOTHING;