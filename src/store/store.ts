import { configureStore } from "@reduxjs/toolkit";
import sessionReducer from "./slices/sessionSlice";
import gradesDraftReducer from "./slices/gradesDraftSlice";

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    gradesDraft: gradesDraftReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;