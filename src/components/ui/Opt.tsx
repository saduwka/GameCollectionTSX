import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Opt.module.scss";

interface OptProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  children: ReactNode;
}

const Opt = ({ pressed = false, className, children, type = "button", ...props }: OptProps) => (
  <button
    type={type}
    className={`${styles.opt} ${className ?? ""}`}
    aria-pressed={pressed}
    {...props}
  >
    {children}
  </button>
);

export default Opt;
