import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { Routes as AppRoutePaths } from "../../routes/Routes";
import { UserRole } from "../../store/slices/sessionSlice";

type Role = (typeof UserRole)[keyof typeof UserRole];

interface ProtectedRouteProps {
  allowedRole: Role | Role[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRole, children }: ProtectedRouteProps) {
  const session = useAppSelector((state) => state.session);

  if (!session.uid || !session.role) {
    return <Navigate to={AppRoutePaths.login} replace />;
  }

  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

  if (!allowedRoles.includes(session.role)) {
    const fallback = session.role === UserRole.TEACHER ? AppRoutePaths.teacherHome : AppRoutePaths.studentHome;
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}