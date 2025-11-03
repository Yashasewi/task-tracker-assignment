# Task Tracker Web Application

A full-stack task management application built with Node.js backend and Next.js frontend, featuring user authentication, task CRUD operations, and Redis caching.
For detailed task read the [TASK.md](TASK.md) file.

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Redis (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd task-tracker-assignment
   ```

2. **Install dependencies**
   ```bash
   # install individually
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Environment Setup**

   Create `.env` files in both backend and frontend directories:

   **backend/.env.local**
   ```env
    # Server Configuration
    PORT=3001

    # JWT Configuration
    JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
    JWT_EXPIRES_IN=1h

    # MongoDB Connection String
    # For local MongoDB: mongodb://localhost:27017/tasktracker
    # For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/tasktracker
    MONGODB_URI=mongodb://localhost:27017/tasktracker

    # Redis Configuration
    # For local Redis: redis://localhost:6379
    REDIS_URL=redis://localhost:6379

    # Cache Configuration (in seconds)
    CACHE_TTL=3600

    # Node Environment
    NODE_ENV=development
   ```

   **frontend/.env.local**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

4. **Start MongoDB and Redis**
   ```bash
   # MongoDB (if using local)
   mongod

   # Redis (if using local)
   redis-server
   ```

5. **Run the application**
   ```bash
   cd backend 
    npm run dev
   ```

   ```bash 
    cd frontend
    npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:coverage      # Run tests with coverage report
```


## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - verify user token(JWT)
- 

### Tasks
- `GET /api/tasks` - Get user's tasks (cached)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Development Scripts

### Backend
- `npm run dev` - Start with nodemon21
- `npm start` - Start production server
- `npm test` - Run Jest tests
- `npm run test:coverage` - Run tests with coverage

### Frontend
- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome
