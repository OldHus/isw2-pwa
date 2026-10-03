import type { AppResult } from "../model/Result";
import type { GradeError, GradeItem, StudentGrades } from "../model/GradeModels";

export interface GradeRepository {
  getGradeItems(courseId: string): Promise<AppResult<GradeItem[], GradeError>>;
  addGradeItem(
    courseId: string,
    name: string,
    weight: number,
    type: string
  ): Promise<AppResult<GradeItem, GradeError>>;

  updateGradeItem(
    courseId: string,
    itemId: string,
    name: string
  ): Promise<AppResult<void, GradeError>>;
  deleteGradeItem(courseId: string, itemId: string): Promise<AppResult<void, GradeError>>;

  getMyGrades(courseId: string): Promise<AppResult<StudentGrades, GradeError>>;
  getStudentGrades(courseId: string, studentUid: string): Promise<AppResult<StudentGrades, GradeError>>;
  setStudentGrade(
    courseId: string,
    studentUid: string,
    itemId: string,
    grade: number
  ): Promise<AppResult<void, GradeError>>;
  deleteStudentGrade(
    courseId: string,
    studentUid: string,
    itemId: string
  ): Promise<AppResult<void, GradeError>>;

  getAllStudentsGrades(courseId: string): Promise<AppResult<Record<string, StudentGrades>, GradeError>>;
}