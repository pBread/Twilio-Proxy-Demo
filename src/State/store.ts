import { combineReducers, configureStore } from "@reduxjs/toolkit";
import logger from "redux-logger";
import { isDev } from "Utilities";
import { messagesSlice } from "./messages";
import { postSlice, updatePost } from "./posts";
import { startSync } from "./sync";
import { createSelectorHook, useDispatch as useDispatchRR } from "react-redux";
import { logSlice } from "./logs";

const preloadedState = localStorage.getItem("state")
  ? JSON.parse(localStorage.getItem("state"))
  : {};

const reducer = combineReducers({
  [messagesSlice.name]: messagesSlice.reducer,
  [postSlice.name]: postSlice.reducer,
  [logSlice.name]: logSlice.reducer,
});

export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    isDev ? getDefaultMiddleware().concat(logger) : getDefaultMiddleware(),
  preloadedState,
  reducer,
});

store.subscribe(() => {
  localStorage.setItem("state", JSON.stringify(store.getState()));
});

for (const id of Object.keys(store.getState().posts.entities))
  store.dispatch(updatePost({ id, reservedNumber: null }));

startSync(store);

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
export type AppStore = typeof store;
export const useDispatch = () => useDispatchRR<AppDispatch>();
export const useSelector = createSelectorHook<AppState>();
