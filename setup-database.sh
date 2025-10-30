#!/bin/bash

# FridgeChef Database Setup Script
# This script helps you set up your environment variables

echo "================================================"
echo "   FridgeChef Database Setup"
echo "================================================"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Your existing .env file was not modified."
        exit 0
    fi
fi

# Copy example file
cp .env.example .env
echo "✅ Created .env file from template"
echo ""

# Prompt for DATABASE_URL
echo "================================================"
echo "Step 1: Database Configuration"
echo "================================================"
echo ""
echo "Choose your database provider:"
echo "1) Neon PostgreSQL (Recommended - Free tier available)"
echo "2) Supabase PostgreSQL"
echo "3) Railway PostgreSQL"
echo "4) Other PostgreSQL provider"
echo "5) Skip (will run without database)"
echo ""
read -p "Enter your choice (1-5): " db_choice
echo ""

if [ "$db_choice" != "5" ]; then
    case $db_choice in
        1)
            echo "📘 Neon Setup:"
            echo "1. Go to https://neon.tech"
            echo "2. Sign up (free)"
            echo "3. Create a new project"
            echo "4. Copy the connection string"
            echo ""
            ;;
        2)
            echo "📗 Supabase Setup:"
            echo "1. Go to https://supabase.com"
            echo "2. Sign up with GitHub"
            echo "3. Create a new project"
            echo "4. Go to Settings → Database"
            echo "5. Copy the connection pooling URL"
            echo ""
            ;;
        3)
            echo "📙 Railway Setup:"
            echo "1. Go to https://railway.app"
            echo "2. Create new project → Add PostgreSQL"
            echo "3. Copy the DATABASE_URL from variables"
            echo ""
            ;;
        4)
            echo "📕 Other Provider:"
            echo "Make sure you have a PostgreSQL connection string ready"
            echo ""
            ;;
    esac
    
    read -p "Enter your DATABASE_URL: " database_url
    if [ ! -z "$database_url" ]; then
        # Escape special characters for sed
        escaped_url=$(echo "$database_url" | sed 's/[&/\]/\\&/g')
        sed -i "s|DATABASE_URL=|DATABASE_URL=$escaped_url|" .env
        echo "✅ DATABASE_URL configured"
    fi
else
    echo "⚠️  Skipping database configuration"
    echo "   The app will run without persistence"
fi
echo ""

# Prompt for OpenAI API Key
echo "================================================"
echo "Step 2: OpenAI API Key"
echo "================================================"
echo ""
echo "📘 OpenAI Setup:"
echo "1. Go to https://platform.openai.com/api-keys"
echo "2. Sign in or create an account"
echo "3. Click 'Create new secret key'"
echo "4. Copy the key (starts with sk-)"
echo ""
read -p "Enter your OPENAI_API_KEY (or press Enter to skip): " openai_key
if [ ! -z "$openai_key" ]; then
    sed -i "s|OPENAI_API_KEY=|OPENAI_API_KEY=$openai_key|" .env
    echo "✅ OPENAI_API_KEY configured"
else
    echo "⚠️  Skipping OpenAI configuration"
    echo "   The app will use mock recipes"
fi
echo ""

# Generate JWT Secret
echo "================================================"
echo "Step 3: JWT Secret"
echo "================================================"
echo ""
read -p "Generate a random JWT secret? (Y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    jwt_secret=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$jwt_secret|" .env
    echo "✅ Generated and configured JWT_SECRET"
else
    read -p "Enter your JWT_SECRET (min 32 characters): " jwt_secret
    if [ ! -z "$jwt_secret" ]; then
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$jwt_secret|" .env
        echo "✅ JWT_SECRET configured"
    fi
fi
echo ""

# Summary
echo "================================================"
echo "   Setup Complete!"
echo "================================================"
echo ""
echo "📝 Configuration Summary:"
echo "   ✓ .env file created"
if grep -q "DATABASE_URL=postgresql" .env; then
    echo "   ✓ Database configured"
else
    echo "   ⚠ Database not configured (will run without persistence)"
fi
if grep -q "OPENAI_API_KEY=sk-" .env; then
    echo "   ✓ OpenAI API configured"
else
    echo "   ⚠ OpenAI not configured (will use mock recipes)"
fi
if ! grep -q "JWT_SECRET=your-super-secret" .env; then
    echo "   ✓ JWT Secret configured"
else
    echo "   ⚠ JWT Secret not configured (please update manually)"
fi
echo ""
echo "🚀 Next Steps:"
echo "   1. Review .env file: nano .env"
echo "   2. Install dependencies: npm install"
echo "   3. Build application: npm run build"
echo "   4. Start server: npm start"
echo "   5. Open browser: http://localhost:3000"
echo ""
echo "📚 For more information, see DATABASE_SETUP.md"
echo ""
