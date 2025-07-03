import setupMongoose from "./mongo.js";
import mongoose from "mongoose";
// import Property from "./src/models/properties.js"; 
import User from "./src/models/user.js";

export const connectToDatabase = async () => {
  try {
   
    await setupMongoose();
    console.log("Mongoose connection established");

    const user = await User.find({}).exec();

    return { mongoose };
  } catch (error) {
    console.error("Error connecting to database or querying properties:", error);
    throw error;
  }
};

// Handle top-level await
connectToDatabase()
  .then(() => {
    console.log("Database connection and query completed");
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
});