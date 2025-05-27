import mongoose from "mongoose";
import 'dotenv/config';

// mongoose.set('strictQuery', true);

mongoose.set('bufferCommands', false);

async function setupMongoose() {
  const MONGO_URI = process.env.MONGODB_URI;
  const db = 'estatesync'
  if (!MONGO_URI) {
    throw new Error("MONGODB_URI is not defined in the environment variables");
  }

  // Add connection event listeners for debugging
  mongoose.connection.on("connected", () => {
    console.log("Mongoose connected to MongoDB");
  });

  mongoose.connection.on("error", (err) => {
    console.error("Mongoose connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("Mongoose disconnected from MongoDB");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("Mongoose reconnected to MongoDB");
  });

  mongoose.connection.on("connecting", () => {
    console.log("Mongoose is connecting to MongoDB");
  });

  // Log readyState periodically to debug
  setInterval(() => {
    console.log(`Mongoose connection readyState: ${mongoose.connection.readyState}`);
  }, 5000);

  // Heartbeat to prevent idle timeouts
  setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.db.command({ ping: 1 });
        console.log("MongoDB heartbeat successful");
      } catch (error) {
        console.error("MongoDB heartbeat failed:", error);
      }
    }
  }, 300000); 

  try {
    await mongoose.connect(MONGO_URI, {dbName: db});
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err; // Re-throw the error to handle it in the calling code
  }
}

// setupMongoose()

// Export the function without calling it here
export default setupMongoose;