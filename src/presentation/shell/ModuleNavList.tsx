import { Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { moduleCatalog } from "./moduleCatalog";
import { Routes } from "../../routes/Routes";
import { UserRole } from "../../store/slices/sessionSlice";
import { ThemeToggleButton } from "../theme/ThemeToggleButton";
import { Avatar } from "../common/Avatar";
import styles from "./ModuleNavList.module.scss";
import { NotificationNavItem } from "../notifications/NotificationNavItem";
import type { NotificationCenter } from "../notifications/hooks/useNotificationCenter";

interface SessionLike {
  name: string | null;
  role: string | null;
  photoUrl: string | null;
}

interface ModuleNavListProps {
  session: SessionLike;
  onSignOut: () => void;
  onNavigate?: () => void;
  notificationCenter: NotificationCenter;
}

export function ModuleNavList({ session, onSignOut, onNavigate, notificationCenter }: ModuleNavListProps) {
  const location = useLocation();
  const homeRoute = session.role === UserRole.TEACHER ? Routes.teacherHome : Routes.studentHome;
  const visibleModules = moduleCatalog.filter((mod) => !mod.roles || mod.roles.includes(session.role as any));

  return (
    <div className={styles.list}>
      <div className={styles.header}>
        <div className={styles.userBlock}>
          <Avatar photoUrl={session.photoUrl} role={session.role} name={session.name} size={40} />
          <div>
            <p className={styles.userName}>{session.name ?? "Cargando..."}</p>
            <p className={styles.userRole}>{session.role === "docente" ? "Docente" : "Estudiante"}</p>
          </div>
        </div>
        <ThemeToggleButton />
      </div>

      <nav className={styles.nav}>
        <Link
          to={homeRoute}
          className={`${styles.navItem} ${location.pathname === homeRoute ? styles.navItemActive : ""}`}
          onClick={onNavigate}
        >
          <Home className={styles.navIcon} aria-hidden="true" />
          Inicio
        </Link>

        {visibleModules.map((mod) => {
          const Icon = mod.icon;

          if (mod.id === "notifications") {
            return (
              <NotificationNavItem
                key={mod.id}
                notificationCenter={notificationCenter}
                navItemClassName={styles.navItem}
                navIconClassName={styles.navIcon}
                onAfterNavigate={onNavigate}
              />
            );
          }

          const implemented = mod.route !== null;

          if (!implemented) {
            return (
              <span key={mod.id} className={`${styles.navItem} ${styles.disabled}`} aria-disabled="true">
                <Icon className={styles.navIcon} aria-hidden="true" />
                {mod.label}
              </span>
            );
          }

          return (
            <Link
              key={mod.id}
              to={mod.route!}
              className={`${styles.navItem} ${location.pathname === mod.route ? styles.navItemActive : ""}`}
              onClick={onNavigate}
            >
              <Icon className={styles.navIcon} aria-hidden="true" />
              {mod.label}
            </Link>
          );
        })}
      </nav>

      <button className={styles.signOutButton} onClick={onSignOut}>
        Cerrar sesión
      </button>
    </div>
  );
}