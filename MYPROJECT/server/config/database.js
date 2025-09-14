const mongoose = require('mongoose');

// Database connection configuration
const connectDatabase = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker';
    
    // Connection options for better performance and reliability
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    
    // Set up connection event listeners
    setupConnectionEventListeners();
    
    // Set up graceful shutdown
    setupGracefulShutdown();
    
    return conn;

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Log additional error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', error);
    }
    
    process.exit(1);
  }
};

// Set up MongoDB connection event listeners
const setupConnectionEventListeners = () => {
  // Connection events
  mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
    
    // In production, you might want to implement retry logic here
    if (process.env.NODE_ENV === 'production') {
      // Log to external monitoring service
      // Example: logToMonitoringService('mongodb_error', err);
    }
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
  });

  mongoose.connection.on('fullsetup', () => {
    console.log('✅ MongoDB replica set connected');
  });

  mongoose.connection.on('all', () => {
    console.log('✅ MongoDB replica set connected to all servers');
  });
};

// Set up graceful shutdown
const setupGracefulShutdown = () => {
  // Graceful shutdown on SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    console.log('\n⚠️ Received SIGINT signal. Gracefully shutting down...');
    await closeDatabase();
    process.exit(0);
  });

  // Graceful shutdown on SIGTERM (termination signal)
  process.on('SIGTERM', async () => {
    console.log('\n⚠️ Received SIGTERM signal. Gracefully shutting down...');
    await closeDatabase();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('❌ Uncaught Exception:', error);
    await closeDatabase();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    await closeDatabase();
    process.exit(1);
  });
};

// Close database connection
const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('💤 MongoDB connection closed through app termination');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
};

// Health check function for the database
const checkDatabaseHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    // Additional health metrics
    const dbStats = {
      status: state === 1 ? 'healthy' : 'unhealthy',
      state: states[state],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      readyState: state,
      collections: Object.keys(mongoose.connection.collections).length
    };

    // If connected, get more detailed stats
    if (state === 1) {
      try {
        const admin = mongoose.connection.db.admin();
        const serverStatus = await admin.serverStatus();
        
        dbStats.version = serverStatus.version;
        dbStats.uptime = serverStatus.uptime;
        dbStats.connections = serverStatus.connections;
      } catch (adminError) {
        // Admin commands might not be available in all environments
        console.log('⚠️ Could not fetch admin stats:', adminError.message);
      }
    }
    
    return dbStats;
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      state: 'error'
    };
  }
};

// Get database statistics
const getDatabaseStats = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    const stats = await mongoose.connection.db.stats();
    
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize
    };
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
};

// Create database indexes for better performance
const createIndexes = async () => {
  try {
    console.log('📈 Creating database indexes...');
    
    // Get all models and create their indexes
    const models = mongoose.models;
    
    for (const modelName in models) {
      const model = models[modelName];
      await model.createIndexes();
      console.log(`✅ Created indexes for ${modelName} model`);
    }
    
    console.log('✅ All database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error.message);
    throw error;
  }
};

// Drop all collections (use with caution - mainly for testing)
const dropDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production environment');
    }
    
    console.log('⚠️ Dropping all collections...');
    await mongoose.connection.db.dropDatabase();
    console.log('✅ Database dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping database:', error.message);
    throw error;
  }
};

// Seed initial data (if needed)
const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database with initial data...');
    
    // Add any initial data seeding logic here
    // Example: Create default categories, admin user, etc.
    
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    throw error;
  }
};

// Export functions
module.exports = {
  connectDatabase,
  closeDatabase,
  checkDatabaseHealth,
  getDatabaseStats,
  createIndexes,
  dropDatabase,
  seedDatabase
};