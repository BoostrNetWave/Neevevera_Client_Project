# Neevevera Private Limited — Engineering & Construction

Full-stack web application and content management system for Neevevera Private Limited (Civil Infrastructure, PMC & Turnkey EPC).

## Architecture

- **Frontend (`/client`)**: React, Vite, Tailwind CSS, React Router, Material Symbols, Lucide React.
- **Backend (`/server`)**: Node.js, Express, MongoDB Atlas (Mongoose), JWT HttpOnly auth, Cloudinary media pipeline, Vitest.

## Quick Start

### 1. Server Setup
```bash
cd server
cp .env.example .env # configure your environment variables
npm install
npm run dev
```

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```

## Running Tests
```bash
cd server
npm test
```
