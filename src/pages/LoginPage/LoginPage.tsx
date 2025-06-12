import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoginButton from "../../components/LoginButton/LoginButton";
import styles from "./LoginPage.module.css";

const LoginPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/collection";

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, from, navigate]);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sign in to GameCollection</h1>
      <LoginButton />
    </div>
  );
};

export default LoginPage;
