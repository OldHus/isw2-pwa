
export type GradeError =
  | { type: "invalidGrade"; min: number; max: number }
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