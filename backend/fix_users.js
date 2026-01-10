require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const fixUsers = async () => {
    await connectDB();

    try {
        console.log('Cleaning up test users...');
        const emails = ['alice@test.com', 'bob@test.com'];

        const result = await User.deleteMany({ email: { $in: emails } });

        console.log(`Deleted ${result.deletedCount} users with emails: ${emails.join(', ')}`);
        console.log('You can now register these users again via the Signup page.');

    } catch (error) {
        console.error('Error cleaning users:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

fixUsers();
