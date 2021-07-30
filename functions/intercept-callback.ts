import * as __ from "@twilio-labs/serverless-runtime-types";
import type { ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";
import twilio from "twilio";

const { ACCOUNT_SID, AUTH_TOKEN, SYNC_SVC_SID } = process.env;
const twlo = twilio(ACCOUNT_SID, AUTH_TOKEN);

export const handler: ServerlessFunctionSignature = async (
  ctx,
  event: Event,
  callback
) => {
  await logEvent(event);
  const res = new Twilio.Response();

  if (/bad word/i.test(event.interactionData)) res.setStatusCode(403);
  callback(null, res);
};

async function logEvent(event: Event) {
  await twlo.sync
    .services(SYNC_SVC_SID)
    .syncStreams("Message-Events")
    .streamMessages.create({
      data: {
        event: { ...event, route: "intercept-callback" },
        type: "log",
      },
    });
}

export interface Event {
  inboundParticipantSid: string;
  inboundResourceSid: string;
  inboundResourceStatus: string;
  inboundResourceType: string;
  inboundResourceUrl: string;
  interactionAccountSid: string;
  interactionData: string;
  interactionDateCreated: Date;
  interactionDateUpdated: Date;
  interactionNumMedia: string;
  interactionServiceSid: string;
  interactionSessionSid: string;
  interactionSid: string;
  interactionType: string;
}
