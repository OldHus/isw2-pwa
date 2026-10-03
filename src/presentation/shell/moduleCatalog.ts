import {
  GraduationCap,
  KanbanSquare,
  MessageSquareText,
  FileText,
  QrCode,
  BadgeCheck,
  Vote,
  Trophy,
  Bell,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

import { Routes } from "../../routes/Routes";
import { UserRole } from "../../store/slices/sessionSlice";

export interface ModuleDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string | null;
  priority: "primary" | "secondary";
  roles?: (typeof UserRole)[keyof typeof UserRole][];
}

export const moduleCatalog: ModuleDefinition[] = [
  { id: "grades", label: "Calificaciones", icon: GraduationCap, route: Routes.grades, priority: "primary" },
  { id: "kanban", label: "Proyecto de aula", icon: KanbanSquare, route: Routes.kanban, priority: "primary" },
  { id: "wall", label: "Muro", icon: MessageSquareText, route: Routes.posts, priority: "primary" },
  { id: "syllabus", label: "Syllabus", icon: FileText, route: Routes.syllabus, priority: "secondary" },
  { id: "attendance", label: "Asistencia", icon: QrCode, route: Routes.attendance, priority: "secondary" },
  {
    id: "registrationCode",
    label: "Código de registro",
    icon: BadgeCheck,
    route: Routes.courseSettings,
    priority: "secondary",
    roles: [UserRole.TEACHER],
  },
  { id: "survey", label: "Encuestas", icon: Vote, route: Routes.polls, priority: "secondary" },
  { id: "quiz", label: "Quiz", icon: Trophy, route: Routes.quiz, priority: "secondary" },
  { id: "notifications", label: "Notificaciones", icon: Bell, route: null, priority: "secondary" },
  { id: "profile", label: "Mi perfil", icon: UserCircle, route: Routes.profile, priority: "secondary" },
];