export const Routes = {
  login: "/",
  teacherHome: "/docente",
  studentHome: "/estudiante",
  syllabus: "/syllabus",
  courseCode: "/codigo-curso",
  courseSettings: "/configuracion-curso",
  profile: "/perfil",

  grades: "/calificaciones",
  gradesMatrix: "/calificaciones/matriz",
  gradesStudentEdit: "/calificaciones/estudiante/:studentUid",

  kanban: "/proyecto-aula",
  teamBoard: "/proyecto-aula/:teamId",

  attendance: "/asistencia",

  polls: "/encuestas",

  quiz: "/quiz",

  posts: "/muro",
} as const;

export function buildGradesStudentEditPath(studentUid: string): string {
  return `/calificaciones/estudiante/${studentUid}`;
}

export function buildTeamBoardPath(teamId: string): string {
  return `/proyecto-aula/${teamId}`;
}