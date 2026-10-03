import { useCallback, useEffect, useState } from "react";
import { container } from "../../../../di/container";
import { useAppSelector } from "../../../../store/hooks";
import { UserRole } from "../../../../store/slices/sessionSlice";
import type { KanbanTask, TaskColumnValue } from "../../../../domain/model/TeamModels";
import type { StudentTeamBoardUiState } from "../StudentTeamBoardUiState";

export function useStudentTeamBoardViewModel() {
  const session = useAppSelector((state) => state.session);
  const [uiState, setUiState] = useState<StudentTeamBoardUiState>({ status: "loading" });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session.courseId) {
      setUiState({ status: "error", message: "No se encontró el curso asociado" });
      return;
    }

    setUiState({ status: "loading" });

    const teamResult = await container.getMyTeamUseCase.execute(session.courseId);
    if (!teamResult.success) {
      setUiState({ status: "error", message: "No se pudo cargar tu equipo" });
      return;
    }

    const team = teamResult.data;
    if (!team) {
      setTeamId(null);
      setUiState({ status: "noTeamAssigned" });
      return;
    }

    setTeamId(team.id);
    const tasksResult = await container.getTeamTasksUseCase.execute(session.courseId, team.id);
    if (!tasksResult.success) {
      setUiState({ status: "error", message: "No se pudieron cargar las tareas" });
      return;
    }

    setUiState({ status: "success", team, tasks: tasksResult.data });
  }, [session.courseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const createTask = useCallback(
    async (title: string, description: string) => {
      if (!session.courseId || !teamId) return;

      const result = await container.createTaskUseCase.execute(session.courseId, teamId, title, description);
      if (result.success) {
        container.analyticsReporter.logEvent("task_created", {
          course_id: session.courseId,
          team_id: teamId,
        });
        await load();
      } else {
        setFeedback("No se pudo crear la propuesta");
      }
    },
    [session.courseId, teamId, load]
  );

  const moveTask = useCallback(
    async (task: KanbanTask, to: TaskColumnValue) => {
      if (!session.courseId || !teamId) return;

      const result = await container.moveTaskUseCase.execute(
        session.courseId,
        teamId,
        task.id,
        UserRole.STUDENT,
        task.column,
        to
      );
      if (result.success) {
        container.analyticsReporter.logEvent("task_moved", {
          course_id: session.courseId,
          team_id: teamId,
          from: task.column,
          to,
        });
        await load();
      } else {
        setFeedback("No se pudo mover la tarea");
      }
    },
    [session.courseId, teamId, load]
  );

  return { uiState, feedback, createTask, moveTask };
}