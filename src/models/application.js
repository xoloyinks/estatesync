import mongoose from 'mongoose'
import autopopulate from "mongoose-autopopulate";

const applicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        autopopulate: true,
        unique: true
    },
    proof:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        autopopulate: true
    }, 
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        autopopulate: true
    },
    status: {
        type: String,
        require: true
    },
    code: {
        type: String,
        require: true,
        unique: true
    },
    payment: {
        type: String,
        require: false,
    },
    createdAt: {
    type: Date,
    default: Date.now,
  },
}, {collection: 'applications'})

// Apply the autopopulate plugin to the schema
applicationSchema.plugin(autopopulate);

const Application = mongoose.model("Application", applicationSchema);

export default Application;