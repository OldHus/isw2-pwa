import { useEffect, useRef, useState } from "react";
import { CheckCheck, Eye, EyeOff, Inbox, Trash2, X } from "lucide-react";
import type { NotificationItem } from "./hooks/useNotificationCenter";
import { NotificationIcon } from "./NotificationIcon";
import { NotificationPermissionToggle } from "./NotificationPermissionToggle";
import { formatRelativeTime } from "./formatRelativeTime";
import styles from "./NotificationPanel.module.scss";

interface NotificationPanelProps {
  items: NotificationItem[];
  onItemOpen: (item: NotificationItem) => void;
  onToggleRead: (item: NotificationItem) => void;
  onDismiss: (item: NotificationItem) => void;
  onMarkAllRead: () => void;
  onMarkManyRead: (ids: string[]) => void;
  onMarkManyUnread: (ids: string[]) => void;
  onDismissMany: (ids: string[]) => void;
  onClose: () => void;
}

export function NotificationPanel({
  items,
  onItemOpen,
  onToggleRead,
  onDismiss,
  onMarkAllRead,
  onMarkManyRead,
  onMarkManyUnread,
  onDismissMany,
  onClose,
}: NotificationPanelProps) {
  const hasUnread = items.some((item) => !item.read);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedIds((current) => {
      const validIds = new Set(items.map((item) => item.id));
      const next = new Set(Array.from(current).filter((id) => validIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [items]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedIds.size > 0 && selectedIds.size < items.length;
    }
  }, [selectedIds, items.length]);

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) => (current.size === items.length ? new Set() : new Set(items.map((item) => item.id))));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const onMarkSelectedRead = () => {
    onMarkManyRead(Array.from(selectedIds));
    clearSelection();
  };

  const onMarkSelectedUnread = () => {
    onMarkManyUnread(Array.from(selectedIds));
    clearSelection();
  };

  const onDeleteSelected = () => {
    onDismissMany(Array.from(selectedIds));
    clearSelection();
  };

  return (
    <div className={styles.panel} role="dialog" aria-label="Notificaciones">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {items.length > 0 && (
            <input
              ref={selectAllRef}
              type="checkbox"
              className={styles.checkbox}
              checked={items.length > 0 && selectedIds.size === items.length}
              onChange={toggleSelectAll}
              aria-label="Seleccionar todas las notificaciones"
            />
          )}
          <span className={styles.title}>Notificaciones</span>
        </div>
        <div className={styles.headerActions}>
          {hasUnread && selectedIds.size === 0 && (
            <button type="button" className={styles.markAllButton} onClick={onMarkAllRead}>
              <CheckCheck size={14} />
              Marcar todas
            </button>
          )}
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className={styles.selectionBar}>
          <span>
            {selectedIds.size} seleccionada{selectedIds.size > 1 ? "s" : ""}
          </span>
          <div className={styles.selectionActions}>
            <button
              type="button"
              className={styles.selectionActionButton}
              onClick={onMarkSelectedRead}
              title="Marcar como leídas"
              aria-label="Marcar seleccionadas como leídas"
            >
              <CheckCheck size={14} />
            </button>
            <button
              type="button"
              className={styles.selectionActionButton}
              onClick={onMarkSelectedUnread}
              title="Marcar como no leídas"
              aria-label="Marcar seleccionadas como no leídas"
            >
              <EyeOff size={14} />
            </button>
            <button
              type="button"
              className={`${styles.selectionActionButton} ${styles.deleteButton}`}
              onClick={onDeleteSelected}
              title="Eliminar seleccionadas"
              aria-label="Eliminar seleccionadas"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              className={styles.selectionActionButton}
              onClick={clearSelection}
              title="Cancelar selección"
              aria-label="Cancelar selección"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <NotificationPermissionToggle />

      <div className={styles.list}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <Inbox size={28} className={styles.emptyIcon} />
            <p>No hay notificaciones todavía.</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className={`${styles.item} ${item.read ? "" : styles.unread} ${
                selectedIds.has(item.id) ? styles.selected : ""
              }`}
              style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
            >
              <label className={styles.itemCheckboxWrap} onClick={(event) => event.stopPropagation()}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelected(item.id)}
                  aria-label={`Seleccionar: ${item.title}`}
                />
              </label>

              <button type="button" className={styles.itemMain} onClick={() => onItemOpen(item)}>
                <NotificationIcon type={item.type} />
                <div className={styles.itemBody}>
                  <p className={styles.itemTitle}>{item.title}</p>
                  <p className={styles.itemText}>{item.body}</p>
                  <span className={styles.itemTime}>{formatRelativeTime(item.createdAtMillis)}</span>
                </div>
                {!item.read && <span className={styles.dot} aria-hidden="true" />}
              </button>

              <div className={styles.itemActions}>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => onToggleRead(item)}
                  aria-label={item.read ? "Marcar como no leída" : "Marcar como leída"}
                  title={item.read ? "Marcar como no leída" : "Marcar como leída"}
                >
                  {item.read ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => onDismiss(item)}
                  aria-label="Eliminar notificación"
                  title="Eliminar notificación"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}