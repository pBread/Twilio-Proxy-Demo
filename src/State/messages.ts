import { createSlice } from "@reduxjs/toolkit";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { makeUrl, toArray } from "Utilities";
import { AppDispatch, AppState } from "./store";
import { v4 } from "uuid";
import { difference } from "lodash";

/****************************************************
 Slice
****************************************************/
const initialState: {
  accountPhones: string[];
  proxyPhones: string[];
  dialpad: { [key: string]: Dialpad };
  sms: { [key: string]: SMS };
} = {
  accountPhones: [],
  proxyPhones: [],
  dialpad: {},
  sms: {},
};

export const messagesSlice = createSlice({
  initialState,
  name: "messages",
  reducers: {
    createDialpad: (state, { payload }: { payload: CreateDialpad }) => {
      const id = v4();
      state.dialpad[id] = {
        from: payload?.from || "",
        id,
        isSaved: !!payload.isSaved,
        name: `Dialpad ${Object.keys(state.dialpad).length + 1}`,
        to: payload.to || "",
      };
    },

    initApp: (state, { payload }) => {
      state.accountPhones = payload.accountPhones;
      state.proxyPhones = payload.proxyPhones;
    },

    removeDialpad: (state, { payload }: { payload: string }) => {
      delete state.dialpad[payload];
    },

    updateDialpad: (state, { payload }: { payload }) => {
      state.dialpad[payload.id] = { ...state.dialpad[payload.id], ...payload };
    },

    setSms: (state, { payload }: { payload: SMS | SMS[] }) => {
      for (const sms of toArray(payload) as SMS[]) state.sms[sms.sid] = sms;
    },
  },
});

/****************************************************
 Actions
****************************************************/
export const { createDialpad, initApp, removeDialpad, setSms, updateDialpad } =
  messagesSlice.actions;

export function useInitApp() {
  const dispatch = useDispatch();
  useEffect(() => {
    (async () => {
      const data = (await fetch(makeUrl("app/initialize-app")).then((res) =>
        res.json()
      )) as Promise<{ accountPhones: string[]; proxyPhones: string[] }>;
      dispatch(initApp(data));
    })();
  }, [dispatch]);
}

export function setMessages(payload: SMS | SMS[]) {
  return (dispatch: AppDispatch, getState: () => AppState) => {
    const messages = toArray(payload) as SMS[];
    dispatch(setSms(messages));

    const state = getState();

    const dialpads = Object.values(state.messages.dialpad);

    const apiPhones = getApiPhones(state);
    const proxyPhones = state.messages.proxyPhones;

    const inboundMessages = messages.filter(
      (sms) => proxyPhones.includes(sms.from) && apiPhones.includes(sms.to)
    );

    for (const sms of inboundMessages) {
      if (!dialpads.some((dialpad) => evalIn(dialpad, sms)))
        dispatch(createDialpad({ from: sms.to, to: sms.from, isSaved: true }));
    }
  };
}

/****************************************************
 Selectors
****************************************************/

export function getApiPhones(state: AppState) {
  return difference(state.messages.accountPhones, state.messages.proxyPhones);
}

/****************************************************
 Helpers
****************************************************/
export function evalIn(dialpad: Dialpad, sms: SMS) {
  return sms.from === dialpad.to && sms.to === dialpad.from;
}

export function evalOut(dialpad: Dialpad, sms: SMS) {
  return sms.from === dialpad.from && sms.to === dialpad.to;
}

/****************************************************
 Types
****************************************************/
export interface SMS {
  body: string;
  direction: string;
  from: string;
  sid: string;
  status: string;
  to: string;
}

interface CreateDialpad {
  from?: string;
  id?: string;
  isSaved?: boolean;
  name?: string;
  to?: string;
}

export interface Dialpad {
  from: string;
  id: string;
  isSaved: boolean;
  name: string;
  to: string;
}
