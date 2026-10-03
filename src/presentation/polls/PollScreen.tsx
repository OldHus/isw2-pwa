import { AppShell } from "../shell/AppShell";
import { useAppSelector } from "../../store/hooks";
import { UserRole } from "../../store/slices/sessionSlice";
import { TeacherPollScreen } from "./teacher/TeacherPollScreen";
import { StudentPollScreen } from "./student/StudentPollScreen";
import styles from "./PollScreen.module.scss";

export function PollScreen() {
  const role = useAppSelector((state) => state.session.role);
  const courseId = useAppSelector((state) => state.session.courseId);

  return (
    <AppShell>
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1 className={styles.title}>Encuestas</h1>
          <p className={styles.subtitle}>
            {role === UserRole.TEACHER
              ? "Lanza una encuesta en vivo y observa los resultados en tiempo real"
              : "Vota en la encuesta activa de tu curso"}
          </p>
        </header>

        {courseId &&
          (role === UserRole.TEACHER ? (
            <TeacherPollScreen courseId={courseId} />
          ) : (
            <StudentPollScreen courseId={courseId} />
          ))}
      </div>
    </AppShell>
  );
}