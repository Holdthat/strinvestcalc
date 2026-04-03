#!/bin/bash

# STRcalc Setup Script
# Complete automated setup for GitHub + Vercel deployment
# Run this script from your desired project directory

set -e  # Exit on error

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║                    STRcalc Automated Setup Script                           ║"
echo "║                      Production Ready Application                           ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18.x or 20.x"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js: $(node --version)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi
echo "✓ npm: $(npm --version)"

if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install Git"
    exit 1
fi
echo "✓ Git: $(git --version)"

echo ""
echo "✓ All prerequisites installed!"
echo ""

# Create project directory
PROJECT_DIR="strcalc-production"

if [ -d "$PROJECT_DIR" ]; then
    echo "⚠️  Directory '$PROJECT_DIR' already exists"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled"
        exit 1
    fi
else
    echo "📁 Creating project directory: $PROJECT_DIR"
    mkdir -p "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

echo ""
echo "🚀 Setting up STRcalc..."
echo ""

# Initialize git
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git config user.email "dev@vacationhomegroup.local"
    git config user.name "STRcalc Dev"
else
    echo "✓ Git repository already initialized"
fi

echo ""
echo "📝 Creating project structure..."
echo ""

# Create directories
mkdir -p public src/components src/utils .github/workflows docs

# Create package.json
cat > package.json << 'PACKAGE'
{
  "name": "strcalc",
  "version": "1.0.0",
  "description": "STRcalc - Investment Decision Tool for Short-Term Rental Properties",
  "private": true,
  "homepage": "https://strcalc.vacationhomegroup.com",
  "engines": {
    "node": "18.x || 20.x"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "html2pdf.js": "^0.10.1"
  },
  "devDependencies": {
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
PACKAGE

echo "✓ Created package.json"

# Create public/index.html
cat > public/index.html << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#0B1120" />
  <meta name="description" content="STRcalc - Investment Decision Tool for Short-Term Rental Properties" />
  
  <title>STRcalc - Investment Analysis Tool</title>
  
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #0B1120;
      color: #F8FAFC;
      line-height: 1.6;
    }
    #root {
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>
HTML

echo "✓ Created public/index.html"

# Create src/index.js
cat > src/index.js << 'JS'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
JS

echo "✓ Created src/index.js"

# Create src/App.jsx
cat > src/App.jsx << 'JSX'
import React, { useState } from 'react';

function App() {
  const theme = {
    bgPrimary: '#0B1120',
    textPrimary: '#F8FAFC',
    accent: '#167A5E',
    gold: '#9A7820',
  };

  return (
    <div style={{
      background: theme.bgPrimary,
      color: theme.textPrimary,
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        STR<span style={{ color: theme.gold }}>calc</span>
      </h1>
      <p style={{ fontSize: '18px', color: theme.gold, marginBottom: '40px' }}>
        by Vacation Home Group
      </p>
      <p style={{ fontSize: '16px', color: theme.textPrimary, marginBottom: '20px' }}>
        ✓ Setup Complete!
      </p>
      <p style={{ fontSize: '14px', color: '#94A3B8' }}>
        Your investment analysis tool is ready.<br />
        The full application code will be added from your package.
      </p>
      <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '40px' }}>
        v1.0.0 • Production Ready
      </p>
    </div>
  );
}

export default App;
JSX

echo "✓ Created src/App.jsx"

# Create .env.example
cat > .env.example << 'ENV'
REACT_APP_ENVIRONMENT=development
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true
ENV

echo "✓ Created .env.example"

# Create .env from .env.example
cp .env.example .env

# Create vercel.json
cat > vercel.json << 'VERCEL'
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "env": {
    "REACT_APP_ENVIRONMENT": "production"
  },
  "routes": [
    {
      "src": "^/static/(.*)$",
      "dest": "/static/$1",
      "headers": {
        "Cache-Control": "max-age=31536000, immutable"
      }
    },
    {
      "src": "^/.*",
      "dest": "/index.html"
    }
  ]
}
VERCEL

echo "✓ Created vercel.json"

# Create .gitignore
cat > .gitignore << 'GITIGNORE'
node_modules/
/.pnp
.pnp.js
/coverage
/build
/dist
.next
out/
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.idea
.vscode
*.suo
.sw?
GITIGNORE

echo "✓ Created .gitignore"

# Create GitHub Actions workflow
cat > .github/workflows/deploy.yml << 'WORKFLOW'
name: Build and Deploy

on:
  push:
    branches:
      - main
      - develop

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
WORKFLOW

echo "✓ Created GitHub Actions workflow"

# Create README.md
cat > README.md << 'README'
# STRcalc - Investment Decision Tool

Professional investment analysis tool for short-term rental property owners.

## Features

- Hold vs. Sell vs. 1031 Exchange analysis
- Interactive sensitivity sliders
- Professional dashboards
- Real-time calculations
- Scenario persistence
- PDF export
- VHG branding

## Quick Start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Build for Production

```bash
npm run build
```

## Deployment

Deploy to Vercel:
1. Push to GitHub
2. Connect GitHub to Vercel
3. Automatic deployment on push to main

## License

© 2026 Vacation Home Group. All rights reserved.
README

echo "✓ Created README.md"

# Create DEPLOYMENT_CHECKLIST.md
cat > DEPLOYMENT_CHECKLIST.md << 'CHECKLIST'
# Deployment Checklist

- [ ] npm install succeeds
- [ ] npm start works locally
- [ ] All dependencies installed
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Vercel connected to GitHub
- [ ] GitHub secrets configured:
  - [ ] VERCEL_TOKEN
  - [ ] VERCEL_ORG_ID
  - [ ] VERCEL_PROJECT_ID
- [ ] First deployment successful
- [ ] Site accessible at Vercel URL
- [ ] Custom domain configured (optional)
CHECKLIST

echo "✓ Created DEPLOYMENT_CHECKLIST.md"

echo ""
echo "📦 Installing dependencies..."
echo ""

npm install

echo ""
echo "✓ Installation complete!"
echo ""

# Initialize git
echo "📝 Initializing Git repository..."
git add .
git commit -m "Initial commit: STRcalc v1.0.0 - Setup complete"

echo ""
echo "✅ Setup Complete!"
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║                    ✓ STRcalc Ready to Go! ✓                                ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📂 Project Location: $(pwd)"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Test Locally:"
echo "   npm start"
echo "   (Open http://localhost:3000)"
echo ""
echo "2. Create GitHub Repository:"
echo "   - Go to https://github.com/new"
echo "   - Create repository 'strcalc'"
echo "   - Copy the commands and run them"
echo ""
echo "3. Push to GitHub:"
echo "   git remote add origin https://github.com/YOUR_ORG/strcalc.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "4. Deploy to Vercel:"
echo "   - Go to https://vercel.com/new"
echo "   - Import your GitHub repository"
echo "   - Click Deploy"
echo ""
echo "5. Configure CI/CD:"
echo "   - GitHub Settings → Secrets and variables → Actions"
echo "   - Add: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID"
echo ""
echo "6. Done!"
echo "   Your app will auto-deploy on every push to main"
echo ""
echo "📖 Documentation:"
echo "   - README.md (in project directory)"
echo "   - DEPLOYMENT_CHECKLIST.md"
echo ""
echo "💬 Questions?"
echo "   Ask me anytime for help!"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

