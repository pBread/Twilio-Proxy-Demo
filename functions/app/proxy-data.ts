import * as __ from "@twilio-labs/serverless-runtime-types";
import type {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";
import twilio from "twilio";
import merge from "deepmerge";

const { ACCOUNT_SID, AUTH_TOKEN, SYNC_SVC_SID } = process.env;
const twlo = twilio(ACCOUNT_SID, AUTH_TOKEN);
const sync = twlo.sync.services(SYNC_SVC_SID);

export const handler: ServerlessFunctionSignature = async (
  ctx: Context,
  { postId }: { postId: string },
  callback: ServerlessCallback
) => {
  const services = await twlo.proxy.services
    .list()
    .then((arr) => arr.map((it) => it.toJSON()));
  const results = await Promise.all(
    services.map((service) => populateService(service.sid))
  );

  const allResults = [{ services }, ...results];

  const payload = merge.all(allResults, { arrayMerge });
  return callback(null, makeResponse(payload));
};

async function populateService(serviceId: string) {
  const [sessions, phoneNumbers] = await Promise.all([
    twlo.proxy.services(serviceId).sessions.list(),
    twlo.proxy.services(serviceId).phoneNumbers.list(),
  ]);

  const participants = (
    await Promise.all(
      sessions.map((session) =>
        twlo.proxy.services(serviceId).sessions(session.sid).participants.list()
      )
    )
  ).flat();

  const interactions = (
    await Promise.all(
      sessions.map((session) =>
        twlo.proxy.services(serviceId).sessions(session.sid).interactions.list()
      )
    )
  ).flat();

  return {
    sessions: sessions
      .sort((a, b) => (a.dateCreated > b.dateCreated ? 1 : -1))
      .map((it) => it.toJSON()),
    participants: participants
      .sort((a, b) => (a.dateCreated > b.dateCreated ? 1 : -1))
      .map((it) => it.toJSON()),
    interactions: interactions
      .sort((a, b) => (a.dateCreated > b.dateCreated ? 1 : -1))
      .map((it) => it.toJSON()),
    phoneNumbers: phoneNumbers
      .sort((a, b) => (a.isReserved ? -1 : 1))
      .sort((a, b) => b.inUse - a.inUse)
      .map((it) => it.toJSON()),
  };
}

// not necessary for production; only to overcome CORs in development
function makeResponse(payload: any) {
  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.setBody(payload);

  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.appendHeader("Access-Control-Allow-Methods", "GET,POST, OPTIONS");
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  return response;
}

function arrayMerge(target, source, options) {
  const destination = target.slice();

  source.forEach((item, index) => {
    if (typeof destination[index] === "undefined") {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
    } else if (options.isMergeableObject(item)) {
      destination[index] = merge(target[index], item, options);
    } else if (target.indexOf(item) === -1) {
      destination.push(item);
    }
  });
  return destination;
}
