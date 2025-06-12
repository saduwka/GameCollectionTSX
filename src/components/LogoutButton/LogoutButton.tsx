import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import styles from "./LogoutButton.module.css";

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Пользователь вышел");
      navigate("/login");
    } catch (error) {
      console.error("Ошибка выхода:", error);
    }
  };

  return (
    <button onClick={handleLogout} className={styles.button}>
      Logout
    </button>
  );
};

export default LogoutButton;
