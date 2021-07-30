import Sync from "twilio-sync";
import { makeUrl, toArray } from "Utilities";
import type { Log } from "./logs";
import { setLog } from "./logs";
import type { SMS } from "./messages";
import { setMessages } from "./messages";
import type { AppStore } from "./store";

export async function startSync({ dispatch }: AppStore) {
  const sync = await initSync();

  const stream = await sync.stream("Message-Events");
  stream.on("messagePublished", ({ message }: { message: Message }) => {
    switch (message.data.type) {
      case "log":
        dispatch(setLog(message.data.event as Log));
        break;

      case "sms":
        dispatch(
          setMessages(
            toArray(message.data.event as InboundSMS).map(translateSms)
          )
        );
        break;

      default:
    }
  });
}

function translateSms(sms: InboundSMS): SMS {
  return {
    body: sms.Body,
    direction: "inbound",
    from: sms.From,
    sid: sms.SmsSid,
    status: sms.SmsStatus,
    to: sms.To,
  };
}

interface Message {
  data: {
    event: Log | InboundSMS;
    type: "log" | "sms";
  };
}

interface InboundSMS {
  AccountSid: string;
  ApiVersion: Date;
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

function initSync(): Promise<Sync> {
  return new Promise(async (resolve, reject) => {
    let token = await fetchToken().catch(reject);
    const sync = new Sync(token as string);

    sync.on("connectionStateChanged", (status) => {
      if (status !== "connected") return;
      console.log("Connected to Twilio Sync Client");
      resolve(sync);
    });

    sync.on("tokenAboutToExpire", async () => {
      token = await fetchToken().catch(console.error);
      sync.updateToken(token as string);
    });

    sync.on("tokenExpired", async () => {
      token = await fetchToken();
      sync.updateToken(token);
    });
  });
}

async function fetchToken() {
  return fetch(makeUrl("app/sync-token", { identity: "main" }))
    .then((res) => res.json())
    .then((data) => data.token as string);
}
