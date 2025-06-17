import styles from "./LoginButton.module.css";
import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { auth } from "../../firebase";

const provider = new GoogleAuthProvider();

const LoginButton = () => {
  const handleLogin = () => {
    localStorage.setItem("redirectPath", window.location.pathname);
    signInWithRedirect(auth, provider).catch((error) => {
      console.error("Ошибка авторизации через Google:", error);
    });
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
