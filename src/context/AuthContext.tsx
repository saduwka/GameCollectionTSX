import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode
} from "react";

import {
  onAuthStateChanged,
  getRedirectResult,
  type User
} from "firebase/auth";

import { auth } from "../firebase";
import { useLocation, useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const hasRedirectHandled = useRef(false);

  useEffect(() => {
    if (hasRedirectHandled.current) return;
    hasRedirectHandled.current = true;

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("✅ Redirect result user:", result.user);
          setUser(result.user);
          navigate(location.pathname, { replace: true });
        }
      })
      .catch((error) => {
        console.error("🚨 Redirect error:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("👤 Auth state changed:", firebaseUser);
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
