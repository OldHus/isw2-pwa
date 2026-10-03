import { useDefaultAvatarUrl } from "./hooks/useDefaultAvatarUrl";
import styles from "./Avatar.module.scss";

interface AvatarProps {
  photoUrl: string | null;
  role: string | null;
  name: string | null;
  size: number;
}

export function Avatar({ photoUrl, role, name, size }: AvatarProps) {
  const defaultUrl = useDefaultAvatarUrl(role);
  const resolvedUrl = photoUrl || defaultUrl;

  if (resolvedUrl) {
    return (
      <img src={resolvedUrl} alt="" className={styles.image} style={{ width: size, height: size }} />
    );
  }

  return (
    <span
      className={styles.placeholder}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {name ? name.charAt(0).toUpperCase() : "?"}
    </span>
  );
}