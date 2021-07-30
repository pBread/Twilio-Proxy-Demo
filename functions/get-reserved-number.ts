import * as __ from "@twilio-labs/serverless-runtime-types";
import twilio from "twilio";
import type { ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";
import type { PhoneNumberInstance } from "twilio/lib/rest/proxy/v1/service/phoneNumber";
import type { SessionInstance } from "twilio/lib/rest/proxy/v1/service/session";

const twlo = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

export const handler: ServerlessFunctionSignature = async (
  ctx,
  event: Event,
  callback
) => {
  await logEvent(event); // for ui

  const cache = new Map() as Cache;
  const _event = cleanParams(event);

  // check if a reserved number exists for this post
  const curReservedNumber = await getCurrentReservedNumber(_event, cache);

  if (curReservedNumber)
    return callback(null, makeRes(_event, curReservedNumber));

  const { reservedNumber, svcSid } = await getOrMakeServiceAndPhone(
    _event,
    cache
  );

  const sessionSid = await createInitialSession(_event, {
    reservedNumber,
    svcSid,
  });

  // Proxy's out-of-session callback is executed whenever someone
  // calls the reserved number. It will need to be able to lookup the
  // postId by the reserved number.
  await twlo.sync
    .services(process.env.SYNC_SVC_SID)
    .syncMaps(process.env.SYNC_MAP_NAME)
    .syncMapItems.create({
      key: reservedNumber,
      data: { ..._event, reservedNumber, sessionSid, svcSid },
    });

  return callback(null, makeRes(_event, reservedNumber));
};

/****************************************************
 Checks if reserved number exists for this post
****************************************************/
function getCurrentReservedNumber(
  { petOwnerNumber, postId }: Event,
  cache: Cache
): Promise<string> {
  return new Promise(async (resolve) => {
    const svcs = await twlo.proxy.services.list();

    // serviceIds will be needed to find a reserved number if no sessions exist
    cache.set(
      "svcSids",
      svcs
        // Tip: Sort services in ascending order so new sessions are created against
        // the oldest service. This ensures the sessions in newer services are expired
        // first which simplifies phone number deprovisioning.
        .sort((a, b) => (a.dateCreated < b.dateCreated ? -1 : 1))
        .map(({ sid }) => sid)
    );

    // there will be 1 service for every 5,000 active posts
    for (const svc of svcs) {
      let sess: SessionInstance;
      try {
        sess = await twlo.proxy.services(svc.sid).sessions(postId).fetch();
      } catch {
        continue;
      }

      const ptps = await twlo.proxy
        .services(svc.sid)
        .sessions(sess.sid)
        .participants.list();

      // proxyIdentifier for pet owners is always the post's reserved number
      const reservedNumber = ptps.find(
        (ptp) => ptp.identifier === petOwnerNumber
      ).proxyIdentifier;

      resolve(reservedNumber);
      break;
    }

    resolve(null);
  });
}

/****************************************************
 Creates Placeholder Session
****************************************************/
async function createInitialSession(
  { petOwnerName, petOwnerNumber, postId }: Event,
  { reservedNumber, svcSid }: { reservedNumber: string; svcSid: string }
) {
  const session = await twlo.proxy.services(svcSid).sessions.create({
    // use the postId for uniqueName so you can find this session later
    uniqueName: postId,
  });

  await twlo.proxy.services(svcSid).sessions(session.sid).participants.create({
    friendlyName: petOwnerName,
    identifier: petOwnerNumber,
    proxyIdentifier: reservedNumber,
  });

  return session.sid;
}

/****************************************************
 Orchestrates the Reserve Number Process
 - If any service has capacity, return reserved from existing
 - Else try adding more phone numbers to the most recent service
 - Else create a new service & add phones
****************************************************/
async function getOrMakeServiceAndPhone(
  event: Event,
  cache: Cache
): Promise<{ reservedNumber: string; svcSid: string }> {
  // get an available service & reserve phone
  let svcPhone = await getServiceWithCapacity(event, cache);

  if (!svcPhone) {
    const lastSvcSid = cache.get("svcSids")[cache.get("svcSids").length - 1];
    // try adding more reserved numbers to an existing service
    const newReserved = await addPhones(lastSvcSid, "reserved");

    if (newReserved)
      svcPhone = {
        reservedNumber: newReserved[0].phoneNumber,
        svcSid: lastSvcSid,
      };
    // create a new service is all services are at capacity
    else svcPhone = await createService(cache);
  }

  return svcPhone;
}

// returns the oldest existing service with reserve number capacity
function getServiceWithCapacity(
  event: Event,
  cache: Cache
): Promise<{ svcSid: string; reservedNumber: string }> {
  return new Promise(async (resolve) => {
    for (const svcSid of cache.get("svcSids")) {
      const allPhones = await twlo.proxy.services(svcSid).phoneNumbers.list();

      const reservedNumber = allPhones.find(
        ({ isReserved, inUse }) => isReserved && inUse === 0
      )?.phoneNumber;
      if (!reservedNumber) continue;

      resolve({ svcSid, reservedNumber });
      break;
    }

    resolve(null);
  });
}

async function addPhones(
  serviceId: string,
  type: "reserved" | "dynamic",
  count: number = 1
): Promise<PhoneNumberInstance[]> {
  const isReserved = type === "reserved";
  const max = isReserved
    ? parseInt(process.env.PROXY_RESERVE_MAX || "5000")
    : parseInt(process.env.PROXY_DYNAMIC_MAX || "500");

  const allPhones = await twlo.proxy.services(serviceId).phoneNumbers.list();
  const curCount = allPhones.filter((phone) =>
    isReserved ? phone.isReserved : !phone.isReserved
  ).length;

  const capacity = max - curCount;
  if (capacity >= 0) return null;

  const [availablePhones, existingPhones] = await Promise.all([
    // get unused phone numbers
    await twlo.api.incomingPhoneNumbers
      .list({})
      .then((phones) =>
        phones.filter(
          (phone) => !phone.smsUrl?.length && !phone.voiceUrl?.length
        )
      ),
    // get phone numbers available to purchase
    twlo.api.availablePhoneNumbers("US").local.list({
      limit: Math.min(count, capacity),
    }),
  ]);

  const incomingPhones = await Promise.all(
    [...existingPhones, ...availablePhones]
      .slice(0, Math.min(count, capacity))
      .map((phone) =>
        twlo.api.incomingPhoneNumbers.create({
          phoneNumber: phone.phoneNumber,
        })
      )
  );

  return await Promise.all(
    incomingPhones.map((phone) =>
      twlo.proxy
        .services(serviceId)
        .phoneNumbers.create({ isReserved, sid: phone.sid })
    )
  );
}

async function createService(cache: Cache): Promise<{
  svcSid: string;
  reservedNumber: string;
}> {
  const svcSids = cache.get("svcSids");
  const lastSvcSid = svcSids[svcSids.length - 1];
  // using a previous service as a template
  const template = await twlo.proxy.services(lastSvcSid).fetch();
  const {
    callbackUrl,
    chatInstanceSid,
    defaultTtl,
    interceptCallbackUrl,
    numberSelectionBehavior,
    outOfSessionCallbackUrl,
  } = template;

  // unique name is incremented, e.g. Proxy Svc 1, Proxy Svc 2, etc.
  const uniqueName = template.uniqueName.replace(
    /\d+$/,
    `${svcSids.length + 1}`
  );

  const service = await twlo.proxy.services.create({
    callbackUrl,
    chatInstanceSid,
    defaultTtl,
    interceptCallbackUrl,
    numberSelectionBehavior,
    outOfSessionCallbackUrl,
    uniqueName,
  });

  const [reserved] = await Promise.all([
    addPhones(service.sid, "reserved", 1),
    addPhones(service.sid, "dynamic", 3),
  ]);

  return { reservedNumber: reserved[0].phoneNumber, svcSid: service.sid };
}

/****************************************************
 Types
****************************************************/
interface Event {
  petOwnerName: string;
  petOwnerNumber: string;
  postId: string;
}

type Cache = Map<"svcSids", string[]>;

/****************************************************
 Helpers
****************************************************/
function cleanParams(event: Event) {
  return { ...event, petOwnerNumber: to10DLC(event.petOwnerNumber) };
}

function to10DLC(phone: string) {
  const { area, prefix, line } = phone.match(
    /^\s*(?:\+?(?<country>\d{1,3}))?[-. (]*(?<area>\d{3})[-. )]*(?<prefix>\d{3})[-. ]*(?<line>\d{4})(?: *x(\d+))?\s*$/
  ).groups;

  return `+${1}${area}${prefix}${line}`;
}

/****************************************************
 Demo-Only Helpers: not required for production
****************************************************/
function makeRes(event: Event, reservedNumber: string) {
  const res = new Twilio.Response();
  res.appendHeader("Content-Type", "application/json");
  res.setBody({ postId: event.postId, reservedNumber });

  res.appendHeader("Access-Control-Allow-Origin", "*");
  res.appendHeader("Access-Control-Allow-Methods", "GET,POST, OPTIONS");
  res.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  return res;
}

async function logEvent(event: Event) {
  await twlo.sync
    .services(process.env.SYNC_SVC_SID)
    .syncStreams("Message-Events")
    .streamMessages.create({
      data: { event: { ...event, route: "get-reserved-number" }, type: "log" },
    });
}
