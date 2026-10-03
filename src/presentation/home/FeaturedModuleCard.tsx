import { Link } from "react-router-dom";
import type { ModuleDefinition } from "../shell/moduleCatalog";
import styles from "./FeaturedModuleCard.module.scss";

interface FeaturedModuleCardProps {
  module: ModuleDefinition;
  onTap: (moduleId: string, implemented: boolean) => void;
}

export function FeaturedModuleCard({ module, onTap }: FeaturedModuleCardProps) {
  const Icon = module.icon;
  const implemented = module.route !== null;

  const inner = (
    <>
      <span className={styles.iconCircle} aria-hidden="true">
        <Icon className={styles.icon} />
      </span>
      <span className={styles.label}>{module.label}</span>
      <span className={styles.status}>{implemented ? "Ver detalle" : "Próximamente"}</span>
    </>
  );

  if (!implemented) {
    return (
      <div className={styles.card} aria-disabled="true">
        {inner}
      </div>
    );
  }

  return (
    <Link to={module.route!} className={styles.card} onClick={() => onTap(module.id, true)}>
      {inner}
    </Link>
  );
}