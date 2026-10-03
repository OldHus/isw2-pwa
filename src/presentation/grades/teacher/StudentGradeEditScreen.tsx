import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import { AppShell } from "../../shell/AppShell";
import { useStudentGradeEditViewModel } from "./hooks/useStudentGradeEditViewModel";
import { Avatar } from "../../common/Avatar";
import { FullScreenImageViewer } from "../../posts/shared/FullScreenImageViewer";
import { Routes } from "../../../routes/Routes";
import styles from "./StudentGradeEditScreen.module.scss";

interface ZoomedPhoto {
  url: string;
  originRect: DOMRect | null;
}

export function StudentGradeEditScreen() {
  const { uiState, feedback, saveGrade, deleteGrade } = useStudentGradeEditViewModel();

  const [zoomedPhoto, setZoomedPhoto] = useState<ZoomedPhoto | null>(null);

  return (
    <AppShell>
      <div className={styles.screen}>
        <Link to={Routes.grades} className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden="true" />
          Calificaciones
        </Link>

        <h1 className={styles.title}>Editar calificaciones</h1>

        {uiState.status === "success" && (
          <div className={styles.studentHeader}>
            {uiState.student.photoUrl ? (
              <button
                type="button"
                className={styles.avatarZoomTrigger}
                aria-label={`Ver foto de ${uiState.student.name || uiState.student.email} en grande`}
                onClick={(event) =>
                  setZoomedPhoto({
                    url: uiState.student.photoUrl as string,
                    originRect: event.currentTarget.getBoundingClientRect(),
                  })
                }
              >
                <Avatar
                  photoUrl={uiState.student.photoUrl}
                  role="estudiante"
                  name={uiState.student.name || uiState.student.email}
                  size={72}
                />
              </button>
            ) : (
              <Avatar
                photoUrl={uiState.student.photoUrl}
                role="estudiante"
                name={uiState.student.name || uiState.student.email}
                size={72}
              />
            )}
            <span className={styles.studentHeaderInfo}>
              <span className={styles.studentHeaderName}>
                {uiState.student.name || uiState.student.email}
              </span>
              <span className={styles.studentHeaderEmail}>{uiState.student.email}</span>
            </span>
          </div>
        )}

        {feedback ? (
          <p role="status" aria-live="polite" className={styles.feedback}>
            {feedback}
          </p>
        ) : null}

        {uiState.status === "loading" && (
          <div className={styles.centered}>
            <div className={styles.spinner} aria-label="Cargando calificaciones" role="status" />
          </div>
        )}

        {uiState.status === "error" && (
          <p role="alert" className={styles.errorText}>
            {uiState.message}
          </p>
        )}

        {uiState.status === "success" &&
          (uiState.items.length === 0 ? (
            <p className={styles.emptyState}>Aún no hay ítems de calificación definidos.</p>
          ) : (
            <ul className={styles.list}>
              {uiState.items.map((item) => (
                <GradeEditRow
                  key={item.id}
                  itemName={item.name}
                  initialValue={item.id in uiState.grades ? String(uiState.grades[item.id]) : ""}
                  hasGrade={item.id in uiState.grades}
                  onSave={(value) => saveGrade(item.id, value)}
                  onDelete={() => deleteGrade(item.id)}
                />
              ))}
            </ul>
          ))}
      </div>

      {zoomedPhoto && (
        <FullScreenImageViewer
          imageUrl={zoomedPhoto.url}
          originRect={zoomedPhoto.originRect}
          onDismiss={() => setZoomedPhoto(null)}
        />
      )}
    </AppShell>
  );
}

interface GradeEditRowProps {
  itemName: string;
  initialValue: string;
  hasGrade: boolean;
  onSave: (value: string) => void;
  onDelete: () => void;
}

function GradeEditRow({ itemName, initialValue, hasGrade, onSave, onDelete }: GradeEditRowProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <li className={styles.row}>
      <span className={styles.itemName}>{itemName}</span>
      <div className={styles.rowControls}>
        <input
          type="text"
          inputMode="decimal"
          className={styles.gradeInput}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label={`Nota para ${itemName}`}
          placeholder="0,0"
        />
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => onSave(value)}
          aria-label={`Guardar nota de ${itemName}`}
        >
          <Check size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.iconButtonDanger}
          onClick={onDelete}
          disabled={!hasGrade}
          aria-label={`Eliminar nota de ${itemName}`}
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}