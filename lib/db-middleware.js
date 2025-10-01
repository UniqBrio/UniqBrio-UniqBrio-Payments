// === DATABASE MIDDLEWARE FOR SERVERLESS APIS ===
// This middleware ensures proper database connection management
// following MongoDB Atlas + Mongoose serverless best practices

import { dbConnect, getConnectionHealth } from './db.js';

/**
 * Database Connection Middleware for API Routes
 * 
 * USAGE PATTERN - Wrap your API route handler:
 * ```javascript
 * import { withDatabase } from '@/lib/db-middleware';
 * 
 * async function handler(req, res) {
 *   // Database is already connected here
 *   const users = await User.find();
 *   return res.json(users);
 * }
 * 
 * export default withDatabase(handler);
 * ```
 */
export function withDatabase(handler) {
  return async (req, res) => {
    try {
      // Establish connection once per invocation (singleton pattern)
      await dbConnect();
      
      // Call the actual handler
      return await handler(req, res);
    } catch (error) {
      console.error('❌ Database middleware error:', error.message);
      
      // Graceful degradation for database connectivity issues
      if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
        return res.status(503).json({
          success: false,
          error: 'Database temporarily unavailable',
          fallback: true
        });
      }
      
      // Re-throw other errors to be handled by the route
      throw error;
    }
  };
}

/**
 * Next.js API Route Database Wrapper
 * 
 * USAGE FOR NEXT.JS 13+ APP ROUTER:
 * ```javascript
 * import { withDatabaseNextJS } from '@/lib/db-middleware';
 * import { NextResponse } from 'next/server';
 * 
 * async function GET() {
 *   // Database is connected automatically
 *   const data = await MyModel.find();
 *   return NextResponse.json({ data });
 * }
 * 
 * export { GET: withDatabaseNextJS(GET) };
 * ```
 */
export function withDatabaseNextJS(handler) {
  return async (...args) => {
    try {
      // Ensure connection is established before handler execution
      await dbConnect();
      
      // Execute the original handler
      return await handler(...args);
    } catch (error) {
      console.error('❌ Database connection failed in API route:', error.message);
      
      // Return appropriate error responses
      const { NextResponse } = await import('next/server');
      
      if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
        return NextResponse.json({
          success: false,
          error: 'Database temporarily unavailable',
          fallback: true,
          health: getConnectionHealth()
        }, { status: 503 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Internal database error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }
  };
}

/**
 * Pre-connection Helper for Module-Level Database Setup
 * 
 * USAGE PATTERN FOR MODELS AND UTILITIES:
 * ```javascript
 * import { ensureConnection } from '@/lib/db-middleware';
 * 
 * // At module level - ensures connection is ready
 * await ensureConnection();
 * 
 * // Now safe to use models
 * export async function getUsers() {
 *   return await User.find();
 * }
 * ```
 */
export async function ensureConnection() {
  try {
    await dbConnect();
    console.log('✅ Database connection ensured at module level');
  } catch (error) {
    console.warn('⚠️ Module-level database connection failed:', error.message);
    // Don't throw - let individual operations handle connection failures
  }
}

/**
 * Connection Pool Health Monitor
 * Useful for debugging serverless connection issues
 */
export function logConnectionHealth() {
  const health = getConnectionHealth();
  console.log('🔍 Database Connection Health:', {
    status: health.status,
    readyState: `${health.readyState} (${health.readyStateNames[health.readyState]})`,
    host: health.host,
    poolInfo: {
      maxPoolSize: health.maxPoolSize,
      currentPoolSize: health.poolSize,
      serverSelectionTimeout: health.serverSelectionTimeoutMS
    }
  });
  return health;
}

/**
 * Serverless Function Wrapper with Connection Monitoring
 * Includes automatic connection health logging
 */
export function withDatabaseMonitoring(handler) {
  return async (...args) => {
    const startTime = Date.now();
    
    try {
      // Log pre-connection state
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 API Route starting - checking database connection...');
        logConnectionHealth();
      }
      
      // Establish connection
      await dbConnect();
      
      // Execute handler
      const result = await handler(...args);
      
      // Log success metrics
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime;
        console.log(`✅ API Route completed in ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ API Route failed after ${duration}ms:`, error.message);
      
      // Log final connection state for debugging
      if (process.env.NODE_ENV === 'development') {
        logConnectionHealth();
      }
      
      throw error;
    }
  };
}