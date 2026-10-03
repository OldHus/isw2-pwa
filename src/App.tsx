import { useSessionBootstrap } from "./presentation/session/hooks/useSessionBootstrap";
import { useForegroundNotifications } from "./presentation/notifications/hooks/useForegroundNotifications";
import { AppRoutes } from "./routes/AppRoutes";
import styles from "./App.module.scss";

export function App() {
  const { isBootstrapping } = useSessionBootstrap();
  useForegroundNotifications();

  if (isBootstrapping) {
    return (
      <div className={styles.bootstrapScreen}>
        <div className={styles.spinner} aria-label="Cargando sesión" role="status" />
      </div>
    );
  }

  return <AppRoutes />;
}