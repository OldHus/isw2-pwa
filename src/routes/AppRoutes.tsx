import { Routes, Route } from "react-router-dom";
import { Routes as AppRoutePaths } from "./Routes";
import { LoginScreen } from "../presentation/auth/LoginScreen";
import { TeacherHomeScreen } from "../presentation/home/teacher/TeacherHomeScreen";
import { StudentHomeScreen } from "../presentation/home/student/StudentHomeScreen";
import { ProtectedRoute } from "../presentation/session/ProtectedRoute";
import { UserRole } from "../store/slices/sessionSlice";
import { SyllabusScreen } from "../presentation/syllabus/SyllabusScreen";
import { GradesScreen } from "../presentation/grades/GradesScreen";
import { GradesMatrixScreen } from "../presentation/grades/teacher/GradesMatrixScreen";
import { StudentGradeEditScreen } from "../presentation/grades/teacher/StudentGradeEditScreen";
import { CourseCodeScreen } from "../presentation/courseCode/CourseCodeScreen";
import { CourseSettingsScreen } from "../presentation/courseSettings/CourseSettingsScreen";
import { ProfileScreen } from "../presentation/profile/ProfileScreen";
import { TeamsScreen } from "../presentation/teams/TeamsScreen";
import { TeacherTeamBoardScreen } from "../presentation/teams/teacher/TeacherTeamBoardScreen";
import { AttendanceScreen } from "../presentation/attendance/AttendanceScreen";
import { PollScreen } from "../presentation/polls/PollScreen";
import { QuizScreen } from "../presentation/quiz/QuizScreen";
import { PostsScreen } from "../presentation/posts/PostsScreen";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={AppRoutePaths.login} element={<LoginScreen />} />
      <Route
        path={AppRoutePaths.teacherHome}
        element={
          <ProtectedRoute allowedRole={UserRole.TEACHER}>
            <TeacherHomeScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path={AppRoutePaths.studentHome}
        element={
          <ProtectedRoute allowedRole={UserRole.STUDENT}>
            <StudentHomeScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path={AppRoutePaths.syllabus}
        element={
          <ProtectedRoute allowedRole={[UserRole.TEACHER, UserRole.STUDENT]}>
            <SyllabusScreen />
          </ProtectedRoute>
        }
      />

      {/* GradesScreen branches by role internally */}
      <Route
        path={AppRoutePaths.grades}
        element={
          <ProtectedRoute allowedRole={[UserRole.TEACHER, UserRole.STUDENT]}>
            <GradesScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path={AppRoutePaths.gradesMatrix}
        element={
          <ProtectedRoute allowedRole={UserRole.TEACHER}>
            <GradesMatrixScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path={AppRoutePaths.gradesStudentEdit}
        element={
          <ProtectedRoute allowedRole={UserRole.TEACHER}>
            <StudentGradeEditScreen />
          </ProtectedRoute>
        }
      />

      <Route path={AppRoutePaths.courseCode} element={<CourseCodeScreen />} />

      <Route
        path={AppRoutePaths.courseSettings}
        element={
          <ProtectedRoute allowedRole={UserRole.TEACHER}>
            <CourseSettingsScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path={AppRoutePaths.profile}
        element={
          <ProtectedRoute allowedRole={[UserRole.TEACHER, UserRole.STUDENT]}>
            <ProfileScreen />
          </ProtectedRoute>
        }
      />

      {/* TeamsScreen branches by rol internally, 
      same pattern as "grades" — teacher sees the team list */}
      <Route
        path={AppRoutePaths.kanban}
        element={
          <ProtectedRoute allowedRole={[UserRole.TEACHER, UserRole.STUDENT]}>
            <TeamsScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path={AppRoutePaths.teamBoard}
        element={
          <ProtectedRoute allowedRole={UserRole.TEACHER}>
            <TeacherTeamBoardScreen />
          </ProtectedRoute>
        }
      />

      <Route
        path={AppRoutePaths.attendance}
        element={
          <ProtectedRoute allowedRole={[UserRole.TEACHER, UserRole.STUDENT]}>
            <AttendanceScreen />
          </ProtectedRoute>
        }
      />

      <Route
        path={AppRoutePaths.polls}
        element={
          <ProtectedRoute allowedRole={[UserRole.TEACHER, UserRole.STUDENT]}>
            <PollScreen />
          </ProtectedRoute>
        }
      />

      <Route
        path={AppRoutePaths.quiz}
        element={
          <ProtectedRoute allowedRole={[UserRole.TEACHER, UserRole.STUDENT]}>
            <QuizScreen />
          </ProtectedRoute>
        }
      />

      <Route
        path={AppRoutePaths.posts}
        element={
          <ProtectedRoute allowedRole={[UserRole.TEACHER, UserRole.STUDENT]}>
            <PostsScreen />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}