#!/usr/bin/env node

/**
 * MongoDB Initialization Script for Finance Tracker
 * 
 * This script initializes the MongoDB database with:
 * - Database creation
 * - Collection creation with schema validation
 * - Index creation for performance optimization
 * - Default configuration data
 * 
 * Usage: node scripts/init-mongo.js [environment]
 * Example: node scripts/init-mongo.js development
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Configuration
const config = {
  development: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: 'finance-tracker-dev'
  },
  test: {
    uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017',
    dbName: 'finance-tracker-test'
  },
  production: {
    uri: process.env.MONGODB_URI,
    dbName: 'finance-tracker'
  }
};

const environment = process.argv[2] || process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

if (!dbConfig) {
  console.error('❌ Invalid environment specified. Use: development, test, or production');
  process.exit(1);
}

console.log(`🚀 Initializing MongoDB for ${environment} environment`);
console.log(`📊 Database: ${dbConfig.dbName}`);

// Collection schemas and validation rules
const collections = {
  users: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'email', 'password', 'isVerified'],
        properties: {
          name: {
            bsonType: 'string',
            minLength: 2,
            maxLength: 50,
            description: 'User full name - required, 2-50 characters'
          },
          email: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
            description: 'Valid email address - required and unique'
          },
          password: {
            bsonType: 'string',
            minLength: 8,
            description: 'Hashed password - required, min 8 characters'
          },
          isVerified: {
            bsonType: 'bool',
            description: 'Email verification status - required'
          },
          preferences: {
            bsonType: 'object',
            properties: {
              currency: { bsonType: 'string' },
              dateFormat: { bsonType: 'string' },
              theme: { bsonType: 'string' },
              language: { bsonType: 'string' },
              emailNotifications: { bsonType: 'bool' },
              pushNotifications: { bsonType: 'bool' }
            },
            description: 'User preferences object'
          },
          lastLogin: {
            bsonType: 'date',
            description: 'Last login timestamp'
          },
          createdAt: {
            bsonType: 'date',
            description: 'Account creation timestamp'
          },
          updatedAt: {
            bsonType: 'date',
            description: 'Last update timestamp'
          }
        }
      }
    },
    indexes: [
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { createdAt: -1 }, name: 'created_at_desc' },
      { key: { lastLogin: -1 }, name: 'last_login_desc' },
      { key: { isVerified: 1 }, name: 'verified_status' }
    ]
  },

  transactions: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'type', 'amount', 'category', 'date'],
        properties: {
          userId: {
            bsonType: 'objectId',
            description: 'Reference to user - required'
          },
          type: {
            bsonType: 'string',
            enum: ['income', 'expense'],
            description: 'Transaction type - required, income or expense'
          },
          amount: {
            bsonType: 'double',
            minimum: 0.01,
            maximum: 999999.99,
            description: 'Transaction amount - required, positive number'
          },
          category: {
            bsonType: 'string',
            minLength: 1,
            maxLength: 50,
            description: 'Transaction category - required, 1-50 characters'
          },
          description: {
            bsonType: 'string',
            maxLength: 200,
            description: 'Transaction description - optional, max 200 characters'
          },
          date: {
            bsonType: 'date',
            description: 'Transaction date - required'
          },
          createdAt: {
            bsonType: 'date',
            description: 'Record creation timestamp'
          },
          updatedAt: {
            bsonType: 'date',
            description: 'Last update timestamp'
          }
        }
      }
    },
    indexes: [
      { key: { userId: 1, date: -1 }, name: 'user_date_desc' },
      { key: { userId: 1, type: 1 }, name: 'user_type' },
      { key: { userId: 1, category: 1 }, name: 'user_category' },
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_desc' },
      { key: { date: -1 }, name: 'date_desc' },
      { key: { amount: -1 }, name: 'amount_desc' },
      { key: { category: 1 }, name: 'category_asc' }
    ]
  },

  otps: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['email', 'otp', 'expiresAt'],
        properties: {
          email: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,} ,
            description: 'Email address - required'
          },
          otp: {
            bsonType: 'string',
            minLength: 6,
            maxLength: 6,
            description: 'OTP code - required, exactly 6 characters'
          },
          expiresAt: {
            bsonType: 'date',
            description: 'OTP expiration timestamp - required'
          },
          createdAt: {
            bsonType: 'date',
            description: 'OTP creation timestamp'
          },
          attempts: {
            bsonType: 'int',
            minimum: 0,
            maximum: 10,
            description: 'Number of verification attempts'
          }
        }
      }
    },
    indexes: [
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: 'auto_expire' },
      { key: { createdAt: -1 }, name: 'created_desc' }
    ]
  },

  // Optional: Activity log collection for user actions
  activitylogs: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'action', 'timestamp'],
        properties: {
          userId: {
            bsonType: 'objectId',
            description: 'Reference to user - required'
          },
          action: {
            bsonType: 'string',
            enum: ['login', 'logout', 'register', 'password_change', 'profile_update', 
                   'transaction_create', 'transaction_update', 'transaction_delete', 'data_export'],
            description: 'User action type - required'
          },
          details: {
            bsonType: 'object',
            description: 'Additional action details'
          },
          ipAddress: {
            bsonType: 'string',
            description: 'User IP address'
          },
          userAgent: {
            bsonType: 'string',
            description: 'User browser/client info'
          },
          timestamp: {
            bsonType: 'date',
            description: 'Action timestamp - required'
          }
        }
      }
    },
    indexes: [
      { key: { userId: 1, timestamp: -1 }, name: 'user_timestamp_desc' },
      { key: { action: 1, timestamp: -1 }, name: 'action_timestamp_desc' },
      { key: { timestamp: -1 }, expireAfterSeconds: 2592000, name: 'auto_expire_30days' }, // 30 days retention
      { key: { ipAddress: 1 }, name: 'ip_address' }
    ]
  }
};

// Default application settings
const defaultSettings = {
  appConfig: {
    version: '1.0.0',
    maintenanceMode: false,
    registrationEnabled: true,
    maxTransactionsPerUser: 10000,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'],
    defaultCurrency: 'USD',
    otpExpirationMinutes: 5,
    maxLoginAttempts: 5,
    sessionExpirationDays: 7,
    features: {
      emailNotifications: true,
      dataExport: true,
      advancedAnalytics: true,
      budgetTracking: false, // Future feature
      multiCurrency: false   // Future feature
    }
  },
  emailTemplates: {
    otpVerification: {
      subject: 'Finance Tracker - Email Verification',
      template: 'Your verification code is: {{otp}}. This code will expire in {{expiration}} minutes.'
    },
    passwordReset: {
      subject: 'Finance Tracker - Password Reset',
      template: 'Click the link to reset your password: {{resetLink}}'
    },
    welcomeEmail: {
      subject: 'Welcome to Finance Tracker!',
      template: 'Welcome {{name}}! Your account has been successfully created.'
    }
  }
};

async function initializeDatabase() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(dbConfig.uri);
    await client.connect();
    
    console.log('✅ Connected to MongoDB successfully');
    
    const db = client.db(dbConfig.dbName);
    
    // Create collections with validation
    console.log('\n📋 Creating collections with schema validation...');
    
    for (const [collectionName, schema] of Object.entries(collections)) {
      try {
        // Check if collection already exists
        const collections = await db.listCollections({ name: collectionName }).toArray();
        
        if (collections.length > 0) {
          console.log(`ℹ️  Collection '${collectionName}' already exists, updating validation rules...`);
          await db.command({
            collMod: collectionName,
            validator: schema.validator
          });
        } else {
          console.log(`✨ Creating collection '${collectionName}'...`);
          await db.createCollection(collectionName, {
            validator: schema.validator
          });
        }
        
        console.log(`✅ Collection '${collectionName}' ready`);
      } catch (error) {
        console.error(`❌ Error with collection '${collectionName}':`, error.message);
      }
    }
    
    // Create indexes
    console.log('\n📈 Creating database indexes...');
    
    for (const [collectionName, schema] of Object.entries(collections)) {
      if (schema.indexes && schema.indexes.length > 0) {
        const collection = db.collection(collectionName);
        
        for (const indexSpec of schema.indexes) {
          try {
            await collection.createIndex(indexSpec.key, {
              name: indexSpec.name,
              unique: indexSpec.unique || false,
              expireAfterSeconds: indexSpec.expireAfterSeconds
            });
            console.log(`✅ Created index '${indexSpec.name}' on '${collectionName}'`);
          } catch (error) {
            if (error.code === 85) { // Index already exists
              console.log(`ℹ️  Index '${indexSpec.name}' already exists on '${collectionName}'`);
            } else {
              console.error(`❌ Error creating index '${indexSpec.name}' on '${collectionName}':`, error.message);
            }
          }
        }
      }
    }
    
    // Insert default settings (only in development/test)
    if (environment !== 'production') {
      console.log('\n⚙️  Inserting default settings...');
      
      const settingsCollection = db.collection('settings');
      const existingSettings = await settingsCollection.findOne({ type: 'appConfig' });
      
      if (!existingSettings) {
        await settingsCollection.insertOne({
          type: 'appConfig',
          data: defaultSettings.appConfig,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ Default app configuration inserted');
      } else {
        console.log('ℹ️  Default settings already exist');
      }
      
      const templatesCollection = db.collection('emailtemplates');
      const existingTemplates = await templatesCollection.findOne({ type: 'system' });
      
      if (!existingTemplates) {
        await templatesCollection.insertOne({
          type: 'system',
          templates: defaultSettings.emailTemplates,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ Default email templates inserted');
      } else {
        console.log('ℹ️  Email templates already exist');
      }
    }
    
    // Create admin user (only in development)
    if (environment === 'development') {
      console.log('\n👤 Creating admin user for development...');
      await createAdminUser(db);
    }
    
    // Database statistics
    console.log('\n📊 Database Statistics:');
    const stats = await db.stats();
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Indexes: ${stats.indexes}`);
    console.log(`   Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n🎉 Database initialization completed successfully!');
    
    // Connection info
    console.log('\n🔗 Connection Information:');
    console.log(`   Environment: ${environment}`);
    console.log(`   Database: ${dbConfig.dbName}`);
    console.log(`   URI: ${dbConfig.uri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n👋 Database connection closed');
    }
  }
}

async function createAdminUser(db) {
  const bcrypt = require('bcryptjs');
  const usersCollection = db.collection('users');
  
  const adminEmail = 'admin@financetracker.local';
  const existingAdmin = await usersCollection.findOne({ email: adminEmail });
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    await usersCollection.insertOne({
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      isVerified: true,
      preferences: {
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        theme: 'light',
        language: 'en',
        emailNotifications: true,
        pushNotifications: false
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    });
    
    console.log('✅ Admin user created:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: Admin123!`);
    console.log('   ⚠️  Please change this password in production!');
  } else {
    console.log('ℹ️  Admin user already exists');
  }
}

// Health check function
async function healthCheck() {
  let client;
  
  try {
    console.log('🏥 Running database health check...');
    client = new MongoClient(dbConfig.uri);
    await client.connect();
    
    const db = client.db(dbConfig.dbName);
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections`);
    
    // Check indexes
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      const indexes = await coll.indexes();
      console.log(`✅ Collection '${collection.name}': ${indexes.length} indexes`);
    }
    
    console.log('✅ Database health check passed');
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[3];
  
  switch (command) {
    case 'health':
      healthCheck();
      break;
    case 'init':
    default:
      initializeDatabase();
      break;
  }
}

module.exports = {
  initializeDatabase,
  healthCheck,
  collections,
  defaultSettings
}; 