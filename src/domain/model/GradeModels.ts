
export const MIN_GRADE = 0;

export type GradeError =
  | { type: "invalidGrade"; min: number }
  | { type: "unknown"; message: string };

export const GradeItemType = {
  FIXED: "fijo",
  DYNAMIC: "dinamico",
} as const;

export type GradeItemTypeValue = (typeof GradeItemType)[keyof typeof GradeItemType];

export interface GradeItem {
  id: string;
  name: string;
  weight: number;
  type: string;
  order: number;
  createdAt: number | null;
}

export interface StudentGrades {
  studentUid: string;
  grades: Record<string, number>;
}

export interface GradeCellUpdate {
  studentUid: string;
  itemId: string;
  grade: number | null;
}