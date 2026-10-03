import { AppShell } from "../shell/AppShell";
import { useAppSelector } from "../../store/hooks";
import { UserRole } from "../../store/slices/sessionSlice";
import { TeacherAttendanceScreen } from "./teacher/TeacherAttendanceScreen";
import { StudentAttendanceScreen } from "./student/StudentAttendanceScreen";
import styles from "./AttendanceScreen.module.scss";

export function AttendanceScreen() {
  const role = useAppSelector((state) => state.session.role);
  const courseId = useAppSelector((state) => state.session.courseId);

  return (
    <AppShell>
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1 className={styles.title}>Asistencia</h1>
          <p className={styles.subtitle}>
            {role === UserRole.TEACHER
              ? "Activa un código para que tus estudiantes registren su asistencia"
              : "Ingresa el código que dictó tu docente para registrar tu asistencia"}
          </p>
        </header>

        {courseId &&
          (role === UserRole.TEACHER ? (
            <TeacherAttendanceScreen courseId={courseId} />
          ) : (
            <StudentAttendanceScreen courseId={courseId} />
          ))}
      </div>
    </AppShell>
  );
}