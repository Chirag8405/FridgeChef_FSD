# FridgeChef

Transform your leftover ingredients into delicious recipes with the power of AI. FridgeChef is a smart recipe generator that helps you cook amazing meals using whatever you have in your kitchen.

## What is FridgeChef?

Ever found yourself staring into your fridge wondering what to cook with random ingredients? FridgeChef solves that problem. Just tell it what ingredients you have, and it'll suggest creative, practical recipes you can actually make.

The app uses OpenAI's GPT to generate personalized recipes based on your available ingredients, dietary preferences, and cooking skill level. Whether you're a beginner looking for simple meals or an experienced cook wanting to try something new, FridgeChef adapts to your needs.

## Features

**🧠 Smart Recipe Generation**
- Input any combination of ingredients
- Get multiple recipe suggestions instantly
- Recipes adapt to your cooking skill level
- Choose whether to allow additional ingredients or stick to what you have

**👤 Personalized Experience**
- Create an account to save your favorite recipes
- Set dietary restrictions (vegetarian, vegan, gluten-free, etc.)
- Customize spice preferences and cooking time
- Track your recipe history and liked dishes

**📱 Clean, Modern Interface**
- Responsive design that works on all devices
- Dark/light theme support
- Intuitive ingredient input with smart suggestions
- Easy recipe browsing and organization

**⚡ Lightning Fast**
- Serverless architecture for instant scaling
- Local storage backup for offline access
- Progressive web app capabilities
- Optimized for performance

## Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, Vite
- **Backend**: Node.js, Express, Serverless Functions
- **Database**: Neon PostgreSQL with automatic migrations
- **AI**: OpenAI GPT for recipe generation
- **Authentication**: JWT with secure session management
- **Deployment**: Netlify with automatic CI/CD

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A Neon database account (free tier available)
- OpenAI API key

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/Chirag8405/FridgeChef.git
cd FridgeChef
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```
DATABASE_URL=your_neon_connection_string
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_secure_random_string
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

### Building for Production

```bash
npm run build
npm start
```

## Deployment

FridgeChef is designed to deploy seamlessly on Netlify:

1. Connect your GitHub repository to Netlify
2. Set the build command to `npm run build`
3. Set the publish directory to `dist/spa`
4. Add your environment variables in Netlify's dashboard
5. Deploy!

The database schema will automatically initialize on first run.

## Project Structure

```
├── client/           # React frontend application
│   ├── components/   # Reusable UI components
│   ├── contexts/     # React context providers
│   ├── pages/        # Page components
│   └── lib/          # Utility functions
├── server/           # Backend API server
│   ├── routes/       # Express route handlers
│   └── services/     # Business logic services
├── shared/           # Type definitions shared between client/server
├── netlify/          # Serverless function handlers
└── public/           # Static assets
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Sign out

### Recipes
- `POST /api/recipes/generate` - Generate recipes from ingredients
- `GET /api/recipes/history` - Get user's saved recipes
- `POST /api/recipes/like` - Like/unlike a recipe
- `DELETE /api/recipes/:id` - Delete a recipe

### Dashboard
- `GET /api/dashboard` - Get user statistics and trending recipes

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests as needed
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Use TypeScript for type safety
- Follow the existing code style (Prettier is configured)
- Write meaningful commit messages
- Update documentation for new features
- Test your changes locally before submitting

## Common Issues & Solutions

**Recipe generation fails**
- Check your OpenAI API key is valid and has credits
- Ensure the API key is properly set in environment variables

**Database connection errors**
- Verify your Neon connection string is correct
- Check if your IP is whitelisted in Neon dashboard

**Build failures on Netlify**
- Ensure all environment variables are set
- Check the build logs for specific error messages
- Verify Node.js version compatibility

## Roadmap

- [ ] Mobile app development
- [ ] Recipe sharing between users
- [ ] Meal planning calendar
- [ ] Nutritional information integration
- [ ] Smart shopping list generation
- [ ] Integration with grocery delivery services
- [ ] Voice input for hands-free cooking
- [ ] Photo recognition for ingredient detection

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

Having trouble? Check out our [deployment guide](BACKEND_DEPLOYMENT.md) or open an issue on GitHub.

---

Made with ❤️ for home cooks everywhere. Happy cooking!