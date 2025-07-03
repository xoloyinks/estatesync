import mongoose from 'mongoose'
import autopopulate from "mongoose-autopopulate";

const agentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        autopopulate: true,
        unique: true
    },
    assignedProperties: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            autopopulate: true,
            unique: true
        }
    ]
}, {collection: 'agents'})

// Apply the autopopulate plugin to the schema
agentSchema.plugin(autopopulate);

const Agent = mongoose.model("Agent", agentSchema);

export default Agent;