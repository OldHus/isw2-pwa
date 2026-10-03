export interface Team {
  id: string;
  name: string;
  memberUids: string[];
  createdAt: number;
}

export type TaskColumnValue = "propuestas" | "hacer" | "desarrollando" | "qa" | "aprobada";

export const TaskColumn = {
  PROPUESTAS: "propuestas",
  HACER: "hacer",
  DESARROLLANDO: "desarrollando",
  QA: "qa",
  APROBADA: "aprobada",
} as const satisfies Record<string, TaskColumnValue>;

export function parseTaskColumn(value: string): TaskColumnValue {
  switch (value) {
    case "propuestas":
    case "hacer":
    case "desarrollando":
    case "qa":
    case "aprobada":
      return value;
    default:
      return TaskColumn.PROPUESTAS;
  }
}

export interface KanbanTask {
  id: string;
  teamId: string;
  title: string;
  description: string;
  column: TaskColumnValue;
  createdByUid: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export type TeamError =
  | { type: "teamNotFound" }
  | { type: "courseNotFound" }
  | { type: "studentAlreadyInTeam" }
  | { type: "studentNotInCourse" }
  | { type: "emptyName" }
  | { type: "unknown"; message: string };

export type TaskError =
  | { type: "taskNotFound" }
  | { type: "emptyTitle" }
  | { type: "notAuthenticated" }
  | { type: "invalidTransition"; from: TaskColumnValue; to: TaskColumnValue }
  | { type: "unknown"; message: string };