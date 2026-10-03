import type { MouseEvent } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";
import styles from "./ThemeToggleButton.module.scss";

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    toggleTheme(rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  return (
    <button
      className={styles.button}
      onClick={onClick}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {theme === "dark" ? <Sun className={styles.icon} /> : <Moon className={styles.icon} />}
    </button>
  );
}