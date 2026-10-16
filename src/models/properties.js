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
    autopopulate: true, 
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
    required: false, 
  },
  planCode:{
    type: String,
    required: true, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'properties' });

propertySchema.plugin(autopopulate);

const Property = mongoose.model("Property", propertySchema);

export default Property;