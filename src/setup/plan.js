import dotenv from "dotenv";
import https from "https";

dotenv.config({
  path: "../../.env",
  override: false,
});

const createPlan = (name, interval, amount) => {
  return new Promise((resolve, reject) => {
    if (!name || !interval || !amount) {
      return reject("Missing required fields: name, interval, amount");
    }

    const planParams = JSON.stringify({
      name,
      interval,
      amount: Number(amount) * 100, // Convert to kobo
    });

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: "/plan",
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
        if (response.statusCode === 201 && parsed.data?.plan_code) {
          resolve(parsed.data.plan_code);
        } else {
          reject(`Failed to create plan: ${parsed?.message || "Unknown error"}`);
        }
      });
    });

    request.on("error", (error) => {
      console.error("Error creating plan:", error);
      reject("Internal server error while creating plan");
    });

    request.write(planParams);
    request.end();
  });
};

export default createPlan;