import { AppShell } from "../shell/AppShell";
import { moduleCatalog } from "../shell/moduleCatalog";
import { useHomeViewModel } from "./hooks/useHomeViewModel";
import { FeaturedModuleCard } from "./FeaturedModuleCard";
import { SecondaryModuleRow } from "./SecondaryModuleRow";
import styles from "./HomeScreen.module.scss";

interface HomeScreenProps {
  roleLabel: string;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

export function HomeScreen({ roleLabel }: HomeScreenProps) {
  const { uiState, session, onModuleTapped } = useHomeViewModel();
  const primaryModules = moduleCatalog.filter((mod) => mod.priority === "primary");
  const secondaryModules = moduleCatalog.filter((mod) => mod.priority === "secondary");

  const courseName =
    uiState.status === "success" ? uiState.course.name : uiState.status === "loading" ? "Cargando tu curso..." : null;

  const greetingName = session.name ? firstName(session.name) : "";

  return (
    <AppShell>
      <div className={styles.feed}>
        <header className={styles.greeting}>
          <h1 className={styles.name}>{greetingName ? `Hola, ${greetingName}` : "Hola"}</h1>
          <p className={styles.context}>
            {roleLabel}
            {courseName ? ` · ${courseName}` : ""}
          </p>
          {uiState.status === "error" && (
            <p className={styles.courseError} role="alert">
              {uiState.message}
            </p>
          )}
        </header>

        <section className={styles.primaryGrid} aria-label="Módulos principales">
          {primaryModules.map((mod) => (
            <FeaturedModuleCard key={mod.id} module={mod} onTap={onModuleTapped} />
          ))}
        </section>

        <section aria-label="Otros módulos">
          <div className={styles.secondaryList}>
            {secondaryModules.map((mod) => (
              <SecondaryModuleRow key={mod.id} module={mod} onTap={onModuleTapped} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}