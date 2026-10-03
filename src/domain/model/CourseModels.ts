export interface Course {
  id: string;
  name: string;
  accessCode: string;
  teacherUid: string;
  syllabusPdfPath: string;
}

export type CourseError = { type: "notFound" } | { type: "unknown"; message: string };

export interface CourseStudent {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
}