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
  images: {
    type: Array, 
    required: true,
  },
  agent:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    autopopulate: true, // Automatically populate the agent field with User data
  },
  mode: {
    type: String,
    required: true,
  },
  bedrooms: {
    type: String,
    required: true,
  },
  acquired: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    autopopulate: true,
    required: false, // Optional field
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