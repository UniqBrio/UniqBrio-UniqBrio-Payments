import mongoose from "mongoose";

// === SERVERLESS MONGODB ATLAS CONNECTION SINGLETON ===
// This follows MongoDB Atlas + Mongoose best practices for serverless environments:
// 1. Single connection instance cached globally across Lambda/Vercel invocations
// 2. Connection reuse prevents connection pool exhaustion
// 3. Automatic reconnection with optimized timeouts for serverless cold starts
// 4. No reconnection inside loops, middleware, or per-request

// Global cached connection for serverless/edge environments
// Uses global namespace to persist across hot reloads and re-invocations
let cached = global.__MONGOOSE_CONN__ || { conn: null, promise: null };
global.__MONGOOSE_CONN__ = cached;

// Connection status tracking for debugging and health checks
let connectionStatus = 'disconnected'; // disconnected, connecting, connected, error

/**
 * Database Connection Singleton - Core Entry Point
 * 
 * SERVERLESS PATTERN: 
 * - Call once at application startup (module level)
 * - Reuses cached connection across all API calls
 * - Never call inside loops, middleware, or per-request
 * 
 * @returns {Promise<mongoose.Connection>} Cached or new connection
 */
export async function connectDB() {
  // Return existing connection if available and healthy
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  // During build time, allow graceful failure for database connections
  const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

  if (!cached.promise || mongoose.connection.readyState === 0) {
    connectionStatus = 'connecting';
    
    // === OPTIMIZED ATLAS CONNECTION POOL FOR SERVERLESS ===
    // These settings prevent connection pool exhaustion in serverless environments
    const connectionOptions = {
      dbName: "uniqbrio",
      
      // Connection pooling optimized for serverless/Lambda constraints
      maxPoolSize: 10,          // Maximum connections (Atlas M0: 500 limit)
      minPoolSize: 2,           // Keep minimum connections warm
      maxIdleTimeMS: 30000,     // Close idle connections after 30s
      
      // Timeouts optimized for serverless cold starts
      serverSelectionTimeoutMS: 5000,   // Fast server selection (cold start optimization)
      connectTimeoutMS: 10000,          // Connection establishment timeout
      socketTimeoutMS: 0,               // Infinite socket timeout (avoid premature drops)
      heartbeatFrequencyMS: 10000,      // Server health check frequency
      
      // Serverless reliability settings
      retryWrites: true,                // Auto-retry failed writes
      bufferCommands: false,            // Disable mongoose buffering (critical for serverless)
      
      // Atlas SSL/TLS configuration
      ssl: true,                        // Required for Atlas
      tlsAllowInvalidCertificates: true, // Handle SSL edge cases
      family: 4,                        // Force IPv4 for consistency
    };

    cached.promise = mongoose
      .connect(uri, connectionOptions)
      .then((mongooseInstance) => {
        connectionStatus = 'connected';
        console.log(`✅ MongoDB connected to ${mongooseInstance.connection.host} (Pool: ${connectionOptions.maxPoolSize} connections)`);
        // ---------------- Self-healing audit for payments collection indexes ----------------
        (async () => {
          if (global.__PAYMENT_INDEX_AUDITED__) return; // run once per process
          global.__PAYMENT_INDEX_AUDITED__ = true;
          try {
            const paymentsColl = mongooseInstance.connection.collection('payments');
            const indexes = await paymentsColl.indexes();
            const hasRootTxnIndex = indexes.find(i => i.name === 'transactionId_1');
            const hasEmbeddedTxnIndex = indexes.find(i => i.name === 'paymentRecords.transactionId_1' || i.name === 'paymentRecords.transactionId_1'.replace(/\./g,'_'));
            if (hasRootTxnIndex) {
              // Heuristic: If schema does NOT define root-level transactionId path, it's safe to drop
              const PaymentModel = mongooseInstance.models.Payment || null;
              const rootDefined = PaymentModel && PaymentModel.schema && PaymentModel.schema.paths['transactionId'];
              if (!rootDefined) {
                console.log('🛠 Detected unintended root index transactionId_1. Dropping...');
                try {
                  await paymentsColl.dropIndex('transactionId_1');
                  console.log('✅ Dropped root-level transactionId_1 index');
                } catch (dropErr) {
                  console.warn('⚠️ Failed to drop root transactionId_1 index:', dropErr.message);
                }
              } else {
                console.log('ℹ️ Root transactionId path exists in schema; not dropping index.');
              }
            }
            if (!hasEmbeddedTxnIndex) {
              try {
                await paymentsColl.createIndex({ 'paymentRecords.transactionId': 1 }, { name: 'paymentRecords.transactionId_1', unique: false });
                console.log('✅ Ensured non-unique index paymentRecords.transactionId_1');
              } catch (createErr) {
                console.warn('⚠️ Could not create embedded transactionId index:', createErr.message);
              }
            }
            // Cleanup stray root transactionId:null fields that could trigger duplicate key if index recreated externally
            try {
              const result = await paymentsColl.updateMany({ transactionId: { $in: [null, ''] } }, { $unset: { transactionId: "" } });
              if (result.modifiedCount) {
                console.log(`🧹 Removed stray root transactionId field from ${result.modifiedCount} documents`);
              }
            } catch (unsetErr) {
              console.warn('⚠️ Could not unset stray root transactionId fields:', unsetErr.message);
            }
            console.log('🔍 Payments index audit complete');
          } catch (auditErr) {
            console.warn('⚠️ Payments index audit skipped:', auditErr.message);
          }
        })();
        // ------------------------------------------------------------------------------------
        
        // Enhanced connection event handlers
        mongooseInstance.connection.on('error', (err) => {
          connectionStatus = 'error';
          if (err.message.includes('ssl3_read_bytes') || err.message.includes('tlsv1 alert')) {
            console.log('⚠️ SSL/TLS error - connection pool will handle recovery');
          } else {
            console.error("❌ MongoDB error:", err.message);
          }
        });

        mongooseInstance.connection.on('disconnected', () => {
          connectionStatus = 'disconnected';
          console.log('⚠️ MongoDB disconnected - will reconnect automatically');
        });

        mongooseInstance.connection.on('reconnected', () => {
          connectionStatus = 'connected';
          console.log('✅ MongoDB reconnected');
        });

        mongooseInstance.connection.on('close', () => {
          connectionStatus = 'disconnected';
          console.log('🔒 MongoDB connection closed');
        });

        return mongooseInstance;
      })
      .catch((err) => {
        connectionStatus = 'error';
        cached.promise = null; // Reset promise to allow retry
        
        console.error("❌ MongoDB connection failed:", {
          name: err.name,
          code: err.code,
          message: err.message,
          reason: err.reason?.message,
        });
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    connectionStatus = 'connected';
  } catch (e) {
    connectionStatus = 'error';
    cached.promise = null; // Allow retry on next invocation
    
    // During build time, log error but don't fail completely
    if (isBuildTime && (e.message.includes('ssl3_read_bytes') || e.message.includes('tlsv1 alert'))) {
      console.log('⚠️ Build-time database connection failed (SSL), continuing with static generation...');
      return null;
    }
    
    throw e;
  }
  
  return cached.conn;
}

// Utility function to get connection status
export function getConnectionStatus() {
  return {
    status: connectionStatus,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    // Connection pool stats (if available)
    poolSize: mongoose.connection?.db?.serverConfig?.poolSize || 'N/A'
  };
}

// Graceful shutdown helper for clean shutdowns
export async function closeDB() {
  if (cached.conn) {
    await mongoose.connection.close();
    cached.conn = null;
    cached.promise = null;
    connectionStatus = 'disconnected';
    console.log('✅ MongoDB connection closed gracefully');
  }
}

// === SERVERLESS BEST PRACTICES ALIASES ===

/**
 * Recommended alias: dbConnect() for serverless environments
 * 
 * USAGE PATTERN:
 * ```javascript
 * import { dbConnect } from '@/lib/db'
 * 
 * // At module level (NOT inside functions)
 * await dbConnect()
 * 
 * // Then use your models normally
 * const users = await User.find()
 * ```
 * 
 * This ensures single connection establishment per serverless invocation
 */
export const dbConnect = connectDB;

/**
 * Connection Health Check - Useful for debugging serverless issues
 * @returns {Object} Comprehensive connection status
 */
export function getConnectionHealth() {
  return {
    status: connectionStatus,
    readyState: mongoose.connection.readyState,
    readyStateNames: {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting',
    },
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    // Enhanced pool information for Atlas debugging
    poolSize: mongoose.connection?.db?.serverConfig?.poolSize || 'N/A',
    serverSelectionTimeoutMS: mongoose.connection?.options?.serverSelectionTimeoutMS || 'N/A',
    maxPoolSize: mongoose.connection?.options?.maxPoolSize || 'N/A',
    bufferMaxEntries: mongoose.connection?.options?.bufferMaxEntries || 'N/A'
  };
}

// Default export for convenience
export default connectDB;
