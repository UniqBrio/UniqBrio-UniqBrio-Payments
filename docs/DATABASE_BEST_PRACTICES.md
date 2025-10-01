# MongoDB Atlas + Mongoose Serverless Best Practices

This document outlines the recommended patterns for integrating MongoDB Atlas with Mongoose in serverless environments (Vercel, AWS Lambda, Netlify, etc.).

## 🚀 Core Principles

### 1. Single Connection Pattern
- **Establish the database connection ONCE** at application startup — not per request
- **Use a module-level connection utility** (`dbConnect()`) that caches and reuses the active connection
- **Treat the database connection as a singleton service** — one entry point, one lifecycle, multiple consumers

### 2. Connection Caching
- **Always import and invoke `dbConnect()` before performing any Mongoose operations**
- **Leverage global or module-level cache** (e.g., `global.mongoose`) to persist connections across hot reloads
- **Never reconnect inside loops, middleware, or per API call** — this causes runaway connection growth

### 3. Connection Pool Management
- **Configure appropriate pool sizes** for your Atlas tier (M0: 500 connections limit)
- **Set idle timeouts** to prevent stale connections
- **Use optimized timeouts** for serverless cold starts

## 📁 File Structure

```
lib/
├── db.js                 # Core connection singleton
├── db-middleware.js      # Serverless middleware helpers
└── models/
    ├── user.js          # Mongoose models
    └── payment.js
```

## 🔧 Implementation

### Core Connection Utility (`lib/db.js`)

```javascript
import mongoose from "mongoose";

// Global cached connection for serverless environments
let cached = global.__MONGOOSE_CONN__ || { conn: null, promise: null };
global.__MONGOOSE_CONN__ = cached;

export async function connectDB() {
  // Return existing connection if available and healthy
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");

  if (!cached.promise) {
    const connectionOptions = {
      // Optimized for serverless
      maxPoolSize: 10,           // Maximum connections
      minPoolSize: 2,            // Keep connections warm
      maxIdleTimeMS: 30000,      // Close idle after 30s
      serverSelectionTimeoutMS: 5000,  // Fast server selection
      bufferCommands: false,     // Critical for serverless
      retryWrites: true
    };

    cached.promise = mongoose.connect(uri, connectionOptions);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Recommended alias
export const dbConnect = connectDB;
```

### API Route Pattern (Next.js App Router)

```javascript
import { dbConnect } from '@/lib/db';
import User from '@/models/user';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // ✅ Connect once per invocation
    await dbConnect();
    
    // ✅ Use models normally - connection is cached
    const users = await User.find();
    
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // ✅ Connection is reused from cache if already established
    await dbConnect();
    
    const data = await request.json();
    const user = await User.create(data);
    
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Using Middleware for Cleaner Code

```javascript
import { withDatabaseNextJS } from '@/lib/db-middleware';
import User from '@/models/user';

async function GET() {
  // Database is automatically connected by middleware
  const users = await User.find();
  return NextResponse.json({ users });
}

// Wrap with database middleware
export { GET: withDatabaseNextJS(GET) };
```

## ⚠️ Common Anti-Patterns to Avoid

### ❌ DON'T: Connect per request
```javascript
// BAD - Creates new connection every time
export async function GET() {
  await mongoose.connect(process.env.MONGODB_URI); // ❌ 
  const users = await User.find();
  return NextResponse.json({ users });
}
```

### ❌ DON'T: Connect inside loops
```javascript
// BAD - Exhausts connection pool
for (let user of users) {
  await mongoose.connect(process.env.MONGODB_URI); // ❌
  await User.findById(user.id);
}
```

### ❌ DON'T: Connect in middleware without caching
```javascript
// BAD - No connection reuse
app.use(async (req, res, next) => {
  await mongoose.connect(process.env.MONGODB_URI); // ❌ New connection each time
  next();
});
```

## ✅ Best Practices Summary

### 1. Module-Level Connection
```javascript
// ✅ GOOD - Module-level import and connection
import { dbConnect } from '@/lib/db';

// Optionally connect at module level for frequently used utilities
await dbConnect();

export async function getUserById(id) {
  return await User.findById(id);
}
```

### 2. API Route Pattern
```javascript
// ✅ GOOD - Connect once per API invocation
export async function POST(request) {
  await dbConnect(); // Reuses cached connection
  const result = await MyModel.create(data);
  return NextResponse.json(result);
}
```

### 3. Error Handling
```javascript
// ✅ GOOD - Graceful degradation
export async function GET() {
  try {
    await dbConnect();
    const data = await MyModel.find();
    return NextResponse.json({ data });
  } catch (error) {
    if (error.name === 'MongoNetworkError') {
      return NextResponse.json({ 
        data: [], 
        fallback: true, 
        message: 'Database temporarily unavailable' 
      });
    }
    throw error;
  }
}
```

## 🔍 Debugging Connection Issues

### Check Connection Health
```javascript
import { getConnectionHealth } from '@/lib/db';

export async function GET() {
  const health = getConnectionHealth();
  return NextResponse.json({ health });
}
```

### Monitor Connection Pool
```javascript
import { logConnectionHealth } from '@/lib/db-middleware';

export async function GET() {
  logConnectionHealth(); // Logs detailed connection info
  const data = await MyModel.find();
  return NextResponse.json({ data });
}
```

## 🚀 Production Deployment Checklist

- [ ] Environment variable `MONGODB_URI` is set
- [ ] Connection pooling is configured (`maxPoolSize`, `minPoolSize`)
- [ ] `bufferCommands: false` is set for serverless
- [ ] Idle timeouts are configured (`maxIdleTimeMS`)
- [ ] Error handling includes graceful degradation
- [ ] Connection health monitoring is in place
- [ ] No connections are opened inside loops or per-request

## 🔗 Additional Resources

- [MongoDB Atlas Connection Best Practices](https://docs.atlas.mongodb.com/best-practices-connecting-to-atlas/)
- [Mongoose Serverless Documentation](https://mongoosejs.com/docs/lambda.html)
- [Vercel Edge Functions Database Guidelines](https://vercel.com/docs/functions/edge-functions/edge-runtime#compatible-node.js-apis)

---

Following these patterns ensures optimal performance, prevents connection pool exhaustion, and provides reliable database connectivity in serverless environments.