import dotenv from "dotenv";
dotenv.config();
console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("TOKEN:", process.env.TWILIO_AUTH_TOKEN ? "loaded" : "MISSING");
console.log("API KEY:", process.env.ANTHROPIC_API_KEY ? "loaded" : "MISSING");

import express from "express";
import twilioRoutes from "./routes/twilio.ts";

const app = express();

app.use(express.urlencoded({ extended: false })); // Twilio sends form-encoded data
app.use(express.json());

const port = process.env.PORT || 3000;

app.route("/").get((req, res) => {
  res.send("Hello, World!");
});

app.use("/twilio", twilioRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
