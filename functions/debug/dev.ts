import * as __ from "@twilio-labs/serverless-runtime-types";
import twilio from "twilio";
import type { ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";

const { ACCOUNT_SID, AUTH_TOKEN, SYNC_SVC_SID } = process.env;
const twlo = twilio(ACCOUNT_SID, AUTH_TOKEN);
const sync = twlo.sync.services(SYNC_SVC_SID);

interface Event {
  petOwnerName: string;
  petOwnerNumber: string;
  postId: string;
}

type Cache = Map<"svcIds", string[]>;

export const handler: ServerlessFunctionSignature = async (
  ctx,
  event: Event,
  callback
) => {
  const results = await twlo.proxy
    .services("KS6e91b8018717b8f0093bba8f8a5e5ddb")
    .sessions("abc-123")
    .participants.list();

  return callback(null, results);
};
