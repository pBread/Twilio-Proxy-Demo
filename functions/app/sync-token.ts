import * as __ from "@twilio-labs/serverless-runtime-types";
import type { ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";

const { ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, SYNC_SVC_SID } =
  process.env;

export const handler: ServerlessFunctionSignature = async (
  ctx,
  event: { identity: string },
  callback
) => {
  const AccessToken = Twilio.jwt.AccessToken;
  const SyncGrant = AccessToken.SyncGrant;

  const token = new AccessToken(ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET);
  token.identity = event.identity;
  token.addGrant(new SyncGrant({ serviceSid: SYNC_SVC_SID || "default" }));

  return callback(null, makeRes({ token: token.toJwt() }));
};

function makeRes(payload: any) {
  const res = new Twilio.Response();
  res.appendHeader("Content-Type", "application/json");
  res.setBody(payload);

  res.appendHeader("Access-Control-Allow-Origin", "*");
  res.appendHeader("Access-Control-Allow-Methods", "GET,POST, OPTIONS");
  res.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  return res;
}
