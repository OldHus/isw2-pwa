import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { AppShell } from "../../shell/AppShell";
import { useStudentTeamBoardViewModel } from "./hooks/useStudentTeamBoardViewModel";
import { CreateTaskDialog } from "../shared/CreateTaskDialog";
import { KanbanBoard, type KanbanColumnSpec } from "../shared/KanbanBoard";
import { canTransitionTask } from "../../../domain/model/TaskTransitionPolicy";
import { TaskColumn, type TaskColumnValue } from "../../../domain/model/TeamModels";
import { UserRole } from "../../../store/slices/sessionSlice";
import styles from "./StudentTeamBoardScreen.module.scss";

const boardColumns: KanbanColumnSpec[] = [
  { value: "propuestas", label: "Propuestas" },
  { value: "hacer", label: "Hacer" },
  { value: "desarrollando", label: "Desarrollando" },
  { value: "qa", label: "QA" },
  { value: "aprobada", label: "Aprobada" },
];

const studentDraggableColumns: ReadonlySet<TaskColumnValue> = new Set([
  TaskColumn.HACER,
  TaskColumn.DESARROLLANDO,
  TaskColumn.QA,
]);

export function StudentTeamBoardScreen() {
  const { uiState, feedback, createTask, moveTask } = useStudentTeamBoardViewModel();
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);

  return (
    <AppShell>
      <div className={styles.screen}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <Users size={28} aria-hidden="true" />
            <h1 className={styles.title}>
              {uiState.status === "success" ? uiState.team.name : "Mi equipo"}
            </h1>
          </div>
          {uiState.status === "success" ? (
            <button type="button" className={styles.createButton} onClick={() => setShowCreateTaskDialog(true)}>
              <Plus size={18} aria-hidden="true" />
              Proponer tarea
            </button>
          ) : null}
        </header>

        {feedback ? (
          <p role="status" aria-live="polite" className={styles.feedback}>
            {feedback}
          </p>
        ) : null}

        {uiState.status === "loading" && (
          <div className={styles.centered}>
            <div className={styles.spinner} aria-label="Cargando tu equipo" role="status" />
          </div>
        )}

        {uiState.status === "noTeamAssigned" && (
          <p className={styles.emptyState}>
            Todavía no perteneces a ningún equipo. Tu docente te asignará uno pronto.
          </p>
        )}

        {uiState.status === "error" && (
          <p role="alert" className={styles.errorText}>
            {uiState.message}
          </p>
        )}

        {uiState.status === "success" && (
          <KanbanBoard
            columns={boardColumns}
            tasks={uiState.tasks}
            canDragTask={(task) => studentDraggableColumns.has(task.column)}
            isValidDrop={(task, to) => canTransitionTask(UserRole.STUDENT, task.column, to)}
            onMoveTask={(task, to) => moveTask(task, to)}
          />
        )}
      </div>

      {showCreateTaskDialog ? (
        <CreateTaskDialog
          title="Proponer tarea"
          confirmLabel="Proponer"
          onDismiss={() => setShowCreateTaskDialog(false)}
          onConfirm={(title, description) => {
            createTask(title, description);
            setShowCreateTaskDialog(false);
          }}
        />
      ) : null}
    </AppShell>
  );
}