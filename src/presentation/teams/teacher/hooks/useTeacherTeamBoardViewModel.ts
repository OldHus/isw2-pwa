import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { container } from "../../../../di/container";
import { useAppSelector } from "../../../../store/hooks";
import { UserRole } from "../../../../store/slices/sessionSlice";
import type { KanbanTask, TaskColumnValue } from "../../../../domain/model/TeamModels";
import type { CourseStudent } from "../../../../domain/model/CourseModels";
import type { TeacherTeamBoardUiState } from "../TeacherTeamBoardUiState";

export function useTeacherTeamBoardViewModel() {
  const { teamId } = useParams<{ teamId: string }>();
  const session = useAppSelector((state) => state.session);
  const [uiState, setUiState] = useState<TeacherTeamBoardUiState>({ status: "loading" });
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session.courseId || !teamId) {
      setUiState({ status: "error", message: "No se encontró el equipo o el curso" });
      return;
    }

    setUiState({ status: "loading" });

    const teamResult = await container.getTeamByIdUseCase.execute(session.courseId, teamId);
    if (!teamResult.success) {
      setUiState({ status: "error", message: "No se pudo cargar el equipo" });
      return;
    }

    const [studentsResult, tasksResult] = await Promise.all([
      container.getCourseStudentsUseCase.execute(session.courseId),
      container.getTeamTasksUseCase.execute(session.courseId, teamId),
    ]);

    if (!studentsResult.success) {
      setUiState({ status: "error", message: "No se pudieron cargar los estudiantes" });
      return;
    }
    if (!tasksResult.success) {
      setUiState({ status: "error", message: "No se pudieron cargar las tareas" });
      return;
    }

    const team = teamResult.data;
    const memberSet = new Set(team.memberUids);
    const members = studentsResult.data.filter((student) => memberSet.has(student.uid));
    const availableStudents = studentsResult.data.filter((student) => !memberSet.has(student.uid));

    setUiState({ status: "success", team, members, availableStudents, tasks: tasksResult.data });
  }, [session.courseId, teamId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const addStudent = useCallback(
    async (student: CourseStudent) => {
      if (!session.courseId || !teamId) return;

      const result = await container.addStudentToTeamUseCase.execute(session.courseId, teamId, student.uid);
      if (result.success) {
        container.analyticsReporter.logEvent("student_added_to_team", {
          course_id: session.courseId,
          team_id: teamId,
        });
        await load();
      } else {
        setFeedback("No se pudo agregar el estudiante");
      }
    },
    [session.courseId, teamId, load]
  );

  const removeStudent = useCallback(
    async (student: CourseStudent) => {
      if (!session.courseId || !teamId) return;

      const result = await container.removeStudentFromTeamUseCase.execute(
        session.courseId,
        teamId,
        student.uid
      );
      if (result.success) {
        container.analyticsReporter.logEvent("student_removed_from_team", {
          course_id: session.courseId,
          team_id: teamId,
        });
        await load();
      } else {
        setFeedback("No se pudo quitar el estudiante");
      }
    },
    [session.courseId, teamId, load]
  );

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
        setFeedback("No se pudo crear la tarea");
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
        UserRole.TEACHER,
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

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!session.courseId || !teamId) return;

      const result = await container.deleteTaskUseCase.execute(session.courseId, teamId, taskId);
      if (result.success) {
        container.analyticsReporter.logEvent("task_rejected", {
          course_id: session.courseId,
          team_id: teamId,
        });
        await load();
      } else {
        setFeedback("No se pudo eliminar la tarea");
      }
    },
    [session.courseId, teamId, load]
  );

  return { uiState, feedback, addStudent, removeStudent, createTask, moveTask, deleteTask };
}