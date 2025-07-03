import mongoose from 'mongoose'
import autopopulate from "mongoose-autopopulate";

const tenantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        autopopulate: true,
        unique: true
    },
    acquiredProperty:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        autopopulate: true
    }, 
    status: {
        type: String,
    }
}, {collection: 'tenants'})

// Apply the autopopulate plugin to the schema
tenantSchema.plugin(autopopulate);

const Tenant = mongoose.model("Tenant", tenantSchema);

export default Tenant;