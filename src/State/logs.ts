import { createSlice } from "@reduxjs/toolkit";
import { v4 } from "uuid";

const initialState: {
  entries: Entry[];
  count: number;
} = {
  count: 0,
  entries: [],
};

export const logSlice = createSlice({
  initialState,
  name: "logs",
  reducers: {
    setLog: (state, { payload: log }: { payload: Log }) => {
      state.entries.push({
        id: v4(),
        log,
        route: log.route,
        timestamp: new Date().toLocaleString(),
      });
      state.count++;
    },
  },
});

/****************************************************
 Actions
****************************************************/
export const { setLog } = logSlice.actions;

/****************************************************
 Types
****************************************************/
interface Entry {
  id: string;
  log: Log;
  route: string;
  timestamp: string;
}

export interface Log {
  route: string;
}
