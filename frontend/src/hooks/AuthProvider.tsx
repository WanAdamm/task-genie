import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  clearCalendarCache,
  ensureCalendarFresh,
} from "@/lib/calendar-cache";
import { AuthContext } from "./auth-context";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      const nextUserId = nextUser?.uid ?? null;
      if (previousUserId.current && previousUserId.current !== nextUserId) {
        clearCalendarCache(previousUserId.current);
      }
      previousUserId.current = nextUserId;
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    void ensureCalendarFresh(user.uid).catch((error) => {
      console.error("Failed to prefetch calendar cache:", error);
    });
  }, [user]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logOut = async () => {
    const userId = auth.currentUser?.uid;
    await signOut(auth);
    if (userId) clearCalendarCache(userId);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}
