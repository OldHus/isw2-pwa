import { useState, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { KanbanTask, TaskColumnValue } from "../../../domain/model/TeamModels";
import styles from "./KanbanBoard.module.scss";

export interface KanbanColumnSpec {
  value: TaskColumnValue;
  label: string;
}

interface KanbanBoardProps {
  columns: KanbanColumnSpec[];
  tasks: KanbanTask[];
  canDragTask: (task: KanbanTask) => boolean;
  isValidDrop: (task: KanbanTask, to: TaskColumnValue) => boolean;
  onMoveTask: (task: KanbanTask, to: TaskColumnValue) => void;
  renderCardActions?: (task: KanbanTask) => ReactNode;
}

export function KanbanBoard({
  columns,
  tasks,
  canDragTask,
  isValidDrop,
  onMoveTask,
  renderCardActions,
}: KanbanBoardProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);
    const { active, over } = event;
    if (!over) return;

    const task = tasks.find((candidate) => candidate.id === active.id);
    if (!task) return;

    const destination = over.id as TaskColumnValue;
    if (destination === task.column) return;
    if (!isValidDrop(task, destination)) return;

    onMoveTask(task, destination);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.board}>
        {columns.map((column, columnIndex) => (
          <KanbanColumn
            key={column.value}
            column={column}
            columnIndex={columnIndex}
            allColumns={columns}
            tasks={tasks.filter((task) => task.column === column.value)}
            canDragTask={canDragTask}
            isDraggingSomething={activeTaskId !== null}
            activeDraggedTask={activeTask}
            isValidDrop={isValidDrop}
            onMoveTask={onMoveTask}
            renderCardActions={renderCardActions}
          />
        ))}
      </div>
    </DndContext>
  );
}

interface KanbanColumnProps {
  column: KanbanColumnSpec;
  columnIndex: number;
  allColumns: KanbanColumnSpec[];
  tasks: KanbanTask[];
  canDragTask: (task: KanbanTask) => boolean;
  isDraggingSomething: boolean;
  activeDraggedTask: KanbanTask | null;
  isValidDrop: (task: KanbanTask, to: TaskColumnValue) => boolean;
  onMoveTask: (task: KanbanTask, to: TaskColumnValue) => void;
  renderCardActions?: (task: KanbanTask) => ReactNode;
}

function KanbanColumn({
  column,
  columnIndex,
  allColumns,
  tasks,
  canDragTask,
  isDraggingSomething,
  activeDraggedTask,
  isValidDrop,
  onMoveTask,
  renderCardActions,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.value });

  const isLegalTarget =
    isDraggingSomething && activeDraggedTask ? isValidDrop(activeDraggedTask, column.value) : false;

  const previousColumn = allColumns[columnIndex - 1] ?? null;
  const nextColumn = allColumns[columnIndex + 1] ?? null;

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver && isLegalTarget ? styles.columnDropTarget : ""} ${
        isDraggingSomething && !isLegalTarget ? styles.columnDimmed : ""
      }`}
    >
      <div className={styles.columnHeader}>
        <span className={styles.columnLabel}>{column.label}</span>
        <span className={styles.columnCount}>{tasks.length}</span>
      </div>
      <div className={styles.columnBody}>
        {tasks.length === 0 ? (
          <p className={styles.columnEmpty}>Sin tareas</p>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              draggable={canDragTask(task)}
              canMoveToPrevious={previousColumn !== null && isValidDrop(task, previousColumn.value)}
              canMoveToNext={nextColumn !== null && isValidDrop(task, nextColumn.value)}
              previousColumnLabel={previousColumn?.label}
              nextColumnLabel={nextColumn?.label}
              onMoveToPrevious={previousColumn ? () => onMoveTask(task, previousColumn.value) : undefined}
              onMoveToNext={nextColumn ? () => onMoveTask(task, nextColumn.value) : undefined}
              actions={renderCardActions?.(task)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface KanbanCardProps {
  task: KanbanTask;
  draggable: boolean;
  canMoveToPrevious: boolean;
  canMoveToNext: boolean;
  previousColumnLabel?: string;
  nextColumnLabel?: string;
  onMoveToPrevious?: () => void;
  onMoveToNext?: () => void;
  actions?: ReactNode;
}

function KanbanCard({
  task,
  draggable,
  canMoveToPrevious,
  canMoveToNext,
  previousColumnLabel,
  nextColumnLabel,
  onMoveToPrevious,
  onMoveToNext,
  actions,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !draggable,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const showMoveRow = canMoveToPrevious || canMoveToNext;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${draggable ? styles.cardDraggable : ""} ${isDragging ? styles.cardDragging : ""}`}
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
      tabIndex={draggable ? 0 : undefined}
      role={draggable ? "button" : undefined}
      aria-roledescription={draggable ? "Tarjeta arrastrable" : undefined}
      aria-label={draggable ? `${task.title}. Presiona espacio para moverla, luego usa las flechas.` : undefined}
    >
      <p className={styles.cardTitle}>{task.title}</p>
      {task.description ? <p className={styles.cardDescription}>{task.description}</p> : null}

      {/* Simple, non-drag alternative */}
      {showMoveRow ? (
        <div className={styles.cardMoveRow}>
          <button
            type="button"
            className={styles.cardMoveButton}
            disabled={!canMoveToPrevious}
            onClick={(event) => {
              event.stopPropagation();
              onMoveToPrevious?.();
            }}
            aria-label={canMoveToPrevious ? `Mover "${task.title}" a ${previousColumnLabel}` : undefined}
            title={canMoveToPrevious ? `Mover a ${previousColumnLabel}` : undefined}
          >
            <ArrowLeft size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.cardMoveButton}
            disabled={!canMoveToNext}
            onClick={(event) => {
              event.stopPropagation();
              onMoveToNext?.();
            }}
            aria-label={canMoveToNext ? `Mover "${task.title}" a ${nextColumnLabel}` : undefined}
            title={canMoveToNext ? `Mover a ${nextColumnLabel}` : undefined}
          >
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {actions}
    </div>
  );
}