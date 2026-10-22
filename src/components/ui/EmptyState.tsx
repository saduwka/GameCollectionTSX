import type { ReactNode } from "react";
import styles from "./EmptyState.module.scss";

interface EmptyStateProps {
  title: string;
  text?: string;
  action?: ReactNode;
}

const EmptyState = ({ title, text, action }: EmptyStateProps) => (
  <div className={styles.box}>
    <h2 className={styles.title}>{title}</h2>
    {text && <p className={styles.text}>{text}</p>}
    {action && <div className={styles.actions}>{action}</div>}
  </div>
);

export default EmptyState;
