// server/config/db.js

const mongoose = require('mongoose');

// Function to connect to MongoDB Atlas
const connectDB = async () => {
  try {
    // mongoose.connect() uses the MONGO_URI from our .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // If connection is successful, log the host name
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    // If connection fails, log the error and stop the server
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Exit the process with failure code 1
    process.exit(1);
  }
};

// Export the function so index.js can use it
module.exports = connectDB;