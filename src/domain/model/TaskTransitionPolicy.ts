import { UserRole } from "../../store/slices/sessionSlice";
import { TaskColumn, type TaskColumnValue } from "./TeamModels";

const teamMemberAllowedColumns: ReadonlySet<TaskColumnValue> = new Set([
  TaskColumn.HACER,
  TaskColumn.DESARROLLANDO,
  TaskColumn.QA,
]);

export function canTransitionTask(role: UserRole, from: TaskColumnValue, to: TaskColumnValue): boolean {
  if (from === to) return false;

  if (role === UserRole.TEACHER) {
    return true;
  }

  if (role === UserRole.STUDENT) {
    return teamMemberAllowedColumns.has(from) && teamMemberAllowedColumns.has(to);
  }

  return false;
}