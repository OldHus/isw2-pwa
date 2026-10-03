import { AppShell } from "../shell/AppShell";
import { useAppSelector } from "../../store/hooks";
import { UserRole } from "../../store/slices/sessionSlice";
import { TeacherQuizScreen } from "./teacher/TeacherQuizScreen";
import { StudentQuizScreen } from "./student/StudentQuizScreen";
import styles from "./QuizScreen.module.scss";

export function QuizScreen() {
  const role = useAppSelector((state) => state.session.role);
  const courseId = useAppSelector((state) => state.session.courseId);

  return (
    <AppShell>
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1 className={styles.title}>Quiz</h1>
          <p className={styles.subtitle}>
            {role === UserRole.TEACHER
              ? "Administra tu banco de preguntas y lanza una en vivo"
              : "Responde la pregunta activa de tu curso"}
          </p>
        </header>

        {courseId &&
          (role === UserRole.TEACHER ? (
            <TeacherQuizScreen courseId={courseId} />
          ) : (
            <StudentQuizScreen courseId={courseId} />
          ))}
      </div>
    </AppShell>
  );
}