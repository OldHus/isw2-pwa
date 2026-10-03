import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const UserRole = {
  TEACHER: "docente",
  STUDENT: "estudiante",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

interface SessionState {
  uid: string | null;
  role: UserRole | null;
  courseId: string | null;
  name: string | null;
  photoUrl: string | null;
}

const initialState: SessionState = {
  uid: null,
  role: null,
  courseId: null,
  name: null,
  photoUrl: null,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Omit<SessionState, never>>) => {
      state.uid = action.payload.uid;
      state.role = action.payload.role;
      state.courseId = action.payload.courseId;
      state.name = action.payload.name;
      state.photoUrl = action.payload.photoUrl;
    },
    setPhotoUrl: (state, action: PayloadAction<string | null>) => {
      state.photoUrl = action.payload;
    },
    clearSession: () => initialState,
  },
});

export const { setSession, setPhotoUrl, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;