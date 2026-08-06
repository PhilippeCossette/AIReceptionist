import { Router } from "express";
import type { Request, Response } from "express";
import twilio from "twilio";
import { sendSms } from "../services/smsService.ts";
import { getAiReply } from "../services/aiSercvice.ts";
import {
  getConversation,
  appendMessage,
} from "../services/conversationStore.ts";
import { isRateLimited } from "../services/rateLimiter.ts";
import { validateTwilioRequest } from "../middleware/validateTwilioRequest.ts";

const router = Router();
const VoiceResponse = twilio.twiml.VoiceResponse;
const MessagingResponse = twilio.twiml.MessagingResponse;

router.use(validateTwilioRequest);

// Shared missed-call handling: send the AI text-back to the caller
async function handleMissedCall(callerNumber: string) {
  await sendSms(
    callerNumber,
    "We missed your call! Please leave a message or text us back and we'll get back to you as soon as possible.",
  );
}

router.post("/incoming", async (req: Request, res: Response) => {
  const twiml = new VoiceResponse();
  const { From } = req.body;

  if (process.env.SIMULATE_MISSED_CALL === "true") {
    // Local/dev testing only: simulate the dial->timeout->missed flow
    const dial = twiml.dial({
      action: "/twilio/missed-call",
      method: "POST",
      timeout: 1,
    });
    dial.number("+15005550000");
  } else {
    // Production: the restaurant's real number already rang and went
    // unanswered — that's why this webhook is firing at all (carrier
    // "forward on no answer"). No need to dial anything again.
    await handleMissedCall(From);

    twiml.say("Sorry we missed your call! We'll text you shortly.");
    twiml.hangup();
  }

  res.type("text/xml").send(twiml.toString());
});

router.post("/missed-call", async (req: Request, res: Response) => {
  // Only reached via the SIMULATE_MISSED_CALL dial->timeout path
  const { DialCallStatus, From } = req.body;
  const wasMissed = !["completed"].includes(DialCallStatus);

  if (wasMissed) {
    await handleMissedCall(From);
  }

  res.type("text/xml").send(new VoiceResponse().toString());
});

router.post("/sms", async (req: Request, res: Response) => {
  const { From, Body } = req.body;
  const twiml = new MessagingResponse();

  if (isRateLimited(From)) {
    console.warn(`Rate limit hit for ${From}`);
    // Don't engage further — replying at all just invites more spam traffic
    res.type("text/xml").send(twiml.toString());
    return;
  }

  appendMessage(From, "user", Body);

  try {
    const conversation = getConversation(From);
    const reply = await getAiReply(conversation.messages);
    appendMessage(From, "assistant", reply);
    twiml.message(reply);
  } catch (err) {
    console.error("AI reply failed:", err);
    twiml.message(
      "Sorry, we're having trouble right now — a team member will text you back shortly.",
    );
  }

  res.type("text/xml").send(twiml.toString());
});

export default router;
