import mongoose from "mongoose";
import "dotenv/config";

export default async function connectDb() {
  let dbUri = process.env?.MONGODB_URI ?? "";
  try {
    await mongoose.connect(dbUri, {
      dbName: 'estatesync',
      //useNewUrlParser: true,
    });
    // console.log(dbUri);
  } catch (err) {
    mongoose.createConnection(dbUri);
  }

  const info = mongoose.connections[0];

  mongoose.connection
    .on("error", () => console.error("Unable to connect to database"))
    .on("close", () => console.log("Database connection closed.")) // eslint-disable-line no-console
    .once("open", () =>
      console.log(`Connected to ${info.host}:${info.port}/${info.name}`)
    );
}
