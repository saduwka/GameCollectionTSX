import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./Button.module.scss";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  to?: string;
  hint?: string;
  children: ReactNode;
}

const Button = ({ variant = "primary", to, hint, className, children, type = "button", ...props }: ButtonProps) => {
  const classNames = `${styles.button} ${styles[variant]} ${className ?? ""}`;
  const body = (
    <>
      <span>{children}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classNames}>
        {body}
      </Link>
    );
  }
  return (
    <button type={type} className={classNames} {...props}>
      {body}
    </button>
  );
};

export default Button;
