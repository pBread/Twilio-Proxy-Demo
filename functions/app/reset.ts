import * as __ from "@twilio-labs/serverless-runtime-types";
import twilio from "twilio";
import type { ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";

const { ACCOUNT_SID, AUTH_TOKEN, SYNC_MAP_NAME, SYNC_SVC_SID } = process.env;
const twlo = twilio(ACCOUNT_SID, AUTH_TOKEN);
const sync = twlo.sync.services(SYNC_SVC_SID);

export const handler: ServerlessFunctionSignature = async (
  ctx,
  event,
  callback
) => {
  const results = await Promise.all([
    clearSyncMap(),
    clearProxy(),
    clearAbuseMap(),
  ]);

  return callback(null, makeRes(results.flat()));
};

async function clearSyncMap() {
  const items = await sync.syncMaps(SYNC_MAP_NAME).syncMapItems.list();
  await Promise.all(items.map((item) => item.remove()));
  return `syncMapItems cleared from ${SYNC_MAP_NAME}: ${items.length}`;
}

async function clearAbuseMap() {
  try {
    const items = await sync.syncMaps("DetectAbuse").syncMapItems.list();
    await Promise.all(items.map((item) => item.remove()));
    return `syncMapItems cleared from ${SYNC_MAP_NAME}: ${items.length}`;
  } catch (error) {
    return `Error clearing AbuseMap: ${error}`;
  }
}

async function clearProxy() {
  const services = await twlo.proxy.services
    .list()
    .then((services) =>
      services.sort((a, b) => (a.dateCreated < b.dateCreated ? -1 : 1))
    );

  const sessions = await Promise.all(
    services.map((svc) => twlo.proxy.services(svc.sid).sessions.list())
  ).then((results) => results.flat());
  await Promise.all(sessions.map((session) => session.remove()));

  const servicesToDelete = services.slice(1);

  const phonesToRelease = await twlo.api.incomingPhoneNumbers
    .list()
    .then((phones) =>
      phones.filter((phone) =>
        servicesToDelete.some(
          (service) =>
            phone.smsUrl.includes(service.sid) ||
            phone.voiceUrl.includes(service.sid)
        )
      )
    );

  await Promise.all(
    phonesToRelease.map((phone) => phone.update({ smsUrl: "", voiceUrl: "" }))
  );

  await Promise.all(servicesToDelete.map((service) => service.remove()));

  return [
    `Proxy services deleted: ${services.length - 1}`,
    `Proxy sessions deleted: ${sessions.length}`,
    `Phone numbers unassigned: ${phonesToRelease.length}`,
  ];
}

/****************************************************
 Demo-Only Helpers: not required for production
****************************************************/
function makeRes(results: any) {
  const res = new Twilio.Response();
  res.appendHeader("Content-Type", "application/json");
  res.setBody(results);

  res.appendHeader("Access-Control-Allow-Origin", "*");
  res.appendHeader("Access-Control-Allow-Methods", "GET,POST, OPTIONS");
  res.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  return res;
}
