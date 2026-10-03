import { useAppSelector } from "../../store/hooks";
import { UserRole } from "../../store/slices/sessionSlice";
import { TeacherTeamsScreen } from "./teacher/TeacherTeamsScreen";
import { StudentTeamBoardScreen } from "./student/StudentTeamBoardScreen";

export function TeamsScreen() {
  const role = useAppSelector((state) => state.session.role);

  if (role === UserRole.TEACHER) {
    return <TeacherTeamsScreen />;
  }
  return <StudentTeamBoardScreen />;
}