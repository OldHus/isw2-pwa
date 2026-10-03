import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";
import { AppShell } from "../../shell/AppShell";
import { useTeacherTeamsViewModel } from "./hooks/useTeacherTeamsViewModel";
import { TeamNameDialog } from "../shared/TeamNameDialog";
import { buildTeamBoardPath } from "../../../routes/Routes";
import type { Team } from "../../../domain/model/TeamModels";
import styles from "./TeacherTeamsScreen.module.scss";

export function TeacherTeamsScreen() {
  const { uiState, feedback, createTeam, renameTeam, deleteTeam } = useTeacherTeamsViewModel();
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [teamToRename, setTeamToRename] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  return (
    <AppShell>
      <div className={styles.screen}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <Users size={28} aria-hidden="true" />
            <h1 className={styles.title}>Proyecto de aula</h1>
          </div>
          <button type="button" className={styles.createButton} onClick={() => setShowCreateDialog(true)}>
            <Plus size={18} aria-hidden="true" />
            Crear equipo
          </button>
        </header>

        {feedback ? (
          <p role="status" aria-live="polite" className={styles.feedback}>
            {feedback}
          </p>
        ) : null}

        {uiState.status === "loading" && (
          <div className={styles.centered}>
            <div className={styles.spinner} aria-label="Cargando equipos" role="status" />
          </div>
        )}

        {uiState.status === "error" && (
          <p role="alert" className={styles.errorText}>
            {uiState.message}
          </p>
        )}

        {uiState.status === "success" &&
          (uiState.teams.length === 0 ? (
            <p className={styles.emptyState}>
              Aún no has creado equipos. Usa "Crear equipo" para armar el primero.
            </p>
          ) : (
            <ul className={styles.teamList}>
              {uiState.teams.map((team) => (
                <li key={team.id}>
                  <div
                    className={styles.teamCard}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(buildTeamBoardPath(team.id))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(buildTeamBoardPath(team.id));
                      }
                    }}
                  >
                    <div className={styles.teamInfo}>
                      <span className={styles.teamName}>{team.name}</span>
                      <span className={styles.teamMemberCount}>
                        {team.memberUids.length}{" "}
                        {team.memberUids.length === 1 ? "integrante" : "integrantes"}
                      </span>
                    </div>
                    <div className={styles.teamActions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={(event) => {
                          event.stopPropagation();
                          setTeamToRename(team);
                        }}
                        aria-label={`Renombrar ${team.name}`}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={styles.iconButtonDanger}
                        onClick={(event) => {
                          event.stopPropagation();
                          setTeamToDelete(team);
                        }}
                        aria-label={`Eliminar ${team.name}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </div>

      {showCreateDialog ? (
        <TeamNameDialog
          title="Nuevo equipo"
          fieldLabel="Nombre del equipo"
          confirmLabel="Crear"
          onDismiss={() => setShowCreateDialog(false)}
          onConfirm={(name) => {
            createTeam(name);
            setShowCreateDialog(false);
          }}
        />
      ) : null}

      {teamToRename ? (
        <TeamNameDialog
          title="Renombrar equipo"
          fieldLabel="Nombre del equipo"
          confirmLabel="Guardar"
          initialName={teamToRename.name}
          onDismiss={() => setTeamToRename(null)}
          onConfirm={(newName) => {
            renameTeam(teamToRename.id, newName);
            setTeamToRename(null);
          }}
        />
      ) : null}

      {teamToDelete ? (
        <div className={styles.overlay} onClick={() => setTeamToDelete(null)}>
          <div
            className={styles.confirmDialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-team-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-team-title" className={styles.confirmTitle}>
              Eliminar equipo
            </h2>
            <p className={styles.confirmText}>
              ¿Eliminar "{teamToDelete.name}"? Esto también borra todas sus tareas. Esta acción no se puede
              deshacer.
            </p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setTeamToDelete(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmDeleteButton}
                onClick={() => {
                  deleteTeam(teamToDelete.id);
                  setTeamToDelete(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}