import { useCallback, useEffect, useState } from "react";
import { container } from "../../../../di/container";
import { useAppSelector } from "../../../../store/hooks";
import type { TeacherTeamsUiState } from "../TeacherTeamsUiState";

export function useTeacherTeamsViewModel() {
  const session = useAppSelector((state) => state.session);
  const [uiState, setUiState] = useState<TeacherTeamsUiState>({ status: "loading" });
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session.courseId) {
      setUiState({ status: "error", message: "No se encontró el curso asociado" });
      return;
    }

    setUiState({ status: "loading" });
    const result = await container.getCourseTeamsUseCase.execute(session.courseId);

    if (!result.success) {
      setUiState({ status: "error", message: "No se pudieron cargar los equipos" });
      return;
    }

    setUiState({ status: "success", teams: result.data });
  }, [session.courseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const createTeam = useCallback(
    async (name: string) => {
      if (!session.courseId) return;

      const result = await container.createTeamUseCase.execute(session.courseId, name);
      if (result.success) {
        container.analyticsReporter.logEvent("team_created", { course_id: session.courseId });
        await load();
      } else {
        container.analyticsReporter.logEvent("team_create_error", { course_id: session.courseId });
        setFeedback(result.error.type === "emptyName" ? "El nombre no puede estar vacío" : "No se pudo crear el equipo");
      }
    },
    [session.courseId, load]
  );

  const renameTeam = useCallback(
    async (teamId: string, newName: string) => {
      if (!session.courseId) return;

      const result = await container.renameTeamUseCase.execute(session.courseId, teamId, newName);
      if (result.success) {
        container.analyticsReporter.logEvent("team_renamed", { course_id: session.courseId, team_id: teamId });
        await load();
      } else {
        setFeedback("No se pudo renombrar el equipo");
      }
    },
    [session.courseId, load]
  );

  const deleteTeam = useCallback(
    async (teamId: string) => {
      if (!session.courseId) return;

      const result = await container.deleteTeamUseCase.execute(session.courseId, teamId);
      if (result.success) {
        container.analyticsReporter.logEvent("team_deleted", { course_id: session.courseId, team_id: teamId });
        setFeedback("Equipo eliminado");
        await load();
      } else {
        setFeedback("No se pudo eliminar el equipo");
      }
    },
    [session.courseId, load]
  );

  return { uiState, feedback, createTeam, renameTeam, deleteTeam };
}