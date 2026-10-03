import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Plus, RotateCcw, X } from "lucide-react";
import { AppShell } from "../../shell/AppShell";
import { useTeacherTeamBoardViewModel } from "./hooks/useTeacherTeamBoardViewModel";
import { AddStudentDialog } from "./AddStudentDialog";
import { CreateTaskDialog } from "../shared/CreateTaskDialog";
import { KanbanBoard, type KanbanColumnSpec } from "../shared/KanbanBoard";
import { Avatar } from "../../common/Avatar";
import { canTransitionTask } from "../../../domain/model/TaskTransitionPolicy";
import { TaskColumn } from "../../../domain/model/TeamModels";
import { UserRole } from "../../../store/slices/sessionSlice";
import { Routes } from "../../../routes/Routes";
import type { KanbanTask } from "../../../domain/model/TeamModels";
import styles from "./TeacherTeamBoardScreen.module.scss";

const boardColumns: KanbanColumnSpec[] = [
  { value: "propuestas", label: "Propuestas" },
  { value: "hacer", label: "Hacer" },
  { value: "desarrollando", label: "Desarrollando" },
  { value: "qa", label: "QA" },
  { value: "aprobada", label: "Aprobada" },
];

export function TeacherTeamBoardScreen() {
  const { uiState, feedback, addStudent, removeStudent, createTask, moveTask, deleteTask } =
    useTeacherTeamBoardViewModel();
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);

  return (
    <AppShell>
      <div className={styles.screen}>
        <Link to={Routes.kanban} className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden="true" />
          Proyecto de aula
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>
            {uiState.status === "success" ? uiState.team.name : "Equipo"}
          </h1>
          {uiState.status === "success" ? (
            <button type="button" className={styles.createButton} onClick={() => setShowCreateTaskDialog(true)}>
              <Plus size={18} aria-hidden="true" />
              Nueva tarea
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
            <div className={styles.spinner} aria-label="Cargando equipo" role="status" />
          </div>
        )}

        {uiState.status === "error" && (
          <p role="alert" className={styles.errorText}>
            {uiState.message}
          </p>
        )}

        {uiState.status === "success" && (
          <>
            <div className={styles.membersRow}>
              {uiState.members.map((member) => (
                <div key={member.uid} className={styles.memberChip}>
                  <Avatar photoUrl={member.photoUrl} role="estudiante" name={member.name || member.email} size={24} />
                  <span className={styles.memberChipName}>{member.name || member.email}</span>
                  <button
                    type="button"
                    className={styles.memberChipRemove}
                    onClick={() => removeStudent(member)}
                    aria-label={`Quitar a ${member.name || member.email} del equipo`}
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={styles.addMemberChip}
                onClick={() => setShowAddStudentDialog(true)}
              >
                <Plus size={14} aria-hidden="true" />
                Agregar
              </button>
            </div>

            <KanbanBoard
              columns={boardColumns}
              tasks={uiState.tasks}
              canDragTask={() => true}
              isValidDrop={(task, to) => canTransitionTask(UserRole.TEACHER, task.column, to)}
              onMoveTask={(task, to) => moveTask(task, to)}
              renderCardActions={(task: KanbanTask) => {
                if (task.column === TaskColumn.PROPUESTAS) {
                  return (
                    <div className={styles.reviewActionsRow}>
                      <button
                        type="button"
                        className={`${styles.reviewButton} ${styles.reviewButtonApprove}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveTask(task, TaskColumn.HACER);
                        }}
                        aria-label={`Aceptar propuesta "${task.title}"`}
                        title="Aceptar propuesta"
                      >
                        <Check size={14} aria-hidden="true" />
                        Aceptar
                      </button>
                      <button
                        type="button"
                        className={`${styles.reviewButton} ${styles.reviewButtonReject}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteTask(task.id);
                        }}
                        aria-label={`Rechazar propuesta "${task.title}"`}
                        title="Rechazar propuesta"
                      >
                        <X size={14} aria-hidden="true" />
                        Rechazar
                      </button>
                    </div>
                  );
                }

                if (task.column === TaskColumn.QA) {
                  return (
                    <div className={styles.reviewActionsRow}>
                      <button
                        type="button"
                        className={`${styles.reviewButton} ${styles.reviewButtonApprove}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveTask(task, TaskColumn.APROBADA);
                        }}
                        aria-label={`Aprobar tarea "${task.title}"`}
                        title="Aprobar"
                      >
                        <Check size={14} aria-hidden="true" />
                        Aprobar
                      </button>
                      <button
                        type="button"
                        className={styles.reviewButton}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveTask(task, TaskColumn.DESARROLLANDO);
                        }}
                        aria-label={`Retornar "${task.title}" a Desarrollando`}
                        title="Retornar a Desarrollando"
                      >
                        <RotateCcw size={14} aria-hidden="true" />
                        Retornar
                      </button>
                    </div>
                  );
                }

                return null;
              }}
            />
          </>
        )}
      </div>

      {showAddStudentDialog && uiState.status === "success" ? (
        <AddStudentDialog
          availableStudents={uiState.availableStudents}
          onDismiss={() => setShowAddStudentDialog(false)}
          onSelect={(student) => {
            addStudent(student);
            setShowAddStudentDialog(false);
          }}
        />
      ) : null}

      {showCreateTaskDialog ? (
        <CreateTaskDialog
          title="Nueva tarea"
          confirmLabel="Crear"
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