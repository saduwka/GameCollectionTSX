import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./IconButton.module.scss";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

const IconButton = ({ label, children, type = "button", ...props }: IconButtonProps) => (
  <button type={type} className={styles.button} aria-label={label} {...props}>
    {children}
  </button>
);

export default IconButton;
