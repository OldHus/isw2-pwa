import { useAppSelector } from "../../store/hooks";
import { UserRole } from "../../store/slices/sessionSlice";
import { StudentGradesScreen } from "./student/StudentGradesScreen";
import { TeacherGradesScreen } from "./teacher/TeacherGradesScreen";

export function GradesScreen() {
  const role = useAppSelector((state) => state.session.role);

  if (role === UserRole.TEACHER) {
    return <TeacherGradesScreen />;
  }
  return <StudentGradesScreen />;
}