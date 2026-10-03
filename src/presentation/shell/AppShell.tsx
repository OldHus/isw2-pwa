import { useEffect, useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearSession } from "../../store/slices/sessionSlice";
import { Routes as AppRoutePaths } from "../../routes/Routes";
import { container } from "../../di/container";
import { useNotificationCenter } from "../notifications/hooks/useNotificationCenter";
import { NotificationToastStack } from "../notifications/NotificationToastStack";
import { ROUTE_BY_TYPE } from "../notifications/routeByType";
import type { ActivityItem } from "../../domain/model/ActivityFeedModels";
import { ModuleNavList } from "./ModuleNavList";
import styles from "./AppShell.module.scss";

const SIDEBAR_COLLAPSED_KEY = "sidebarCollapsed";

function readStoredCollapsedState(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const session = useAppSelector((state) => state.session);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notificationCenter = useNotificationCenter();

  useEffect(() => {
    setIsSidebarCollapsed(readStoredCollapsedState());
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // localStorage no available
      }
      return next;
    });
  };

  const onSignOut = async () => {
    container.analyticsReporter.logEvent("sign_out", {});
    await container.signOutUseCase.execute();
    dispatch(clearSession());
    navigate(AppRoutePaths.login, { replace: true });
  };

  const onToastClick = (item: ActivityItem) => {
    notificationCenter.markRead(item.id);
    notificationCenter.dismissToast(item.id);
    navigate(ROUTE_BY_TYPE[item.type]);
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <button
          className={styles.menuButton}
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={isDrawerOpen}
        >
          <span className={styles.menuIcon} />
        </button>
        <span className={styles.brand}>UNAL · IngeSoft II</span>
      </header>

      <aside
        className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ""}`}
        aria-label="Navegación principal"
      >
        <div className={styles.sidebarHeader}>
          <button className={styles.collapseButton} onClick={toggleSidebar} aria-label="Ocultar menú">
            <PanelLeftClose size={18} />
          </button>
        </div>
        <ModuleNavList session={session} onSignOut={onSignOut} notificationCenter={notificationCenter} />
      </aside>

      {isSidebarCollapsed && (
        <button className={styles.expandButton} onClick={toggleSidebar} aria-label="Mostrar menú">
          <PanelLeftOpen size={18} />
        </button>
      )}

      {isDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div
            className={styles.drawer}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <button className={styles.closeButton} onClick={() => setIsDrawerOpen(false)} aria-label="Cerrar menú">
              ×
            </button>
            <ModuleNavList
              session={session}
              onSignOut={onSignOut}
              onNavigate={() => setIsDrawerOpen(false)}
              notificationCenter={notificationCenter}
            />
          </div>
        </div>
      )}

      <main className={`${styles.content} ${isSidebarCollapsed ? styles.contentFull : ""}`}>{children}</main>

      <NotificationToastStack
        toasts={notificationCenter.toasts}
        onDismiss={notificationCenter.dismissToast}
        onToastClick={onToastClick}
      />
    </div>
  );
}