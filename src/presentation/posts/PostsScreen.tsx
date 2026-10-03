import { AppShell } from "../shell/AppShell";
import { useAppSelector } from "../../store/hooks";
import { UserRole } from "../../store/slices/sessionSlice";
import { TeacherPostsScreen } from "./teacher/TeacherPostsScreen";
import { StudentPostsScreen } from "./student/StudentPostsScreen";
import styles from "./PostsScreen.module.scss";

export function PostsScreen() {
  const role = useAppSelector((state) => state.session.role);
  const courseId = useAppSelector((state) => state.session.courseId);

  return (
    <AppShell>
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1 className={styles.title}>Muro del curso</h1>
          <p className={styles.subtitle}>
            {role === UserRole.TEACHER
              ? "Publica anuncios y novedades para tu curso"
              : "Novedades y anuncios de tu profesor"}
          </p>
        </header>

        {courseId &&
          (role === UserRole.TEACHER ? (
            <TeacherPostsScreen courseId={courseId} />
          ) : (
            <StudentPostsScreen courseId={courseId} />
          ))}
      </div>
    </AppShell>
  );
}