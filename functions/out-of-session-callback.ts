import * as __ from "@twilio-labs/serverless-runtime-types";
import type { ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";
import twilio from "twilio";

const { ACCOUNT_SID, AUTH_TOKEN, SYNC_MAP_NAME, SYNC_SVC_SID } = process.env;
const twlo = twilio(ACCOUNT_SID, AUTH_TOKEN);
const sync = twlo.sync.services(SYNC_SVC_SID);

export const handler: ServerlessFunctionSignature = async (
  ctx,
  event: SmsEvent,
  callback
) => {
  await logEvent(event);

  const post = await sync
    .syncMaps(SYNC_MAP_NAME)
    .syncMapItems(event.To)
    .fetch()
    .then((item) => item.data as Post);

  const isOnlyPetFinder = await evalIsOnlyPetFinder(post);

  // The reservedNumber is always used as the proxyIdentifier pet finders.
  // Tip: Using the reservedNumber as the proxyIdentifier for the pet owner's
  // first pet finder will save you a phone number
  let petOwnerProxyIdentifier: string;
  if (isOnlyPetFinder) {
    petOwnerProxyIdentifier = post.reservedNumber;
    // add pet finder to the initial session created by get-reserved-number
    await twlo.proxy
      .services(post.svcSid)
      .sessions(post.sessionSid)
      .participants.create({
        identifier: event.From,
        proxyIdentifier: petOwnerProxyIdentifier,
      });
  } else {
    // create new session
    const session = await twlo.proxy
      .services(post.svcSid)
      .sessions.create({ uniqueName: `${post.postId}-${event.From}` });

    const petOwner = await twlo.proxy
      .services(post.svcSid)
      .sessions(session.sid)
      .participants.create({
        friendlyName: post.petOwnerName,
        identifier: post.petOwnerNumber,
      });

    petOwnerProxyIdentifier = petOwner.proxyIdentifier;

    await twlo.proxy
      .services(post.svcSid)
      .sessions(session.sid)
      .participants.create({
        identifier: event.From,
        proxyIdentifier: post.reservedNumber,
      });
  }

  // forward the first incoming message to the pet owner
  await twlo.messages.create({
    body: event.Body,
    from: petOwnerProxyIdentifier,
    to: post.petOwnerNumber,
  });
};

async function evalIsOnlyPetFinder(post: Post) {
  const participants = await twlo.proxy
    .services(post.svcSid)
    .sessions(post.sessionSid)
    .participants.list();

  return participants.length === 1;
}

/****************************************************
 Types
****************************************************/
interface Post {
  petOwnerName: string;
  petOwnerNumber: string;
  postId: string;
  reservedNumber: string;
  sessionSid: string;
  svcSid: string;
}

interface SmsEvent {
  AccountSid: string;
  ApiVersion: string;
  Body: string;
  From: string;
  FromCity: string;
  FromCountry: string;
  FromState: string;
  FromZip: string;
  MessageSid: string;
  NumMedia: string;
  NumSegments: string;
  SmsMessageSid: string;
  SmsSid: string;
  SmsStatus: string;
  To: string;
  ToCity: string;
  ToCountry: string;
  ToState: string;
  ToZip: string;
}

/****************************************************
 Demo-Only Helpers: not required for production
****************************************************/
async function logEvent(event: SmsEvent) {
  console.log("out-of-session", event);
  await twlo.sync
    .services(process.env.SYNC_SVC_SID)
    .syncStreams("Message-Events")
    .streamMessages.create({
      data: {
        event: { ...event, route: "out-of-session-callback" },
        type: "log",
      },
    });
}
