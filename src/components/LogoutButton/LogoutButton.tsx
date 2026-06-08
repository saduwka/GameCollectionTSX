import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import styles from "./LogoutButton.module.scss";

const LogoutButton: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success(t("auth.logout_success"));
      navigate("/");
    } catch (error) {
      console.error("Ошибка выхода:", error);
      toast.error(t("auth.logout_error"));
    }
  };

  return (
    <button onClick={handleLogout} className={styles.button}>
      {t("auth.logout")}
    </button>
  );
};

export default LogoutButton;
