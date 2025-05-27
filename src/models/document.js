import mongoose from "mongoose";
import autopopulate from "mongoose-autopopulate";

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {collection: 'documents'});

// Apply the autopopulate plugin to the schema
documentSchema.plugin(autopopulate);

const Document = mongoose.model("Document", documentSchema);

export default Document;