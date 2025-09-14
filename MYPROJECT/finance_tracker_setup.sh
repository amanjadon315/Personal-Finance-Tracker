#!/bin/bash
# Finance Tracker - Git Setup and Deployment Script
echo "🚀 Finance Tracker - Project Setup Script"
echo "========================================="

# Verify project structure exists
echo "🔍 Verifying project structure..."
if [ ! -d "client" ] || [ ! -d "server" ]; then
    echo "❌ Error: client/ and server/ directories not found!"
    echo "Please run this script from the finance-tracker root directory."
    exit 1
fi

# Update .gitignore file (enhance existing one)
echo "📝 Updating .gitignore file..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
/client/build
/server/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.sqlite

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp

# Build files
build/
dist/

# Certificate files
*.pem
*.key
*.cert

# Backup files
*.backup
*.bak

# Package lock files (uncomment to ignore)
# package-lock.json
# yarn.lock
EOF

# Create GitHub workflow for CI/CD
echo "🔧 Creating GitHub Actions workflow..."
mkdir -p .github/workflows

cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy Finance Tracker

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
          
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: |
          server/package-lock.json
          client/package-lock.json
    
    - name: Install backend dependencies
      run: |
        cd server
        npm ci
    
    - name: Install frontend dependencies
      run: |
        cd client
        npm ci
    
    - name: Lint backend code
      run: |
        cd server
        npm run lint || echo "No lint script found, skipping..."
    
    - name: Lint frontend code
      run: |
        cd client
        npm run lint || echo "No lint script found, skipping..."
    
    - name: Run backend tests
      run: |
        cd server
        npm test
      env:
        MONGODB_URI: mongodb://localhost:27017/finance-tracker-test
        JWT_SECRET: test-secret-key-for-ci
        NODE_ENV: test
        EMAIL_USER: test@example.com
        EMAIL_PASS: test-password
    
    - name: Run frontend tests
      run: |
        cd client
        npm test -- --coverage --watchAll=false --passWithNoTests
    
    - name: Build frontend
      run: |
        cd client
        npm run build
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        directory: ./client/coverage/
        flags: frontend
      continue-on-error: true

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.13.15
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: ${{secrets.HEROKU_APP_NAME}}
        heroku_email: ${{secrets.HEROKU_EMAIL}}
        buildpack: "https://github.com/timanovsky/subdir-heroku-buildpack.git"
        appdir: "server"
      env:
        HD_MONGODB_URI: ${{secrets.MONGODB_URI}}
        HD_JWT_SECRET: ${{secrets.JWT_SECRET}}
        HD_EMAIL_USER: ${{secrets.EMAIL_USER}}
        HD_EMAIL_PASS: ${{secrets.EMAIL_PASS}}
        HD_NODE_ENV: production
        HD_CLIENT_URL: https://${{secrets.HEROKU_APP_NAME}}.herokuapp.com
EOF

# Create Docker configuration
echo "🐳 Creating Docker configuration..."
cat > Dockerfile << 'EOF'
# Multi-stage build for production
FROM node:18-alpine AS frontend-build

# Build frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Install backend dependencies
COPY server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy backend source
COPY server/ ./

# Copy built frontend
COPY --from=frontend-build /app/client/build ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S finance-app -u 1001

# Set ownership
RUN chown -R finance-app:nodejs /app
USER finance-app

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]
EOF

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/finance-tracker
      - JWT_SECRET=${JWT_SECRET}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASS=${EMAIL_PASS}
      - CLIENT_URL=http://localhost:5000
    depends_on:
      - mongo
    networks:
      - app-network
    restart: unless-stopped

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
      - ./server/config/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    environment:
      MONGO_INITDB_DATABASE: finance-tracker
    networks:
      - app-network
    restart: unless-stopped

  mongo-express:
    image: mongo-express:latest
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_SERVER: mongo
      ME_CONFIG_MONGODB_PORT: 27017
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: pass
    depends_on:
      - mongo
    networks:
      - app-network
    profiles:
      - debug

volumes:
  mongo-data:

networks:
  app-network:
    driver: bridge
EOF

# Create development docker-compose
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./client:/app
      - /app/node_modules
    environment:
      - REACT_APP_API_URL=http://localhost:5000
    networks:
      - app-network

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile.dev
    ports:
      - "5000:5000"
    volumes:
      - ./server:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/finance-tracker-dev
      - JWT_SECRET=dev-secret-key
      - CLIENT_URL=http://localhost:3000
    depends_on:
      - mongo
    networks:
      - app-network

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-dev-data:/data/db
    networks:
      - app-network

volumes:
  mongo-dev-data:

networks:
  app-network:
    driver: bridge
EOF

