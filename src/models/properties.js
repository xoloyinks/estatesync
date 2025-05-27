import mongoose from "mongoose";
import autopopulate from "mongoose-autopopulate";

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  image: {
    type: Array, // Currently an array of strings (e.g., URLs or filenames)
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'properties' });

// Apply the autopopulate plugin to the schema
propertySchema.plugin(autopopulate);

const Property = mongoose.model("Property", propertySchema);

export default Property;