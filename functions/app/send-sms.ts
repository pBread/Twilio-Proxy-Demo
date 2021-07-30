import * as __ from "@twilio-labs/serverless-runtime-types";
import twilio from "twilio";
import type { ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";

const { ACCOUNT_SID, AUTH_TOKEN } = process.env;
const twlo = twilio(ACCOUNT_SID, AUTH_TOKEN);

export const handler: ServerlessFunctionSignature = async (
  ctx,
  { body, from, to }: { body: string; from: string; to: string },
  callback
) => {
  const result = await twlo.messages.create({
    body,
    from: to10DLC(from),
    to: to10DLC(to),
  });

  return callback(null, makeRes(result));
};

/****************************************************
 Helpers
****************************************************/
function to10DLC(phone: string) {
  const { area, prefix, line } = phone.match(
    /^\s*(?:\+?(?<country>\d{1,3}))?[-. (]*(?<area>\d{3})[-. )]*(?<prefix>\d{3})[-. ]*(?<line>\d{4})(?: *x(\d+))?\s*$/
  ).groups;

  return `+${1}${area}${prefix}${line}`;
}

/****************************************************
 Demo-Only Helpers: not required for production
****************************************************/
function makeRes(payload: any) {
  const res = new Twilio.Response();
  res.appendHeader("Content-Type", "application/json");
  res.setBody(payload);

  res.appendHeader("Access-Control-Allow-Origin", "*");
  res.appendHeader("Access-Control-Allow-Methods", "GET,POST, OPTIONS");
  res.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  return res;
}
