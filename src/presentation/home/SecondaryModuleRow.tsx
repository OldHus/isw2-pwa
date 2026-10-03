import { Link } from "react-router-dom";
import type { ModuleDefinition } from "../shell/moduleCatalog";
import styles from "./SecondaryModuleRow.module.scss";

interface SecondaryModuleRowProps {
  module: ModuleDefinition;
  onTap: (moduleId: string, implemented: boolean) => void;
}

export function SecondaryModuleRow({ module, onTap }: SecondaryModuleRowProps) {
  const Icon = module.icon;
  const implemented = module.route !== null;

  const inner = (
    <>
      <Icon className={styles.icon} aria-hidden="true" />
      <span className={styles.label}>{module.label}</span>
      <span className={styles.status}>{implemented ? "Ver detalle" : "Próximamente"}</span>
    </>
  );

  if (!implemented) {
    return (
      <div className={styles.row} aria-disabled="true">
        {inner}
      </div>
    );
  }

  return (
    <Link to={module.route!} className={styles.row} onClick={() => onTap(module.id, true)}>
      {inner}
    </Link>
  );
}