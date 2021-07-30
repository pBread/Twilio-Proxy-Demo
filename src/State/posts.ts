import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { makeUrl, to10DLC } from "Utilities";
import { v4 } from "uuid";

/****************************************************
 Async
****************************************************/
export const fetchReservedNumber = createAsyncThunk(
  "fetchReservedNumber",
  async (query: FetchReservedNumber) =>
    (await fetch(
      makeUrl("get-reserved-number", {
        petOwnerName: query.petOwnerName,
        petOwnerNumber: to10DLC(query.petOwnerNumber),
        postId: query.id,
      })
    ).then((res) => res.json())) as Promise<{
      postId: string;
      reservedNumber: string;
    }>
);

/****************************************************
 Slice
****************************************************/
const initialState: { entities: { [key: string]: Post } } = { entities: {} };

export const postSlice = createSlice({
  initialState,
  name: "posts",
  extraReducers: (builder) => {
    builder.addCase(fetchReservedNumber.fulfilled, (state, { payload }) => {
      state.entities[payload.postId].reservedNumber = payload.reservedNumber;
    });
  },
  reducers: {
    createPost: (state) => {
      const id = v4();
      state.entities[id] = {
        body: "",
        id: id || v4(),
        isSaved: false,
        petOwnerName: "",
        petOwnerNumber: "",
        reservedNumber: null,
        title: `Post ${Object.keys(state.entities).length + 1}`,
      };
    },

    removePost: (state, { payload }: { payload: string }) => {
      delete state.entities[payload];
    },

    updatePost: (state, { payload }) => {
      state.entities[payload.id] = {
        ...state.entities[payload.id],
        ...payload,
      };
    },
  },
});

/****************************************************
 Actions
****************************************************/
export const { createPost, removePost, updatePost } = postSlice.actions;

/****************************************************
 Types
****************************************************/
interface Post {
  body: string;
  id: string;
  isSaved: boolean;
  title: string;
  petOwnerName: string;
  petOwnerNumber: string;
  reservedNumber: string;
}

interface FetchReservedNumber {
  petOwnerName: string;
  petOwnerNumber: string;
  id: string;
}
