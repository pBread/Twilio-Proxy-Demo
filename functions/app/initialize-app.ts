import * as __ from "@twilio-labs/serverless-runtime-types";
import type { ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";
import twilio from "twilio";

const { ACCOUNT_SID, AUTH_TOKEN, PROXY_SVC_SID } = process.env;
const twlo = twilio(ACCOUNT_SID, AUTH_TOKEN);

export const handler: ServerlessFunctionSignature = async (
  ctx,
  event,
  callback
) => {
  const [proxyPhones, accountPhones] = await Promise.all([
    twlo.proxy
      .services(PROXY_SVC_SID)
      .phoneNumbers.list()
      .then((phones) => phones.map(({ phoneNumber }) => phoneNumber)),

    twlo.incomingPhoneNumbers
      .list()
      .then((phones) => phones.map(({ phoneNumber }) => phoneNumber)),
  ]);

  return callback(null, makeRes({ accountPhones, proxyPhones }));
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
