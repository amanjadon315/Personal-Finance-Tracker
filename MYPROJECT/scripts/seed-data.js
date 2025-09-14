        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
        updatedAt: new Date(),
        lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random login within last week
      };
      
      const result = await db.collection('users').insertOne(user);
      createdUsers.push({
        ...user,
        _id: result.insertedId,
        profile: userData.profile
      });
      
      console.log(`✅ Created user: ${userData.name} (${userData.email})`);
    }
    
    // Create additional users if requested more than sample data
    for (let i = sampleUsers.length; i < options.users; i++) {
      const profileTypes = Object.keys(transactionPatterns);
      const randomProfile = randomChoice(profileTypes);
      const userData = {
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        password: await bcrypt.hash('UserPass123!', 12),
        isVerified: true,
        preferences: {
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          theme: randomChoice(['light', 'dark']),
          language: 'en',
          emailNotifications: Math.random() > 0.5,
          pushNotifications: Math.random() > 0.5,
          defaultTransactionType: randomChoice(['income', 'expense'])
        },
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      };
      
      const result = await db.collection('users').insertOne(userData);
      createdUsers.push({
        ...userData,
        _id: result.insertedId,
        profile: randomProfile
      });
      
      console.log(`✅ Created user: ${userData.name} (${userData.email})`);
    }
    
    // Generate transactions for each user
    console.log(`\n💰 Generating transactions (${options.transactions} per user)...`);
    const allTransactions = [];
    
    for (const user of createdUsers) {
      console.log(`\n📊 Generating transactions for ${user.name}...`);
      
      const pattern = transactionPatterns[user.profile];
      const userTransactions = [];
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (options.months * 30 * 24 * 60 * 60 * 1000));
      
      for (let i = 0; i < options.transactions; i++) {
        // Randomly choose income or expense (weighted towards expenses)
        const transactionType = Math.random() < 0.25 ? 'income' : 'expense';
        const typePattern = pattern[transactionType];
        
        if (typePattern.length === 0) continue;
        
        // Choose random category from pattern
        const categoryData = randomChoice(typePattern);
        
        // Generate amount based on category
        const amount = generateRealisticAmount(categoryData.amount);
        
        // Generate realistic date based on frequency
        let transactionDate;
        switch (categoryData.frequency) {
          case 'monthly':
            // Monthly transactions should cluster around month start
            const monthsBack = Math.floor(Math.random() * options.months);
            const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - monthsBack, 1);
            transactionDate = new Date(monthDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            // Weekly transactions spread throughout the period
            transactionDate = randomDate(startDate, endDate);
            break;
          case 'frequent':
            // More recent transactions
            const recentStart = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
            transactionDate = randomDate(recentStart, endDate);
            break;
          case 'quarterly':
            // Quarterly transactions
            const quartersBack = Math.floor(Math.random() * (options.months / 3));
            const quarterDate = new Date(endDate.getFullYear(), endDate.getMonth() - (quartersBack * 3), 1);
            transactionDate = new Date(quarterDate.getTime() + Math.random() * 15 * 24 * 60 * 60 * 1000);
            break;
          case 'semester':
            // Semester-based (for students)
            const semesterMonths = [8, 0]; // August and January
            const randomSemester = randomChoice(semesterMonths);
            transactionDate = new Date(endDate.getFullYear(), randomSemester, 1 + Math.random() * 30);
            break;
          case 'variable':
            // Irregular pattern for entrepreneurs
            transactionDate = randomDate(startDate, endDate);
            break;
          case 'occasional':
          default:
            transactionDate = randomDate(startDate, endDate);
            break;
        }
        
        // Generate realistic descriptions
        const descriptions = {
          'Salary': ['Monthly salary', 'Paycheck', 'Salary payment'],
          'Groceries': ['Weekly shopping', 'Supermarket', 'Food shopping', 'Grocery store'],
          'Food & Dining': ['Lunch', 'Dinner out', 'Coffee', 'Restaurant', 'Fast food', 'Takeout'],
          'Transportation': ['Gas', 'Bus fare', 'Uber', 'Taxi', 'Parking', 'Metro card'],
          'Entertainment': ['Movie tickets', 'Concert', 'Netflix', 'Spotify', 'Games', 'Books'],
          'Shopping': ['Clothing', 'Electronics', 'Amazon', 'Online shopping', 'Department store'],
          'Utilities': ['Electric bill', 'Water bill', 'Internet', 'Gas bill'],
          'Healthcare': ['Doctor visit', 'Pharmacy', 'Dental', 'Medical bills', 'Prescription'],
          'Insurance': ['Car insurance', 'Health insurance', 'Life insurance', 'Home insurance'],
          'Rent': ['Monthly rent', 'Apartment rent', 'Housing payment'],
          'Mortgage': ['Mortgage payment', 'Home loan payment'],
          'Phone': ['Cell phone bill', 'Phone service', 'Mobile plan']
        };
        
        const categoryDescriptions = descriptions[categoryData.category] || [categoryData.category];
        const description = randomChoice(categoryDescriptions);
        
        const transaction = {
          userId: user._id,
          type: transactionType,
          amount: amount,
          category: categoryData.category,
          description: description,
          date: transactionDate,
          createdAt: new Date(transactionDate.getTime() + Math.random() * 24 * 60 * 60 * 1000),
          updatedAt: new Date(transactionDate.getTime() + Math.random() * 24 * 60 * 60 * 1000)
        };
        
        userTransactions.push(transaction);
      }
      
      // Sort transactions by date
      userTransactions.sort((a, b) => a.date - b.date);
      allTransactions.push(...userTransactions);
      
      console.log(`   ✅ Generated ${userTransactions.length} transactions`);
      
      // Show summary for this user
      const income = userTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = userTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      console.log(`   💰 Total Income: ${income.toFixed(2)}`);
      console.log(`   💸 Total Expenses: ${expense.toFixed(2)}`);
      console.log(`   📈 Net: ${(income - expense).toFixed(2)}`);
    }
    
    // Insert all transactions
    if (allTransactions.length > 0) {
      console.log(`\n📥 Inserting ${allTransactions.length} transactions...`);
      await db.collection('transactions').insertMany(allTransactions);
      console.log('✅ All transactions inserted');
    }
    
    // Generate some activity logs
    console.log('\n📋 Generating activity logs...');
    const activityLogs = [];
    
    for (const user of createdUsers) {
      const activities = [
        {
          userId: user._id,
          action: 'register',
          details: { registrationMethod: 'email' },
          timestamp: user.createdAt,
          ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          userId: user._id,
          action: 'login',
          details: { loginMethod: 'email' },
          timestamp: user.lastLogin,
          ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      ];
      
      // Add some transaction creation activities
      const userTransactionCount = allTransactions.filter(t => t.userId.equals(user._id)).length;
      const activityCount = Math.min(5, Math.floor(userTransactionCount / 10));
      
      for (let i = 0; i < activityCount; i++) {
        activities.push({
          userId: user._id,
          action: randomChoice(['transaction_create', 'transaction_update', 'profile_update']),
          details: { category: randomChoice(['income', 'expense']) },
          timestamp: randomDate(user.createdAt, new Date()),
          ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
      }
      
      activityLogs.push(...activities);
    }
    
    if (activityLogs.length > 0) {
      await db.collection('activitylogs').insertMany(activityLogs);
      console.log(`✅ Generated ${activityLogs.length} activity log entries`);
    }
    
    // Generate database statistics
    console.log('\n📊 Database Statistics:');
    const stats = {
      users: await db.collection('users').countDocuments(),
      transactions: await db.collection('transactions').countDocuments(),
      activityLogs: await db.collection('activitylogs').countDocuments()
    };
    
    console.log(`   👥 Users: ${stats.users}`);
    console.log(`   💰 Transactions: ${stats.transactions}`);
    console.log(`   📋 Activity Logs: ${stats.activityLogs}`);
    
    // Calculate overall financial summary
    const financialSummary = await db.collection('transactions').aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]).toArray();
    
    const totalIncome = financialSummary.find(s => s._id === 'income')?.total || 0;
    const totalExpense = financialSummary.find(s => s._id === 'expense')?.total || 0;
    
    console.log('\n💼 Financial Summary:');
    console.log(`   💰 Total Income: ${totalIncome.toFixed(2)}`);
    console.log(`   💸 Total Expenses: ${totalExpense.toFixed(2)}`);
    console.log(`   📈 Net Amount: ${(totalIncome - totalExpense).toFixed(2)}`);
    
    // Show sample login credentials
    console.log('\n🔐 Sample User Credentials:');
    console.log('   All users have password: UserPass123!');
    console.log('   Sample accounts:');
    
    createdUsers.slice(0, 3).forEach(user => {
      console.log(`   📧 ${user.email} (${user.name}) - ${user.profile}`);
    });
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start your application: npm run dev');
    console.log('   2. Login with any of the sample accounts');
    console.log('   3. Explore the generated transaction data');
    console.log('   4. Test the analytics and dashboard features');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n👋 Database connection closed');
    }
  }
}

