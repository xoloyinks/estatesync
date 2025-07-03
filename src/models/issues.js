import mongoose, { mongo } from "mongoose";
import autopopulate from "mongoose-autopopulate";
import Property from "./properties.js";
import User from "./user.js";

const issueSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    autopopulate: true,
    required: true,
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Property,
    autopopulate: true,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  issue: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  agent: {
    type: String, 
    required: true
  },
  status: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {collection: 'issues'});

// Apply the autopopulate plugin to the schema
issueSchema.plugin(autopopulate);

const Issue = mongoose.model("Issue", issueSchema);

export default Issue