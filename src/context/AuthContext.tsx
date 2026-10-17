import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import { collectionKeys, invalidateUserLibrary } from "../services/collection/queryKeys";
import { hasGuestData, syncGuestData } from "../services/collection/syncGuestData";
import { ensurePublicProfile } from "../services/collection/collectionService";

interface AuthContextType {
  user: User | null;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const queryClient = useQueryClient();
  const previousUserRef = useRef<User | null>(null);
  const hasSeenAuth = useRef(false);
  const migratedUid = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const previous = previousUserRef.current;
      const becameUser = hasSeenAuth.current && previous === null && currentUser !== null;
      const initialWithGuest = !hasSeenAuth.current && currentUser !== null && hasGuestData();
      previousUserRef.current = currentUser;
      hasSeenAuth.current = true;
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser && migratedUid.current !== currentUser.uid) {
        migratedUid.current = currentUser.uid;
        void ensurePublicProfile().catch((error) => {
          migratedUid.current = null;
          console.error("Public profile migration failed", error);
        });
      }

      if (!currentUser || (!becameUser && !initialWithGuest)) return;

      void syncGuestData()
        .then(async (changed) => {
          if (!changed) return;
          await invalidateUserLibrary(queryClient, currentUser.uid);
          await queryClient.invalidateQueries({ queryKey: collectionKeys.devices(currentUser.uid) });
          await queryClient.invalidateQueries({ queryKey: collectionKeys.settings(currentUser.uid) });
        })
        .catch((error) => {
          console.error("Guest sync failed", error);
        });
    });

    return () => unsubscribe();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
