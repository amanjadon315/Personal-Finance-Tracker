# Finance Tracker Deployment Guide

This guide covers various deployment options for the Finance Tracker application.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Heroku Deployment](#heroku-deployment)
- [Docker Deployment](#docker-deployment)
- [AWS Deployment](#aws-deployment)
- [DigitalOcean Deployment](#digitalocean-deployment)
- [Production Checklist](#production-checklist)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **MongoDB**: Version 5.0 or higher (local) OR MongoDB Atlas (cloud)
- **Git**: Latest version

### Required Accounts
- **MongoDB Atlas**: For database hosting (recommended for production)
- **Email Service**: Gmail, SendGrid, or similar for OTP delivery
- **Heroku/AWS/DigitalOcean**: For application hosting

---

## Environment Configuration

### Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance-tracker?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Frontend Configuration
CLIENT_URL=https://your-frontend-domain.com

# Security & Performance
BCRYPT_ROUNDS=12
OTP_EXPIRES_IN=300
OTP_LENGTH=6

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** for JWT_SECRET (minimum 32 characters)
3. **Enable App Passwords** for Gmail (don't use your actual password)
4. **Use environment-specific configurations** for different stages

---

## Local Development

### Quick Start
```bash
# Clone the repository
git clone https://github.com/yourusername/finance-tracker.git
cd finance-tracker

# Install dependencies
npm run install-deps

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev
```

### Development URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017/finance-tracker (if running locally)

### Development Scripts
```bash
npm run dev          # Start both frontend and backend
npm run server:dev   # Start only backend
npm run client:dev   # Start only frontend
npm test            # Run all tests
npm run lint        # Run linting
```

---

## Heroku Deployment

### Step 1: Prepare Your App

1. **Create Heroku app**:
```bash
heroku create your-finance-tracker-app
```

2. **Set environment variables**:
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-atlas-uri"
heroku config:set JWT_SECRET="your-jwt-secret-key"
heroku config:set EMAIL_USER="your-email@gmail.com"
heroku config:set EMAIL_PASS="your-gmail-app-password"
heroku config:set CLIENT_URL="https://your-finance-tracker-app.herokuapp.com"
```

### Step 2: Configure Build Settings

Heroku will automatically detect the Node.js buildpack. Ensure your `package.json` has:

```json
{
  "scripts": {
    "heroku-postbuild": "npm run install-deps && npm run build",
    "start": "cd server && npm start"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
```

### Step 3: Deploy

```bash
# Deploy to Heroku
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# View logs
heroku logs --tail

# Open your app
heroku open
```

### Step 4: Configure GitHub Actions (Optional)

Set up automatic deployments from GitHub:

1. Go to your Heroku app dashboard
2. Navigate to "Deploy" tab
3. Connect to GitHub and enable automatic deploys
4. Set up the required secrets in GitHub repository settings

---

## Docker Deployment

### Development with Docker

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production with Docker

```bash
# Build and start production containers
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Hub Deployment

1. **Build and tag image**:
```bash
docker build -t yourusername/finance-tracker:latest .
docker push yourusername/finance-tracker:latest
```

2. **Deploy on server**:
```bash
docker pull yourusername/finance-tracker:latest
docker run -d -p 80:5000 --env-file .env yourusername/finance-tracker:latest
```

---

## AWS Deployment

### Using AWS Elastic Beanstalk

1. **Install EB CLI**:
```bash
pip install awsebcli
```

2. **Initialize and deploy**:
```bash
eb init finance-tracker
eb create finance-tracker-prod
eb deploy
```

3. **Set environment variables**:
```bash
eb setenv NODE_ENV=production MONGODB_URI="your-uri" JWT_SECRET="your-secret"
```

### Using AWS ECS (Fargate)

1. **Create task definition**:
```json
{
  "family": "finance-tracker",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "finance-tracker",
      "image": "yourusername/finance-tracker:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

2. **Deploy with AWS CLI**:
```bash
aws ecs create-cluster --cluster-name finance-tracker
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs create-service --cluster finance-tracker --service-name finance-tracker-service
```

---

## DigitalOcean Deployment

### Using DigitalOcean App Platform

1. **Create `app.yaml`**:
```yaml
name: finance-tracker
services:
- name: api
  source_dir: /
  github:
    repo: yourusername/finance-tracker
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: "production"
  - key: MONGODB_URI
    value: "your-mongodb-uri"
  - key: JWT_SECRET
    value: "your-jwt-secret"
```

2. **Deploy**:
```bash
doctl apps create --spec app.yaml
```

### Using DigitalOcean Droplets

1. **Create and configure droplet**:
```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Install Node.js and MongoDB
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
apt-get install -y nodejs

# Clone and set up your app
git clone https://github.com/yourusername/finance-tracker.git
cd finance-tracker
npm run install-deps
```

2. **Set up PM2 for process management**:
```bash
npm install -g pm2
pm2 start server/server.js --name "finance-tracker"
pm2 startup
pm2 save
```

3. **Configure Nginx reverse proxy**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Production Checklist

### Security
- [ ] Environment variables are properly configured
- [ ] JWT secret is strong and unique
- [ ] Database credentials are secure
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented

### Performance
- [ ] Database indexes are created
- [ ] Compression middleware is enabled
- [ ] Static assets are optimized
- [ ] Caching headers are set
- [ ] Connection pooling is configured

### Monitoring
- [ ] Health check endpoint is working
- [ ] Logging is properly configured
- [ ] Error tracking is set up
- [ ] Performance monitoring is enabled
- [ ] Uptime monitoring is configured

### Backup & Recovery
- [ ] Database backups are scheduled
- [ ] Backup restoration process is tested
- [ ] Environment configuration is documented
- [ ] Disaster recovery plan is in place

### Deployment
- [ ] CI/CD pipeline is set up
- [ ] Automated testing is configured
- [ ] Rolling deployment strategy is implemented
- [ ] Rollback procedure is documented

---

## Monitoring & Logging

### Application Monitoring

**Using PM2 (Node.js)**:
```bash
pm2 monit                    # Real-time monitoring
pm2 logs                     # View logs
pm2 restart finance-tracker  # Restart application
```

**Health Check Endpoint**:
```javascript
// Add to your server
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
```

### Error Tracking

**Using Sentry**:
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

### Log Management

**Using Winston**:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**:
```bash
# Check connection string
# Verify IP whitelist in MongoDB Atlas
# Check firewall settings
# Verify credentials
```

**Port Already in Use**:
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

**Environment Variables Not Loading**:
```bash
# Check .env file exists and is not in .gitignore
# Verify variable names match exactly
# Check for extra spaces or quotes
```

**Build Failures**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=finance-tracker:* npm start
```

### Performance Issues

**Database Performance**:
```javascript
// Add database indexes
db.transactions.createIndex({ userId: 1, date: -1 });
db.transactions.createIndex({ userId: 1, type: 1 });
```

**Memory Issues**:
```bash
# Monitor memory usage
node --max-old-space-size=1024 server/server.js
```

### Log Analysis

**Common log patterns**:
```bash
# View error logs
grep "ERROR" logs/combined.log

# Monitor API responses
grep "POST\|GET\|PUT\|DELETE" logs/combined.log

# Check authentication failures
grep "401\|403" logs/combined.log
```

---

## Scaling Considerations

### Horizontal Scaling
- Load balancing with multiple instances
- Database read replicas
- CDN for static assets
- Microservices architecture

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching layers
- Use connection pooling

---

For additional support or questions, please refer to our [Contributing Guidelines](./CONTRIBUTING.md) or create an issue in the GitHub repository.