import express from "express";
import https from "https";
import jwtMiddleware from "../middlewares/check_user.js";
import dotenv from "dotenv";
import crypto from "crypto";
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

// webhook to verify payment
// update user role to tenant
// create tenant document and set status to paid
// create a new doc in payment collection with encrypted user id, plan_code, customer_code, subscription_code, paid at date, amount, next payment date, 

// {
//   "event": "charge.success",
//   "data": {
//     "id": 302961,
//     "domain": "test",
//     "status": "success",
//     "reference": "j2c643tbr6",
//     "amount": 10000,
//     "currency": "NGN",
//     "paid_at": "2025-07-03T19:05:25.000Z",
//     "created_at": "2025-07-03T19:05:00.000Z",
//     "channel": "card",
//     "ip_address": "192.168.1.1",
//     "metadata": {
//       "custom_fields": [
//         {
//           "display_name": "Order ID",
//           "variable_name": "order_id",
//           "value": "12345"
//         }
//       ]
//     },
//     "authorization": {
//       "authorization_code": "AUTH_8dfhjjdt",
//       "bin": "539983",
//       "last4": "1234",
//       "exp_month": "12",
//       "exp_year": "2026",
//       "channel": "card",
//       "card_type": "visa",
//       "bank": "Test Bank",
//       "country_code": "NG",
//       "brand": "visa",
//       "reusable": true,
//       "signature": "SIG_xxxxxxxxxxxxxxxxxxxx"
//     },
//     "customer": {
//       "id": 123456,
//       "first_name": "John",
//       "last_name": "Doe",
//       "email": "john.doe@example.com",
//       "customer_code": "CUS_1psu1flkeh1dzm8",
//       "phone": "+2341234567890",
//       "risk_action": "default"
//     },
//     "plan": {
//       "id": 78910,
//       "name": "Monthly Premium Plan",
//       "plan_code": "PLN_tq8ur7pqz80fbpi",
//       "amount": 10000,
//       "interval": "monthly",
//       "currency": "NGN"
//     },
//     "subscription": {
//       "subscription_code": "SUB_vsyqdmlzble3uii",
//       "status": "active",
//       "next_payment_date": "2025-08-03T19:05:25.000Z",
//       "createdAt": "2025-07-03T18:00:00.000Z"
//     },
//     "log": {
//       "time_spent": 25,
//       "attempts": 1,
//       "authentication": "pin",
//       "errors": 0,
//       "success": true,
//       "mobile": false,
//       "input": [],
//       "history": [
//         {
//           "type": "action",
//           "message": "Attempted to pay with card",
//           "time": 25
//         }
//       ]
//     }
//   }
// }

// router.post('/webhook', (req, res) => {
//      // Verify Paystack signature
//   const secret = process.env.PAYSTACK_SECRET_KEY;
//   if (!secret) {
//     console.error('PAYSTACK_SECRET_KEY is not set');
//     return res.status(500).json({ message: 'Server configuration error' });
//   }

//   const hash = crypto
//     .createHmac('sha512', secret)
//     .update(req.rawBody)
//     .digest('hex');
//   const signature = req.headers['x-paystack-signature'];

//   if (!signature || signature !== hash) {
//     console.error('Invalid Paystack signature:', { received: signature, expected: hash });
//     return res.status(400).json({ message: 'Invalid signature' });
//   }

//   const event = req.body;
//   // Log the full event for debugging
//   console.log('Webhook received:', JSON.stringify(event, null, 2));
//   console.log('Event type:', event.event);

//   if (event.event === 'subscription.create') {
//     // Handle subscription creation
//     console.log('Subscription created:', event.data);
//     // Example: Update payment data (e.g., save to database)
//     const payment = {
//       created_at: event.data.created_at || new Date().toISOString(),
//       next_payment_date: event.data.next_payment_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
//     };
//     console.log('Updated payment:', payment);
//     // TODO: Save payment to database or state for use in frontend
//     return res.status(200).json({ message: 'Subscription created' });
//   } else if (event.event === 'charge.success') {
//     // Handle successful charge
//     console.log('Payment successful:', event.data);
//     return res.status(200).json({ message: 'Payment successful' });
//   } else if (event.event === 'charge.failed') {
//     // Handle failed charge
//     console.log('Payment failed:', event.data);
//     return res.status(400).json({ message: 'Payment failed' });
//   } else {
//     // Handle other events
//     console.log('Unhandled event:', event.event, event.data);
//     return res.status(200).json({ message: 'Event received' });
//   }
// });

router.post('/webhook', (req, res) => {
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

  // Log the full event for debugging
  const event = req.body;
  console.log('Paystack Webhook Event:', JSON.stringify(event, null, 2));

  // Respond to Paystack
  res.status(200).json({ received: true });
});



export default router;