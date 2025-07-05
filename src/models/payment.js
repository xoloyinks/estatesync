import mongoose from "mongoose";
import autopopulate from "mongoose-autopopulate";

const paymentSchema = new mongoose.Schema({
  plan_code: {
    type: String,
    required: true,
  },
    customer_code: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true
    },
    amount: {
        type: Number,
        required: true,
    },
    paid_at: {
        type: Date,
    },
    method: {
        type: String,
        enum: ['card', 'bank_transfer', 'mobile_money', 'paystack'],
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    reference: {
        type: String,
        required: true, 
    },
    next_payment_date: {
        type: Date,
    },

}, {collection: 'payments'});

// Apply the autopopulate plugin to the schema
paymentSchema.plugin(autopopulate);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;