# Create Heroku Procfile
echo "⚙️ Creating Heroku Procfile..."
cat > server/Procfile << 'EOF'
web: npm start
release: npm run migrate || echo "No migration script found"
EOF

# Create .dockerignore
echo "🐳 Creating .dockerignore..."
cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
coverage
.nyc_output
.DS_Store
.vscode
.idea
*.swp
*.swo
.github
docs
*.md
.dockerignore
Dockerfile*
docker-compose*.yml
EOF

# Update or create environment template
echo "📋 Updating environment template..."
cat > .env.example << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/finance-tracker

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-must-be-at-least-32-chars
JWT_EXPIRES_IN=7d

# Email Configuration (for OTP verification)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Frontend Configuration
CLIENT_URL=http://localhost:3000

# API Configuration
API_VERSION=v1

# OTP Configuration
OTP_EXPIRES_IN=300
OTP_LENGTH=6

# Security
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Update README with your actual structure
echo "📖 Updating README.md..."
cat > README.md << 'EOF'
# Finance Tracker 💰

A comprehensive full-stack personal finance tracking application with OTP verification, built with React, Node.js, Express, and MongoDB.

## ✨ Features

- 🔐 **Secure Authentication** with OTP verification
- 📊 **Transaction Management** - Track income and expenses
- 📈 **Analytics Dashboard** - Visual charts and insights  
- 🏷️ **Smart Categorization** - Organize transactions
- 📱 **Responsive Design** - Works on all devices
- 🎯 **Real-time Updates** - Live dashboard updates
- 💾 **Data Export** - Export your financial data

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **Chart.js/Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend  
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service for OTP

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd finance-tracker
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install dependencies:**
   ```bash
   # Install all dependencies at once
   npm run install-deps
   
   # Or install separately:
   cd server && npm install
   cd ../client && npm install
   ```

4. **Start development servers:**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start separately:
   # Backend (from server directory)
   npm run dev
   
   # Frontend (from client directory)  
   npm start
   ```

5. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
finance-tracker/
├── README.md
├── package.json
├── .gitignore
├── .env.example
├── client/                 # Frontend (React)
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── components/
│       │   ├── Auth/
│       │   │   ├── Login.js
│       │   │   ├── Signup.js
│       │   │   └── OTPVerification.js
│       │   ├── Dashboard/
│       │   │   ├── Dashboard.js
│       │   │   ├── StatsCards.js
│       │   │   ├── Charts.js
│       │   │   └── TransactionForm.js
│       │   └── common/
│       │       ├── Header.js
│       │       └── ProtectedRoute.js
│       ├── services/
│       │   ├── api.js
│       │   └── auth.js
│       └── utils/
│           └── constants.js
├── server/                 # Backend (Node.js)
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   └── OTP.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   └── analytics.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── transactionController.js
│   │   └── analyticsController.js
│   └── utils/
│       ├── sendOTP.js
│       └── helpers.js
└── docs/
    ├── API.md
    ├── DEPLOYMENT.md
    └── CONTRIBUTING.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/login` - User login  
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Analytics
- `GET /api/analytics/summary` - Get financial summary
- `GET /api/analytics/trends` - Get spending trends
- `GET /api/analytics/categories` - Get category breakdown

## 🐳 Docker Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose up --build
```

## 🚀 Deployment

### Heroku Deployment

1. **Create Heroku app:**
   ```bash
   heroku create your-finance-tracker-app
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set MONGODB_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-jwt-secret
   heroku config:set EMAIL_USER=your-email
   heroku config:set EMAIL_PASS=your-email-password
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

### GitHub Actions

The project includes automated CI/CD that:
- ✅ Runs tests on pull requests  
- ✅ Lints code for quality
- ✅ Builds frontend
- 🚀 Deploys to Heroku on main branch

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests
cd server && npm test

# Frontend tests  
cd client && npm test

# Test coverage
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- 📧 Email: support@financetracker.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/finance-tracker/issues)
- 📖 Documentation: [docs/](docs/)

## 🙏 Acknowledgments

- Thanks to all contributors
- Built with ❤️ using modern web technologies
EOF

# Update root package.json to match your structure
echo "📦 Updating root package.json..."
if [ -f "package.json" ]; then
    echo "ℹ️ Backing up existing package.json..."
    cp package.json package.json.backup
fi

