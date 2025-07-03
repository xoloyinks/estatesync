import express from "express";
import https from "https";
import jwtMiddleware from "../middlewares/check_user.js";
import dotenv from "dotenv";

dotenv.config({
  path: "../../.env",
  override: false,
});

const router = express.Router();

router.post("/subscribe", jwtMiddleware, async (req, res) => {
  const { name, interval, amount, email } = req.body;

  // Validate request body
  if (!name || !interval || !amount || !email) {
    return res.status(400).json({ message: "Missing required fields: name, interval, amount, email" });
  }

  // Step 1: Create Paystack Plan
  const planParams = JSON.stringify({
    name,
    interval,
    amount: Number(amount) * 100, // Convert to kobo
  });

  const planOptions = {
    hostname: "api.paystack.co",
    port: 443,
    path: "/plan",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  };

  // Create a promise for the plan creation request
  const createPlan = () =>
    new Promise((resolve, reject) => {
      const request = https.request(planOptions, (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          const parsedData = JSON.parse(data);
          if (response.statusCode === 201) {
            resolve(parsedData);
          } else {
            reject(new Error(`Failed to create plan: ${JSON.stringify(parsedData)}`));
          }
        });
      });

      request.on("error", (error) => reject(error));
      request.write(planParams);
      request.end();
    });

  // Step 2: Initialize Transaction for Subscription
  const initializeTransaction = (planCode) =>
    new Promise((resolve, reject) => {
      const transactionParams = JSON.stringify({
        email,
        amount: Number(amount) * 100, // Convert to kobo
        plan: planCode, // Use the plan_code from the plan creation
      });

      const transactionOptions = {
        hostname: "api.paystack.co",
        port: 443,
        path: "/transaction/initialize",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      };

      const request = https.request(transactionOptions, (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          const parsedData = JSON.parse(data);
          if (response.statusCode === 200) {
            resolve(parsedData);
          } else {
            reject(new Error(`Failed to initialize transaction: ${JSON.stringify(parsedData)}`));
          }
        });
      });

      request.on("error", (error) => reject(error));
      request.write(transactionParams);
      request.end();
    });

  try {
    // Create plan
    const planResponse = await createPlan();
    const planCode = planResponse.data.plan_code; // Extract plan_code

    // Initialize transaction with the plan_code
    const transactionResponse = await initializeTransaction(planCode);

    // Return the subscription initialization response
    return res.status(201).json({
      message: "Subscription created successfully",
      data: transactionResponse,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      message: "Failed to create subscription",
      error: error.message,
    });
  }
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

router.post('/webhook', (req, res) => {
     // Verify Paystack signature
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('PAYSTACK_SECRET_KEY is not set');
    return res.status(500).json({ message: 'Server configuration error' });
  }

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
  // Log the full event for debugging
  console.log('Webhook received:', JSON.stringify(event, null, 2));
  console.log('Event type:', event.event);

  if (event.event === 'subscription.create') {
    // Handle subscription creation
    console.log('Subscription created:', event.data);
    // Example: Update payment data (e.g., save to database)
    const payment = {
      created_at: event.data.created_at || new Date().toISOString(),
      next_payment_date: event.data.next_payment_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    };
    console.log('Updated payment:', payment);
    // TODO: Save payment to database or state for use in frontend
    return res.status(200).json({ message: 'Subscription created' });
  } else if (event.event === 'charge.success') {
    // Handle successful charge
    console.log('Payment successful:', event.data);
    return res.status(200).json({ message: 'Payment successful' });
  } else if (event.event === 'charge.failed') {
    // Handle failed charge
    console.log('Payment failed:', event.data);
    return res.status(400).json({ message: 'Payment failed' });
  } else {
    // Handle other events
    console.log('Unhandled event:', event.event, event.data);
    return res.status(200).json({ message: 'Event received' });
  }
});



export default router;