import { useState } from "react";
import styles from "./LoginButton.module.scss";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

const LoginButton = ({ compact = false }: { compact?: boolean }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success(t("auth.login_success"));
    } catch (error: any) {
      console.error("Ошибка авторизации через Google:", error);
      if (error.code === "auth/popup-blocked") {
        toast.error(t("auth.popup_blocked"));
      } else {
        toast.error(t("auth.login_error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`${styles.googleButton} ${compact ? styles.compact : ""}`}
      onClick={handleLogin}
      disabled={isLoading}
      aria-label={t("auth.login_google")}
    >
      <span className={styles.iconWrapper}>
        <img
          src="https://developers.google.com/identity/images/g-logo.png"
          alt=""
          className={styles.icon}
        />
      </span>
      <span className={styles.buttonText}>
        {isLoading ? t("auth.logging_in") : t("auth.login_google")}
      </span>
    </button>
  );
};

export default LoginButton;
