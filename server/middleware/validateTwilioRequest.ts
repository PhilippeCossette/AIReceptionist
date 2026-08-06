import twilio from "twilio";
import type { Request, Response, NextFunction } from "express";

export function validateTwilioRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const twilioSignature = req.header("X-Twilio-Signature") ?? "";
  const url = `${process.env.PUBLIC_BASE_URL}${req.originalUrl}`;

  console.log("Validating URL:", url);
  console.log("Signature header:", twilioSignature);
  console.log("Body:", req.body);

  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN as string,
    twilioSignature,
    url,
    req.body,
  );

  if (!isValid) {
    console.warn(
      `Rejected request with invalid Twilio signature for ${req.originalUrl}`,
    );
    res.status(403).send("Forbidden");
    return;
  }

  next();
}
