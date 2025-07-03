import mongoose from "mongoose";
import autopopulate from "mongoose-autopopulate";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
    required: true,
  },
  phone_number: {
    type: String,
    required: true,
  },
  image: {
    type: String, 
    required: true,
  },
  gender: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'users' });

// Apply the autopopulate plugin to the schema
userSchema.plugin(autopopulate);

const User = mongoose.model("User", userSchema);

export default User;