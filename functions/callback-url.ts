import * as __ from "@twilio-labs/serverless-runtime-types";
import type { ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";
import twilio from "twilio";

const { ACCOUNT_SID, AUTH_TOKEN } = process.env;
const twlo = twilio(ACCOUNT_SID, AUTH_TOKEN);

export const handler: ServerlessFunctionSignature = async (
  ctx,
  event,
  callback
) => {
  await logEvent(event);
};

async function logEvent(event) {
  await twlo.sync
    .services(process.env.SYNC_SVC_SID)
    .syncStreams("Message-Events")
    .streamMessages.create({
      data: {
        event: { ...event, route: "callback-url" },
        type: "log",
      },
    });
}
