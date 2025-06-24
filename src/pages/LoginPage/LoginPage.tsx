import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoginButton from "../../components/LoginButton/LoginButton";
import styles from "./LoginPage.module.css";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";

const LoginPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    localStorage.getItem("redirectPath") ||
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/";

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
      localStorage.removeItem("redirectPath");
    }
  }, [user, loading, from, navigate]);

  if (loading)
    return (
      <LoadingErrorMessage loading={loading} error={null} noResults={false} />
    );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sign in to GameCollection</h1>
      <LoginButton />
    </div>
  );
};

export default LoginPage;
