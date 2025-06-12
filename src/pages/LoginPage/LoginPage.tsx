import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoginButton from "../../components/LoginButton/LoginButton";
import styles from "./LoginPage.module.css";
import { getRedirectResult } from "firebase/auth";
import { auth } from "../../firebase";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";

const LoginPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/";

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, from, navigate]);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        console.log("🌟 getRedirectResult result.user:", result?.user);
        console.log("🔥 auth.currentUser:", auth.currentUser);
      })
      .catch((error) => {
        console.error("Redirect auth error:", error);
      });
  }, []);

  if (loading)
    return (
      <LoadingErrorMessage
        loading={loading} error={null} noResults={false}        />
    );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sign in to GameCollection</h1>
      <LoginButton />
    </div>
  );
};

export default LoginPage;
