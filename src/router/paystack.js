import express from "express";
import https from "https";
import jwtMiddleware from "../middlewares/check_user.js";
import dotenv from "dotenv";
import crypto from "crypto";
import User from "../models/user.js";
import Tenant from "../models/tenant.js";
import Property from "../models/properties.js";
import Payment from "../models/payment.js";
import { ref } from "process";
dotenv.config({
  path: "../../.env",
  override: false,
});

const router = express.Router();

router.post("/", jwtMiddleware, async (req, res) => {
  const { email, amount, planCode } = req.body;

  if (!email || !amount || !planCode) {
    return res.status(400).json({ message: "Missing required fields: email, amount, planCode" });
  }

  const transactionParams = JSON.stringify({
    email,
    amount: Number(amount) * 100,
    plan: planCode,
  });

  const options = {
    hostname: "api.paystack.co",
    port: 443,
    path: "/transaction/initialize",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  };

  const request = https.request(options, (response) => {
    let data = "";
    response.on("data", (chunk) => (data += chunk));
    response.on("end", () => {
      const parsed = JSON.parse(data);
      if (response.statusCode === 200) {
        return res.status(200).json({
          message: "Subscription initialized",
          data: parsed.data,
        });
      } else {
        return res.status(response.statusCode).json({
          message: "Failed to initialize transaction",
          error: parsed,
        });
      }
    });
  });

  request.on("error", (error) => {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  });

  request.write(transactionParams);
  request.end();
});


router.post('/webhook', async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('PAYSTACK_SECRET_KEY is not set');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  // Verify Paystack signature
  const hash = crypto
    .createHmac('sha512', secret)
    .update(req.rawBody)
    .digest('hex');
  const signature = req.headers['x-paystack-signature'];

  if (!signature || signature !== hash) {
    console.error('Invalid Paystack signature:', { received: signature, expected: hash });
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = req.body;
  console.log(event);
  if (event && event.event === 'charge.success') {
    try {
      const eventObj = event.data;
      // Update user role to tenant
      const updateRole = await User.findOneAndUpdate(
        { email: eventObj.customer.email },
        { role: 'tenant' },
        { new: true }
      );
      if (!updateRole) {
        console.error('User not found or role update failed:', eventObj.customer.email);
        return res.status(404).json({ message: 'User not found or role update failed' });
      }

      const property = await Property.findOne({ planCode: eventObj.plan.plan_code });
      if (!property) {
        console.error('No property found for plan code:', eventObj.plan.plan_code);
        return res.status(404).json({ message: 'No property found for the specified plan code' });
      }

      const tenantDoc = await Tenant.create({
        user: updateRole._id,
        acquiredProperty: property._id,
        status: 'paid',
      });

      if (!tenantDoc) {
        console.error('Failed to create tenant document for user:', updateRole._id);
        return res.status(500).json({ message: 'Failed to create tenant document' });
      }

      // Create payment record
      const paymentData = {
        user: updateRole._id,
        plan_code: eventObj.plan.plan_code,
        customer_code: eventObj.customer.customer_code,
        subscription_code: eventObj.subscription_code,
        paid_at: eventObj.paid_at,
        amount: eventObj.plan.amount / 100, // Convert kobo to naira
        next_payment_date: eventObj.next_payment_date,
        status: eventObj.status,
        method: eventObj.channel,
        reference: eventObj.reference
      };

      const paymentRecord = await Payment.create(paymentData);
      if (!paymentRecord){
        console.error('Failed to create payment record for user:', updateRole._id);
        return res.status(500).json({ message: 'Failed to create payment record' });
      }
    } catch (err) {
      console.error('Webhook processing error:', err);
    }
  }

  // Respond to Paystack
  res.status(200).json({ received: true });
});



export default router;