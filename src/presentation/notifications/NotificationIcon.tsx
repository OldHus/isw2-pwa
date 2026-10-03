import { MessageSquare, BarChart3, Zap } from "lucide-react";
import type { ActivityItemType } from "../../domain/model/ActivityFeedModels";
import styles from "./NotificationIcon.module.scss";

const ICONS: Record<ActivityItemType, typeof MessageSquare> = {
  post: MessageSquare,
  poll: BarChart3,
  quiz: Zap,
};

export function NotificationIcon({ type }: { type: ActivityItemType }) {
  const Icon = ICONS[type];
  return (
    <span className={`${styles.iconWrap} ${styles[type]}`}>
      <Icon size={16} />
    </span>
  );
}