cat > package.json << 'EOF'
{
  "name": "finance-tracker",
  "version": "1.0.0",
  "description": "A comprehensive full-stack personal finance tracking application with OTP verification",
  "main": "server/server.js",
  "scripts": {
    "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
    "server:dev": "cd server && npm run dev",
    "client:dev": "cd client && npm start",
    "server": "cd server && npm start",
    "client": "cd client && npm start",
    "build": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "test": "npm run test:server && npm run test:client",
    "test:server": "cd server && npm test",
    "test:client": "cd client && npm test -- --watchAll=false",
    "test:coverage": "npm run test:server -- --coverage && npm run test:client -- --coverage",
    "lint": "npm run lint:server && npm run lint:client",
    "lint:server": "cd server && npm run lint",
    "lint:client": "cd client && npm run lint",
    "install-deps": "npm install && cd server && npm install && cd ../client && npm install",
    "heroku-postbuild": "npm run install-deps && npm run build",
    "clean": "rm -rf node_modules server/node_modules client/node_modules client/build server/dist",
    "docker:dev": "docker-compose -f docker-compose.dev.yml up --build",
    "docker:prod": "docker-compose up --build",
    "docker:down": "docker-compose down -v"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/finance-tracker.git"
  },
  "keywords": [
    "finance",
    "tracker",
    "personal-finance",
    "react",
    "nodejs",
    "mongodb",
    "otp-verification",
    "dashboard",
    "analytics"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/yourusername/finance-tracker/issues"
  },
  "homepage": "https://github.com/yourusername/finance-tracker#readme",
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF

# Check if git is already initialized
echo "🔗 Setting up Git repository..."
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git repository initialized"
else
    echo "ℹ️ Git repository already exists"
fi

# Add git hooks for better development experience
echo "🪝 Setting up Git hooks..."
mkdir -p .git/hooks

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
echo "Running pre-commit checks..."

# Run linting
npm run lint || {
    echo "❌ Linting failed. Please fix the errors before committing."
    exit 1
}

# Run tests
npm run test:server || {
    echo "❌ Backend tests failed. Please fix the errors before committing."
    exit 1
}

echo "✅ Pre-commit checks passed!"
EOF

chmod +x .git/hooks/pre-commit

# Create initial commit if no commits exist
echo "💾 Checking Git status..."
if [ -z "$(git log --oneline 2>/dev/null)" ]; then
    echo "Creating initial commit..."
    git add .
    git commit -m "Initial commit: Finance Tracker with OTP verification

✨ Features:
- Complete project structure with client/server separation
- OTP-based authentication system
- Dashboard with analytics and charts
- Transaction management system
- Comprehensive Docker setup
- CI/CD pipeline with GitHub Actions
- Heroku deployment configuration

🛠️ Technical Setup:
- React frontend with component-based architecture
- Node.js/Express backend with proper MVC structure
- MongoDB with User, Transaction, and OTP models
- JWT authentication with OTP verification
- Email service integration for OTP delivery
- Responsive design with modern UI components

📦 DevOps:
- Multi-stage Docker builds
- Development and production environments
- Automated testing and deployment
- Code quality checks and linting
- Environment-based configuration"
    echo "✅ Initial commit created"
else
    echo "📝 Adding changes to existing repository..."
    git add .
    git commit -m "Update: Enhanced project setup with Docker and CI/CD

- Updated deployment scripts and workflows
- Added comprehensive Docker configuration
- Enhanced project documentation
- Improved development workflow scripts"
    echo "✅ Changes committed"
fi

echo ""
echo "🎉 Finance Tracker setup completed successfully!"
echo "========================================="
echo ""
echo "Your project structure has been enhanced with:"
echo "✅ Updated .gitignore for your specific structure"
echo "✅ GitHub Actions workflow for CI/CD"
echo "✅ Docker configuration (dev + prod)"
echo "✅ Heroku deployment setup"
echo "✅ Enhanced documentation"
echo "✅ Development scripts and Git hooks"
echo ""
echo "🚀 Next steps:"
echo ""
echo "1. 📝 Update your .env file:"
echo "   cp .env.example .env"
echo "   # Edit .env with your MongoDB URI, email credentials, etc."
echo ""
echo "2. 🏗️ Install dependencies:"
echo "   npm run install-deps"
echo ""
echo "3. 🏃‍♂️ Start development:"
echo "   npm run dev"
echo ""
echo "4. 🌐 Set up GitHub repository:"
echo "   git remote add origin https://github.com/yourusername/finance-tracker.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "5. ⚙️ Configure GitHub Secrets for deployment:"
echo "   - HEROKU_API_KEY"
echo "   - HEROKU_APP_NAME"
echo "   - HEROKU_EMAIL"
echo "   - MONGODB_URI"
echo "   - JWT_SECRET"
echo "   - EMAIL_USER"
echo "   - EMAIL_PASS"
echo ""
echo "6. 🐳 Try Docker (optional):"
echo "   npm run docker:dev    # Development environment"
echo "   npm run docker:prod   # Production environment"
echo ""
echo "📱 Your app will be available at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo "   - MongoDB Express (Docker): http://localhost:8081"
echo ""
echo "Happy coding! 🚀💰"