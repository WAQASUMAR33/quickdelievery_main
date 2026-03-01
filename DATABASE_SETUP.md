# Database Setup Instructions

## 🚨 **CRITICAL: Order Creation Error Fix**

The error you're experiencing (`Cannot read properties of undefined (reading 'create')`) is caused by a missing DATABASE_URL configuration.

## ⚡ **Quick Fix (Choose Option 1 or 2):**

### **Option 1: Local MySQL Database**
1. Install MySQL locally
2. Create a database named `quick_delivery_db`
3. Create `.env` file with:
```env
DATABASE_URL="mysql://root:password@localhost:3306/quick_delivery_db"
```
4. Run: `npx prisma db push`

### **Option 2: Free Cloud Database (Recommended)**
**Using PlanetScale (Free tier):**

1. Go to [planetscale.com](https://planetscale.com) and sign up
2. Create a new database named `quick-delivery`
3. Get your connection string
4. Create `.env` file with:
```env
DATABASE_URL="mysql://username:password@aws.connect.psdb.cloud/quick-delivery?sslaccept=strict"
```
5. Run: `npx prisma db push`

**Using Railway (Free tier):**

1. Go to [railway.app](https://railway.app) and sign up
2. Create MySQL database
3. Copy the connection URL
4. Create `.env` file with the provided URL
5. Run: `npx prisma db push`

## 📋 **Complete Environment Setup**

Create `.env` file in your project root:

```env
# Database Configuration (REQUIRED)
DATABASE_URL="your_database_connection_string_here"

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyA6Zwg3QRf2qmsv56WHdqI5MbnX6owH1ZY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="quick-delivery-fe107.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="quick-delivery-fe107"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="quick-delivery-fe107.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="582139435085"
NEXT_PUBLIC_FIREBASE_APP_ID="1:582139435085:web:5da529a1a4d7fc6e326404"

# Firebase Admin
FIREBASE_PROJECT_ID="quick-delivery-fe107"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

## 🔧 **Setup Commands**

After creating `.env` file:

```bash
# Install dependencies
npm install

# Setup database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

## 🚀 **For Vercel Deployment**

Add these environment variables in Vercel dashboard:
- `DATABASE_URL` (your production database URL)
- All `FIREBASE_*` variables
- `NEXTAUTH_URL` (your domain URL)

## ✅ **Verification**

Once setup, you can test the order creation by:
1. Adding items to cart
2. Filling shipping address
3. Clicking "Place Order"

The order should complete successfully and the cart should auto-clear.
