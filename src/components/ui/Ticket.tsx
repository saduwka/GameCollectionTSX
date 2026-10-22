import type { ReactNode } from "react";
import styles from "./Ticket.module.scss";

interface TicketProps {
  kicker: string;
  aside?: string;
  title: string;
  meta?: ReactNode;
  whyLabel?: string;
  why?: ReactNode;
  foot?: ReactNode;
  compact?: boolean;
  className?: string;
  heading?: "h1" | "h2" | "div";
}

const Ticket = ({ kicker, aside, title, meta, whyLabel, why, foot, compact, className, heading = "div" }: TicketProps) => {
  const TitleTag = heading;
  return (
  <article className={`${styles.ticket} ${compact ? styles.compact : ""} ${className ?? ""}`}>
    <div className={styles.head}>
      <span>{kicker}</span>
      {aside && <span>{aside}</span>}
    </div>
    <TitleTag className={styles.title}>{title}</TitleTag>
    {meta && <div className={styles.meta}>{meta}</div>}
    {why && (
      <p className={styles.why}>
        {whyLabel && <span className={styles.whyLabel}>{whyLabel}</span>}
        {why}
      </p>
    )}
    {foot && <div className={styles.foot}>{foot}</div>}
  </article>
  );
};

export default Ticket;
