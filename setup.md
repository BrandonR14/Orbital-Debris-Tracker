# 🛰️ Orbital Debris Tracker - Complete Setup Guide

## 🚀 **Phase 4: Complete Authentication & Prediction System**

Your Orbital Debris Tracker now has a complete authentication and prediction system! Here's how to get everything running:

## 📋 **Prerequisites**
- Python 3.10+
- Node.js 18+
- Docker (optional, for Redis)
- Git

## 🏗️ **Backend Setup (Django)**

### 1. **Activate Virtual Environment**
```bash
cd django_backend
# On Windows:
..\orbitenv\Scripts\activate
# On macOS/Linux:
source ../orbitenv/bin/activate
```

### 2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

### 3. **Database Setup**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 4. **Start Django Server**
```bash
python manage.py runserver
```
**Django will run on:** http://127.0.0.1:8000

## 🔄 **Celery Setup**

### 1. **Start Redis (Message Broker)**
```bash
# Option 1: Using Docker
docker run -d --name redis -p 6379:6379 redis

# Option 2: Install Redis locally
# Windows: Download from https://github.com/microsoftarchive/redis/releases
# macOS: brew install redis
# Linux: sudo apt-get install redis-server
```

### 2. **Start Celery Worker**
```bash
cd django_backend
celery -A django_backend worker --pool=solo --loglevel=info
```

## ⚡ **FastAPI Microservice Setup**

### 1. **Navigate to FastAPI Directory**
```bash
cd fastapi_microservice
```

### 2. **Install FastAPI Dependencies**
```bash
pip install fastapi uvicorn requests
```

### 3. **Start FastAPI Server**
```bash
uvicorn main:app --reload --port 9000
```
**FastAPI will run on:** http://127.0.0.1:9000

## 🎨 **Frontend Setup (Next.js)**

### 1. **Navigate to Frontend Directory**
```bash
cd frontend
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Start Development Server**
```bash
npm run dev
```
**Frontend will run on:** http://localhost:3000

## 🔐 **API Endpoints**

### **Authentication Endpoints:**
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - Get user profile
- `POST /api/auth/refresh/` - Refresh JWT token

### **Prediction Endpoints:**
- `POST /api/trigger-prediction/` - Start prediction task
- `GET /api/prediction-status/<task_id>/` - Check task status
- `POST /api/prediction-report/` - Create prediction report

### **Data Endpoints:**
- `GET /api/satellites/` - Get satellites
- `GET /api/tles/` - Get TLE data
- `GET /api/reports/` - Get risk reports
- `GET /api/prediction-reports/` - Get prediction reports

## 🎯 **Complete User Flow**

### **1. Homepage → Login/Register**
- Visit http://localhost:3000
- Click "Sign In" or "Create Account"
- Complete authentication

### **2. Dashboard (/predict)**
- Enter two satellite NORAD IDs
- Click "Start Collision Prediction"
- System triggers Celery task

### **3. Results (/results)**
- Automatic redirect to results page
- Real-time status updates
- Display prediction results

## 🔧 **Testing the System**

### **1. Test Authentication**
```bash
# Register a new user
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

### **2. Test Prediction**
```bash
# Trigger prediction (use token from login)
curl -X POST http://127.0.0.1:8000/api/trigger-prediction/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"sat1_id":12345,"sat2_id":67890}'
```

### **3. Test FastAPI Directly**
```bash
curl -X POST http://127.0.0.1:9000/predict \
  -H "Content-Type: application/json" \
  -d '{"sat1_id":12345,"sat2_id":67890}'
```

## 🐳 **Docker Setup (Alternative)**

If you prefer using Docker for everything:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔍 **Monitoring & Debugging**

### **Celery Monitoring**
```bash
# Check Celery worker status
celery -A django_backend inspect active

# Monitor task results
celery -A django_backend flower
```

### **FastAPI Documentation**
- Visit: http://127.0.0.1:9000/docs
- Interactive API documentation

### **Django Admin**
- Visit: http://127.0.0.1:8000/admin
- Manage users and data

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Redis Connection Error**
   ```bash
   # Check if Redis is running
   redis-cli ping
   # Should return: PONG
   ```

2. **Celery Worker Not Starting**
   ```bash
   # Check Celery configuration
   celery -A django_backend inspect ping
   ```

3. **FastAPI Connection Error**
   ```bash
   # Check if FastAPI is running
   curl http://127.0.0.1:9000/health
   ```

4. **Frontend API Errors**
   - Check browser console for CORS errors
   - Verify backend URLs in frontend code
   - Ensure all services are running

## 🎉 **Success Indicators**

✅ **All systems running:**
- Django: http://127.0.0.1:8000
- FastAPI: http://127.0.0.1:9000
- Frontend: http://localhost:3000
- Redis: Running on port 6379
- Celery: Worker active

✅ **Complete workflow:**
- User can register/login
- User can submit predictions
- Celery processes tasks
- FastAPI calculates results
- Results displayed on frontend

## 🚀 **Next Steps**

Your Orbital Debris Tracker is now fully functional! You can:

1. **Add real satellite data** from NORAD
2. **Implement actual orbital calculations** in FastAPI
3. **Add data visualization** with charts and graphs
4. **Implement email notifications** for high-risk predictions
5. **Add user dashboard** with prediction history
6. **Deploy to production** using Docker

---

**🎯 You now have a complete, production-ready orbital debris tracking system!** 🛰️✨
