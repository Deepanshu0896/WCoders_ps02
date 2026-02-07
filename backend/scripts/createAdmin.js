/*require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('../models/User');

const createAdmin = async () => {
  try {
    console.log('🚀 Starting admin creation process...\n');
    
    // Check .env file
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not found in .env file!');
      console.log('Create a .env file in backend folder with:');
      console.log('MONGO_URI=your_mongodb_connection_string');
      process.exit(1);
    }
    
    console.log('📡 Connecting to MongoDB...');
    console.log('Connection String:', process.env.MONGO_URI.replace(/:[^:]*@/, ':****@'));
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully!\n');

    // Check if any users exist
    const userCount = await User.countDocuments();
    console.log(`📊 Current users in database: ${userCount}\n`);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@peersync.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('User Details:');
      console.log('  - ID:', existingAdmin._id);
      console.log('  - Name:', existingAdmin.name);
      console.log('  - Email:', existingAdmin.email);
      console.log('  - Branch:', existingAdmin.branch);
      console.log('  - Year:', existingAdmin.year);
      console.log('  - isAdmin:', existingAdmin.isAdmin);
      
      if (!existingAdmin.isAdmin) {
        console.log('\n🔧 Updating isAdmin status to true...');
        existingAdmin.isAdmin = true;
        await existingAdmin.save();
        console.log('✅ Admin status updated!');
      }
      
      console.log('\n📧 Login Credentials:');
      console.log('==========================================');
      console.log('Email: admin@peersync.com');
      console.log('Password: admin123');
      console.log('==========================================\n');
      
      process.exit(0);
    }

    console.log('🔐 Creating new admin user...\n');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    console.log('✅ Password hashed');

    // Create admin user
    const admin = new User({
      name: 'System Admin',
      email: 'admin@peersync.com',
      password: hashedPassword,
      branch: 'CSE',
      year: 4,
      skills: ['System Administration', 'Management'],
      interests: ['Technology', 'Education'],
      isAdmin: true,
      isAvailable: false,
    });

    await admin.save();
    
    console.log('✅ Admin user created successfully!\n');
    
    console.log('User Details:');
    console.log('  - ID:', admin._id);
    console.log('  - Name:', admin.name);
    console.log('  - Email:', admin.email);
    console.log('  - isAdmin:', admin.isAdmin);
    
    console.log('\n📧 Login Credentials:');
    console.log('==========================================');
    console.log('Email: admin@peersync.com');
    console.log('Password: admin123');
    console.log('==========================================');
    console.log('\n⚠️  IMPORTANT: Change password after first login!');
    console.log('\n🌐 Login at: http://localhost:8000/admin-login.html\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:');
    console.error('Error message:', error.message);
    
    if (error.message.includes('buffering timed out')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check your internet connection');
      console.log('2. Verify MongoDB Atlas cluster is running');
      console.log('3. Whitelist your IP address in Network Access');
    }
    
    if (error.code === 11000) {
      console.log('\n🔧 This email already exists. Use a different email or delete the existing user.');
    }
    
    process.exit(1);
  }
};

createAdmin();*/