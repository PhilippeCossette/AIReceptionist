import { Router } from "express";
import type { Request, Response } from "express";
import twilio from "twilio";
import { sendSms } from "../services/smsService.ts";

const router = Router();
const VoiceResponse = twilio.twiml.VoiceResponse;
const MessagingResponse = twilio.twiml.MessagingResponse;

router.post("/incoming", (req: Request, res: Response) => {
  const twiml = new VoiceResponse();

  //   Change on developpment to simulate a missed call for testing purposes

  if (process.env.SIMULATE_MISSED_CALL === "true") {
    const dial = twiml.dial({
      action: "/twilio/missed-call",
      method: "POST",
      timeout: 1,
    });
    dial.number("+15005550000");
  } else {
    const dial = twiml.dial({
      action: "/twilio/missed-call",
      method: "POST",
      timeout: 20,
    });
    dial.number(process.env.RESTAURANT_FORWARD_NUMBER as string);
  }
  res.type("text/xml").send(twiml.toString());
});

router.post("/missed-call", async (req: Request, res: Response) => {
  const { DialCallStatus, From } = req.body;

  const wasMissed = !["completed"].includes(DialCallStatus);

  if (wasMissed) {
    await sendSms(
      From,
      "We missed your call! Please leave a message or text us back and we'll get back to you as soon as possible.",
    );
  }

  res.type("text/xml").send(new VoiceResponse().toString());
});

router.post("/sms", (req: Request, res: Response) => {
  const { From, Body } = req.body;

  console.log(`Received SMS from ${From}: ${Body}`);

  const twiml = new MessagingResponse();
  twiml.message("Thank you for your message! We will get back to you shortly.");

  res.type("text/xml").send(twiml.toString());
});

export default router;
