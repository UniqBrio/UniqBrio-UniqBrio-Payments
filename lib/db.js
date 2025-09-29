import mongoose from "mongoose";

// Global cached connection for serverless/edge environments
let cached = global.__MONGOOSE_CONN__ || { conn: null, promise: null };
global.__MONGOOSE_CONN__ = cached;

// Connection status tracking
let connectionStatus = 'disconnected'; // disconnected, connecting, connected, error

export async function connectDB() {
  // Return existing connection if available
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
    
    // Optimized connection options for Atlas with connection pooling
    const connectionOptions = {
      dbName: "uniqbrio",
      // Connection pooling - these override URI params if provided
      maxPoolSize: 10,          // Maximum number of connections in pool
      minPoolSize: 2,           // Minimum number of connections in pool  
      maxIdleTimeMS: 30000,     // Close connections after 30s of inactivity
      serverSelectionTimeoutMS: 5000,  // How long to try selecting a server
      socketTimeoutMS: 0,       // How long a send or receive can take (0 = infinite)
      connectTimeoutMS: 10000,  // How long to wait for initial connection
      heartbeatFrequencyMS: 10000, // How often to ping the server
      
      // Reliability options
      retryWrites: true,
      bufferCommands: false,    // Disable mongoose buffering for serverless
      
      // SSL/TLS options for Atlas
      ssl: true,
      tlsAllowInvalidCertificates: true,  // Helps with SSL issues on some networks
      family: 4,                // Force IPv4
    };

    cached.promise = mongoose
      .connect(uri, connectionOptions)
      .then((mongooseInstance) => {
        connectionStatus = 'connected';
        console.log(`✅ MongoDB connected to ${mongooseInstance.connection.host} (Pool: ${connectionOptions.maxPoolSize} connections)`);
        
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

// Graceful shutdown helper
export async function closeDB() {
  if (cached.conn) {
    await mongoose.connection.close();
    cached.conn = null;
    cached.promise = null;
    connectionStatus = 'disconnected';
    console.log('✅ MongoDB connection closed gracefully');
  }
}