// Additional utility function to create specific scenario data
async function createScenarios(db) {
  console.log('\n🎭 Creating specific financial scenarios...');
  
  // Scenario 1: High spender
  // Scenario 2: Saver
  // Scenario 3: Variable income
  // etc.
  
  // This is a placeholder for creating more specific test scenarios
  console.log('   ℹ️  Scenario creation not implemented yet');
}

// Clean database function
async function cleanDatabase() {
  let client;
  
  try {
    console.log('🧹 Cleaning database...');
    client = new MongoClient(dbConfig.uri);
    await client.connect();
    
    const db = client.db(dbConfig.dbName);
    
    const collections = ['users', 'transactions', 'otps', 'activitylogs'];
    
    for (const collectionName of collections) {
      const result = await db.collection(collectionName).deleteMany({});
      console.log(`   ✅ Cleaned ${collectionName}: ${result.deletedCount} documents removed`);
    }
    
    console.log('✅ Database cleaned successfully');
    
  } catch (error) {
    console.error('❌ Database cleaning failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Show database statistics
async function showStats() {
  let client;
  
  try {
    console.log('📊 Database Statistics:');
    client = new MongoClient(dbConfig.uri);
    await client.connect();
    
    const db = client.db(dbConfig.dbName);
    
    const collections = ['users', 'transactions', 'otps', 'activitylogs'];
    
    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`   ${collectionName}: ${count} documents`);
    }
    
    // Show financial summary if transactions exist
    const transactionCount = await db.collection('transactions').countDocuments();
    if (transactionCount > 0) {
      const summary = await db.collection('transactions').aggregate([
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]).toArray();
      
      console.log('\n💼 Financial Summary:');
      summary.forEach(item => {
        console.log(`   ${item._id}: ${item.total.toFixed(2)} (${item.count} transactions)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to get statistics:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Command line interface
if (require.main === module) {
  const command = args.find(arg => ['seed', 'clean', 'stats'].includes(arg));
  
  switch (command) {
    case 'clean':
      cleanDatabase();
      break;
    case 'stats':
      showStats();
      break;
    case 'seed':
    default:
      seedDatabase();
      break;
  }
}

module.exports = {
  seedDatabase,
  cleanDatabase,
  showStats,
  sampleUsers,
  transactionPatterns
};#!/usr/bin/env node

/**
 * Sample Data Seeding Script for Finance Tracker
 * 
 * This script populates the database with realistic sample data for:
 * - Test users with various profiles
 * - Sample transactions covering different categories and time periods
 * - Realistic financial patterns and scenarios
 * 
 * Usage: node scripts/seed-data.js [environment] [options]
 * Options:
 *   --users=N     Number of users to create (default: 3)
 *   --transactions=N  Transactions per user (default: 50)
 *   --months=N    Months of historical data (default: 6)
 *   --clean       Remove existing data before seeding
 * 
 * Example: node scripts/seed-data.js development --users=5 --transactions=100 --clean
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
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

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => !arg.startsWith('--')) || 'development';
const options = {
  users: parseInt(args.find(arg => arg.startsWith('--users='))?.split('=')[1]) || 3,
  transactions: parseInt(args.find(arg => arg.startsWith('--transactions='))?.split('=')[1]) || 50,
  months: parseInt(args.find(arg => arg.startsWith('--months='))?.split('=')[1]) || 6,
  clean: args.includes('--clean')
};

const dbConfig = config[environment];

if (!dbConfig) {
  console.error('❌ Invalid environment specified. Use: development, test, or production');
  process.exit(1);
}

if (environment === 'production' && !process.env.ALLOW_PRODUCTION_SEED) {
  console.error('❌ Cannot seed production database without ALLOW_PRODUCTION_SEED=true environment variable');
  process.exit(1);
}

console.log(`🌱 Seeding Finance Tracker database`);
console.log(`   Environment: ${environment}`);
console.log(`   Database: ${dbConfig.dbName}`);
console.log(`   Users: ${options.users}`);
console.log(`   Transactions per user: ${options.transactions}`);
console.log(`   Historical data: ${options.months} months`);
console.log(`   Clean existing data: ${options.clean}`);

// Sample user profiles
const sampleUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'UserPass123!',
    profile: 'young_professional',
    preferences: {
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      theme: 'light',
      language: 'en',
      emailNotifications: true,
      pushNotifications: true,
      defaultTransactionType: 'expense'
    }
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'UserPass123!',
    profile: 'family_man',
    preferences: {
      currency: 'USD',
      dateFormat: 'DD/MM/YYYY',
      theme: 'dark',
      language: 'en',
      emailNotifications: false,
      pushNotifications: false,
      defaultTransactionType: 'expense'
    }
  },
  {
    name: 'Carol Davis',
    email: 'carol@example.com',
    password: 'UserPass123!',
    profile: 'student',
    preferences: {
      currency: 'USD',
      dateFormat: 'YYYY-MM-DD',
      theme: 'light',
      language: 'en',
      emailNotifications: true,
      pushNotifications: true,
      defaultTransactionType: 'expense'
    }
  },
  {
    name: 'David Wilson',
    email: 'david@example.com',
    password: 'UserPass123!',
    profile: 'entrepreneur',
    preferences: {
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      theme: 'dark',
      language: 'en',
      emailNotifications: true,
      pushNotifications: false,
      defaultTransactionType: 'income'
    }
  },
  {
    name: 'Emma Brown',
    email: 'emma@example.com',
    password: 'UserPass123!',
    profile: 'retiree',
    preferences: {
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      theme: 'light',
      language: 'en',
      emailNotifications: true,
      pushNotifications: false,
      defaultTransactionType: 'expense'
    }
  }
];

// Transaction patterns by user profile
const transactionPatterns = {
  young_professional: {
    income: [
      { category: 'Salary', amount: [3500, 4500], frequency: 'monthly' },
      { category: 'Bonus', amount: [500, 2000], frequency: 'quarterly' },
      { category: 'Freelance', amount: [200, 800], frequency: 'occasional' }
    ],
    expense: [
      { category: 'Rent', amount: [1200, 1400], frequency: 'monthly' },
      { category: 'Groceries', amount: [80, 150], frequency: 'weekly' },
      { category: 'Transportation', amount: [30, 80], frequency: 'weekly' },
      { category: 'Food & Dining', amount: [15, 60], frequency: 'frequent' },
      { category: 'Entertainment', amount: [20, 100], frequency: 'frequent' },
      { category: 'Shopping', amount: [50, 300], frequency: 'occasional' },
      { category: 'Utilities', amount: [80, 120], frequency: 'monthly' },
      { category: 'Phone', amount: [40, 60], frequency: 'monthly' },
      { category: 'Insurance', amount: [150, 200], frequency: 'monthly' },
      { category: 'Healthcare', amount: [50, 200], frequency: 'occasional' }
    ]
  },
  family_man: {
    income: [
      { category: 'Salary', amount: [5000, 7000], frequency: 'monthly' },
      { category: 'Spouse Income', amount: [2500, 3500], frequency: 'monthly' },
      { category: 'Investment', amount: [100, 500], frequency: 'occasional' }
    ],
    expense: [
      { category: 'Mortgage', amount: [2000, 2500], frequency: 'monthly' },
      { category: 'Groceries', amount: [150, 250], frequency: 'weekly' },
      { category: 'Transportation', amount: [60, 120], frequency: 'weekly' },
      { category: 'Children Education', amount: [300, 800], frequency: 'monthly' },
      { category: 'Healthcare', amount: [200, 500], frequency: 'occasional' },
      { category: 'Insurance', amount: [300, 500], frequency: 'monthly' },
      { category: 'Utilities', amount: [150, 250], frequency: 'monthly' },
      { category: 'Entertainment', amount: [100, 300], frequency: 'occasional' },
      { category: 'Shopping', amount: [100, 400], frequency: 'occasional' },
      { category: 'Home Maintenance', amount: [200, 800], frequency: 'occasional' }
    ]
  },
  student: {
    income: [
      { category: 'Part-time Job', amount: [800, 1200], frequency: 'monthly' },
      { category: 'Financial Aid', amount: [2000, 3000], frequency: 'semester' },
      { category: 'Family Support', amount: [300, 600], frequency: 'monthly' },
      { category: 'Tutoring', amount: [50, 200], frequency: 'occasional' }
    ],
    expense: [
      { category: 'Tuition', amount: [2000, 4000], frequency: 'semester' },
      { category: 'Books', amount: [200, 500], frequency: 'semester' },
      { category: 'Housing', amount: [600, 900], frequency: 'monthly' },
      { category: 'Groceries', amount: [40, 80], frequency: 'weekly' },
      { category: 'Transportation', amount: [20, 40], frequency: 'weekly' },
      { category: 'Food & Dining', amount: [10, 30], frequency: 'frequent' },
      { category: 'Phone', amount: [30, 50], frequency: 'monthly' },
      { category: 'Entertainment', amount: [20, 80], frequency: 'occasional' },
      { category: 'Clothing', amount: [50, 150], frequency: 'occasional' }
    ]
  },
  entrepreneur: {
    income: [
      { category: 'Business Revenue', amount: [2000, 10000], frequency: 'variable' },
      { category: 'Consulting', amount: [1000, 5000], frequency: 'occasional' },
      { category: 'Investment', amount: [500, 2000], frequency: 'occasional' },
      { category: 'Dividends', amount: [200, 800], frequency: 'quarterly' }
    ],
    expense: [
      { category: 'Business Expenses', amount: [500, 3000], frequency: 'frequent' },
      { category: 'Office Rent', amount: [800, 1500], frequency: 'monthly' },
      { category: 'Marketing', amount: [300, 1500], frequency: 'occasional' },
      { category: 'Equipment', amount: [200, 2000], frequency: 'occasional' },
      { category: 'Travel', amount: [300, 1200], frequency: 'occasional' },
      { category: 'Groceries', amount: [100, 200], frequency: 'weekly' },
      { category: 'Food & Dining', amount: [30, 100], frequency: 'frequent' },
      { category: 'Transportation', amount: [40, 100], frequency: 'weekly' },
      { category: 'Insurance', amount: [200, 400], frequency: 'monthly' },
      { category: 'Professional Services', amount: [200, 800], frequency: 'occasional' }
    ]
  },
  retiree: {
    income: [
      { category: 'Pension', amount: [2000, 3000], frequency: 'monthly' },
      { category: 'Social Security', amount: [1200, 1800], frequency: 'monthly' },
      { category: 'Investment', amount: [300, 800], frequency: 'monthly' },
      { category: 'Part-time Work', amount: [400, 800], frequency: 'occasional' }
    ],
    expense: [
      { category: 'Housing', amount: [800, 1200], frequency: 'monthly' },
      { category: 'Healthcare', amount: [300, 800], frequency: 'frequent' },
      { category: 'Groceries', amount: [60, 120], frequency: 'weekly' },
      { category: 'Utilities', amount: [100, 180], frequency: 'monthly' },
      { category: 'Transportation', amount: [30, 60], frequency: 'weekly' },
      { category: 'Insurance', amount: [200, 400], frequency: 'monthly' },
      { category: 'Entertainment', amount: [50, 150], frequency: 'occasional' },
      { category: 'Travel', amount: [500, 2000], frequency: 'occasional' },
      { category: 'Gifts', amount: [100, 500], frequency: 'occasional' },
      { category: 'Home Maintenance', amount: [150, 600], frequency: 'occasional' }
    ]
  }
};

// Utility functions
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(startDate, endDate) {
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

function generateRealisticAmount(range) {
  const [min, max] = range;
  const amount = randomBetween(min, max);
  // Round to 2 decimal places
  return Math.round(amount * 100) / 100;
}

async function seedDatabase() {
  let client;
  
  try {
    console.log('\n🔗 Connecting to MongoDB...');
    client = new MongoClient(dbConfig.uri);
    await client.connect();
    
    const db = client.db(dbConfig.dbName);
    
    // Clean existing data if requested
    if (options.clean) {
      console.log('\n🧹 Cleaning existing data...');
      await db.collection('users').deleteMany({});
      await db.collection('transactions').deleteMany({});
      await db.collection('otps').deleteMany({});
      await db.collection('activitylogs').deleteMany({});
      console.log('✅ Existing data cleaned');
    }
    
    // Create users
    console.log('\n👥 Creating sample users...');
    const createdUsers = [];
    
    for (let i = 0; i < Math.min(options.users, sampleUsers.length); i++) {
      const userData = sampleUsers[i];
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        isVerified: true,
        preferences: userData.preferences,
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
        updatedAt: new Date(),
        