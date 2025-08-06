import styles from "./LoginButton.module.css";
import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";

const LoginButton = () => {
  const handleLogin = () => {
    localStorage.setItem("redirectPath", window.location.pathname);

    if (import.meta.env.MODE === "development") {
      signInWithPopup(auth, googleProvider).catch((error) => {
        console.error("Ошибка авторизации через Google (popup):", error);
      });
    } else {
      signInWithRedirect(auth, googleProvider).catch((error) => {
        console.error("Ошибка авторизации через Google (redirect):", error);
      });
    }
  };

  return (
    <div className="login-button-wrapper">
      <button className={styles.googleButton} onClick={handleLogin}>
        <div className={styles.iconWrapper}>
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google logo"
            className={styles.icon}
          />
        </div>
        <span className={styles.buttonText}>Sign in with Google</span>
      </button>
    </div>
  );
};

export default LoginButton;
