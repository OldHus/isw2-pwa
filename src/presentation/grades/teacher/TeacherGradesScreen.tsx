import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  GraduationCap,
  Pencil,
  Plus,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "../../shell/AppShell";
import { useTeacherGradesViewModel } from "./hooks/useTeacherGradesViewModel";
import { AddGradeItemDialog } from "./AddGradeItemDialog";
import { Avatar } from "../../common/Avatar";
import { FullScreenImageViewer } from "../../posts/shared/FullScreenImageViewer";
import { Routes, buildGradesStudentEditPath } from "../../../routes/Routes";
import styles from "./TeacherGradesScreen.module.scss";

interface ZoomedPhoto {
  url: string;
  originRect: DOMRect | null;
}

export function TeacherGradesScreen() {
  const {
    uiState,
    feedback,
    addItem,
    renameItem,
    countStudentsGraded,
    deleteItem,
    pending,
    totalPendingCells,
    totalPendingStudents,
    savingPending,
    saveAllPending,
    discardAllPending,
  } = useTeacherGradesViewModel();
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);

  const [zoomedPhoto, setZoomedPhoto] = useState<ZoomedPhoto | null>(null);

  return (
    <AppShell>
      <div className={styles.screen}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <GraduationCap size={28} aria-hidden="true" />
            <h1 className={styles.title}>Calificaciones</h1>
          </div>
          <Link to={Routes.gradesMatrix} className={styles.matrixLink}>
            <Table2 size={18} aria-hidden="true" />
            Ver matriz
          </Link>
        </header>

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

        {uiState.status === "success" && (
          <>
            <section aria-labelledby="grade-items-heading">
              <div className={styles.sectionHeader}>
                <h2 id="grade-items-heading" className={styles.sectionTitle}>
                  Ítems de calificación
                </h2>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => setShowAddItemDialog(true)}
                  aria-label="Agregar ítem de calificación"
                >
                  <Plus size={18} aria-hidden="true" />
                  Agregar
                </button>
              </div>

              {uiState.items.length === 0 ? (
                <p className={styles.emptyState}>Aún no hay ítems definidos.</p>
              ) : (
                <ul className={styles.itemList}>
                  {uiState.items.map((item) => (
                    <GradeItemRow
                      key={item.id}
                      itemName={item.name}
                      onRename={(name) => renameItem(item.id, name)}
                      onCheckDeleteImpact={() => countStudentsGraded(item.id)}
                      onConfirmDelete={() => deleteItem(item.id)}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="students-heading">
              <h2 id="students-heading" className={styles.sectionTitle}>
                Estudiantes
              </h2>

              {totalPendingCells > 0 && (
                <div className={styles.toolbar} role="region" aria-label="Guardar cambios pendientes">
                  <span className={styles.dirtyCount} aria-live="polite">
                    {totalPendingCells === 1
                      ? `1 cambio pendiente en ${totalPendingStudents} estudiante`
                      : `${totalPendingCells} cambios pendientes en ${totalPendingStudents} ${totalPendingStudents === 1 ? "estudiante" : "estudiantes"}`}
                  </span>
                  <div className={styles.toolbarActions}>
                    <button
                      type="button"
                      className={styles.discardButton}
                      onClick={discardAllPending}
                      disabled={savingPending}
                    >
                      Descartar todo
                    </button>
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={saveAllPending}
                      disabled={savingPending}
                    >
                      {savingPending ? "Guardando…" : `Guardar todo (${totalPendingCells})`}
                    </button>
                  </div>
                </div>
              )}

              {uiState.students.length === 0 ? (
                <p className={styles.emptyState}>Aún no hay estudiantes inscritos en este curso.</p>
              ) : (
                <ul className={styles.studentList}>
                  {uiState.students.map((student) => {
                    const pendingCount = Object.keys(pending[student.uid] ?? {}).length;
                    return (
                      <li key={student.uid}>
                        <Link to={buildGradesStudentEditPath(student.uid)} className={styles.studentCard}>
                          <StudentAvatar student={student} onZoom={setZoomedPhoto} />
                          <span className={styles.studentInfo}>
                            <span className={styles.studentNameRow}>
                              <span className={styles.studentName}>{student.name || student.email}</span>
                              {pendingCount > 0 && (
                                <span className={styles.pendingBadge} aria-label={`${pendingCount} cambios pendientes`}>
                                  {pendingCount} pendiente{pendingCount === 1 ? "" : "s"}
                                </span>
                              )}
                            </span>
                            <span className={styles.studentEmail}>{student.email}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {showAddItemDialog ? (
        <AddGradeItemDialog
          onDismiss={() => setShowAddItemDialog(false)}
          onConfirm={(name, type) => {
            addItem(name, type);
            setShowAddItemDialog(false);
          }}
        />
      ) : null}

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

interface StudentAvatarProps {
  student: { photoUrl: string | null; name: string | null; email: string };
  onZoom: (photo: ZoomedPhoto) => void;
}

function StudentAvatar({ student, onZoom }: StudentAvatarProps) {
  const displayName = student.name || student.email;

  if (!student.photoUrl) {
    return <Avatar photoUrl={student.photoUrl} role="estudiante" name={displayName} size={36} />;
  }

  const photoUrl = student.photoUrl;

  function handleZoom(originRect: DOMRect) {
    onZoom({ url: photoUrl, originRect });
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className={styles.avatarZoomTrigger}
      aria-label={`Ver foto de ${displayName} en grande`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        handleZoom(event.currentTarget.getBoundingClientRect());
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          handleZoom(event.currentTarget.getBoundingClientRect());
        }
      }}
    >
      <Avatar photoUrl={student.photoUrl} role="estudiante" name={displayName} size={36} />
    </span>
  );
}

interface GradeItemRowProps {
  itemName: string;
  onRename: (name: string) => void;
  onCheckDeleteImpact: () => Promise<number>;
  onConfirmDelete: () => void;
}

type GradeItemRowMode = "view" | "editing" | "confirmingDelete";

function GradeItemRow({ itemName, onRename, onCheckDeleteImpact, onConfirmDelete }: GradeItemRowProps) {
  const [mode, setMode] = useState<GradeItemRowMode>("view");
  const [nameValue, setNameValue] = useState(itemName);
  const [affectedCount, setAffectedCount] = useState<number | null>(null);
  const [checkingImpact, setCheckingImpact] = useState(false);

  useEffect(() => {
    setNameValue(itemName);
  }, [itemName]);

  async function handleDeleteClick() {
    setCheckingImpact(true);
    const count = await onCheckDeleteImpact();
    setAffectedCount(count);
    setCheckingImpact(false);
    setMode("confirmingDelete");
  }

  if (mode === "editing") {
    return (
      <li className={styles.itemRow}>
        <input
          type="text"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          className={styles.itemNameInput}
          aria-label={`Nuevo nombre para ${itemName}`}
          autoFocus
        />
        <div className={styles.itemRowActions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => {
              const trimmed = nameValue.trim();
              if (trimmed.length > 0) {
                onRename(trimmed);
              }
              setMode("view");
            }}
            aria-label="Guardar nombre"
          >
            <Check size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconButtonMuted}
            onClick={() => {
              setNameValue(itemName);
              setMode("view");
            }}
            aria-label="Cancelar edición"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </li>
    );
  }

  if (mode === "confirmingDelete") {
    return (
      <li className={styles.itemRowConfirm}>
        <p className={styles.confirmText}>
          {affectedCount !== null && affectedCount > 0 ? (
            <>
              <AlertTriangle size={16} aria-hidden="true" className={styles.warningIcon} />
              {affectedCount === 1
                ? `1 estudiante ya tiene nota en "${itemName}". También se eliminará esa nota. `
                : `${affectedCount} estudiantes ya tienen nota en "${itemName}". También se eliminarán esas notas. `}
              ¿Eliminar de todas formas?
            </>
          ) : (
            `¿Eliminar "${itemName}"?`
          )}
        </p>
        <div className={styles.itemRowActions}>
          <button type="button" className={styles.confirmDeleteButton} onClick={onConfirmDelete}>
            Eliminar
          </button>
          <button type="button" className={styles.cancelButtonSmall} onClick={() => setMode("view")}>
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className={styles.itemRow}>
      <span className={styles.itemNameText}>{itemName}</span>
      <div className={styles.itemRowActions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setMode("editing")}
          aria-label={`Editar nombre de ${itemName}`}
        >
          <Pencil size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.iconButtonDanger}
          onClick={handleDeleteClick}
          disabled={checkingImpact}
          aria-label={`Eliminar ${itemName}`}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
