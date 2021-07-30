import * as __ from "@twilio-labs/serverless-runtime-types";
import twilio from "twilio";
import type { ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";

const { ACCOUNT_SID, AUTH_TOKEN, SYNC_SVC_SID } = process.env;
const twlo = twilio(ACCOUNT_SID, AUTH_TOKEN);
const sync = twlo.sync.services(SYNC_SVC_SID);

export const handler: ServerlessFunctionSignature = async (
  ctx,
  event,
  callback
) => {
  const results = await sync
    .syncStreams("Message-Events")
    .streamMessages.create({ data: { event, type: "sms" } });

  return callback(null, results);
};
