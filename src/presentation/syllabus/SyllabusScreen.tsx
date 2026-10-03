import { AppShell } from "../shell/AppShell";
import { useSyllabusViewModel } from "./hooks/useSyllabusViewModel";
import { PdfViewer } from "./PdfViewer";
import styles from "./SyllabusScreen.module.scss";

export function SyllabusScreen() {
  const { uiState, onDownload } = useSyllabusViewModel();

  return (
    <AppShell>
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1 className={styles.title}>Syllabus</h1>
          <p className={styles.subtitle}>Programa del curso en formato PDF</p>
        </header>

        {uiState.status === "loading" && <p className={styles.stateText}>Cargando el syllabus…</p>}

        {uiState.status === "notAvailable" && (
          <p className={styles.stateText}>El docente aún no ha subido el syllabus para este curso.</p>
        )}

        {uiState.status === "error" && (
          <p className={styles.stateTextError} role="alert">
            {uiState.message}
          </p>
        )}

        {uiState.status === "success" && <PdfViewer url={uiState.url} onDownload={onDownload} />}
      </div>
    </AppShell>
  );
}