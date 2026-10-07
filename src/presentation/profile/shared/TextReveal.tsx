import styles from "./TextReveal.module.scss";

interface TextRevealProps {
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
}

export function TextReveal({ text, duration = 2.8, delay = 0, className = "" }: TextRevealProps) {
  return (
    <span
      className={`${styles.reveal}${className ? ` ${className}` : ""}`}
      style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    >
      {text}
    </span>
  );
}
