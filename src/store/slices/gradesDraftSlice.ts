import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface GradesDraftState {
  pending: Record<string, Record<string, number | null>>;
}

const initialState: GradesDraftState = {
  pending: {},
};

interface StageStudentGradesPayload {
  studentUid: string;
  grades: Record<string, number | null>;
}

interface RemoveStudentPayload {
  studentUid: string;
}

const gradesDraftSlice = createSlice({
  name: "gradesDraft",
  initialState,
  reducers: {
    stageStudentGrades: (state, action: PayloadAction<StageStudentGradesPayload>) => {
      const { studentUid, grades } = action.payload;
      const current = state.pending[studentUid] ?? {};
      const next = { ...current, ...grades };
      for (const [itemId, grade] of Object.entries(grades)) {
        if (grade === undefined) {
          delete next[itemId];
        }
      }
      if (Object.keys(next).length === 0) {
        delete state.pending[studentUid];
      } else {
        state.pending[studentUid] = next;
      }
    },
    removeStudent: (state, action: PayloadAction<RemoveStudentPayload>) => {
      delete state.pending[action.payload.studentUid];
    },
    clearAllDrafts: (state) => {
      state.pending = {};
    },
  },
});

export const { stageStudentGrades, removeStudent, clearAllDrafts } = gradesDraftSlice.actions;
export default gradesDraftSlice.reducer;
