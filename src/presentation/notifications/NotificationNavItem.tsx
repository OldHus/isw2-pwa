import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { NotificationCenter, NotificationItem } from "./hooks/useNotificationCenter";
import { NotificationPanel } from "./NotificationPanel";
import { ROUTE_BY_TYPE } from "./routeByType";
import styles from "./NotificationNavItem.module.scss";

interface NotificationNavItemProps {
  notificationCenter: NotificationCenter;
  navItemClassName: string;
  navIconClassName: string;
  onAfterNavigate?: () => void;
}

interface PanelPosition {
  top: number;
  left?: number;
  right?: number;
  width?: number;
}

const MOBILE_BREAKPOINT = 480;
const PANEL_GAP = 10;
const PANEL_WIDTH = 360;
const PANEL_MAX_HEIGHT = 460;

export function NotificationNavItem({
  notificationCenter,
  navItemClassName,
  navIconClassName,
  onAfterNavigate,
}: NotificationNavItemProps) {
  const {
    items,
    unreadCount,
    markRead,
    markUnread,
    markManyRead,
    markManyUnread,
    dismiss,
    dismissMany,
    markAllRead,
  } = notificationCenter;
  const [isOpen, setIsOpen] = useState(false);
  const [justPulsed, setJustPulsed] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousUnreadRef = useRef(unreadCount);
  const navigate = useNavigate();

  useEffect(() => {
    if (unreadCount > previousUnreadRef.current) {
      setJustPulsed(true);
      const timeout = setTimeout(() => setJustPulsed(false), 700);
      previousUnreadRef.current = unreadCount;
      return () => clearTimeout(timeout);
    }
    previousUnreadRef.current = unreadCount;
  }, [unreadCount]);

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    function computePosition() {
      const rect = buttonRef.current!.getBoundingClientRect();
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

      if (isMobile) {
        setPosition({ top: 12, left: 12, right: 12 });
        return;
      }

      const maxTop = Math.max(12, window.innerHeight - PANEL_MAX_HEIGHT - 12);
      const top = Math.min(rect.top, maxTop);
      const spaceOnRight = window.innerWidth - rect.right;
      const openToRight = spaceOnRight >= PANEL_WIDTH + PANEL_GAP;

      setPosition(
        openToRight
          ? { top, left: rect.right + PANEL_GAP, width: PANEL_WIDTH }
          : { top, left: Math.max(12, rect.left - PANEL_WIDTH - PANEL_GAP), width: PANEL_WIDTH }
      );
    }

    computePosition();
    window.addEventListener("resize", computePosition);
    return () => window.removeEventListener("resize", computePosition);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen]);

  const onItemOpen = (item: NotificationItem) => {
    markRead(item.id);
    setIsOpen(false);
    navigate(ROUTE_BY_TYPE[item.type]);
    onAfterNavigate?.();
  };

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className={`${navItemClassName} ${styles.resetButtonBase}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"}
      >
        <span className={styles.iconSlot}>
          <Bell className={`${navIconClassName} ${justPulsed ? styles.ring : ""}`} aria-hidden="true" />
          {unreadCount > 0 && (
            <span className={`${styles.badge} ${justPulsed ? styles.badgePop : ""}`} aria-hidden="true" />
          )}
        </span>
        Notificaciones
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            className={styles.portalAnchor}
            style={{
              top: position.top,
              left: position.left,
              right: position.right,
              width: position.width,
            }}
          >
            <NotificationPanel
              items={items}
              onItemOpen={onItemOpen}
              onToggleRead={(item) => (item.read ? markUnread(item.id) : markRead(item.id))}
              onDismiss={(item) => dismiss(item.id)}
              onMarkAllRead={markAllRead}
              onMarkManyRead={markManyRead}
              onMarkManyUnread={markManyUnread}
              onDismissMany={dismissMany}
              onClose={() => setIsOpen(false)}
            />
          </div>,
          document.body
        )}
    </>
  );
}