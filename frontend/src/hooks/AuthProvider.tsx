import { useEffect, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import {
  setCachedCalendarEvents,
  shouldReloadCalendarCache,
} from "@/lib/calendar-cache";
import type { ApiEvent } from "@/pages/Calendar/types";
import { AuthContext } from "./auth-context";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !shouldReloadCalendarCache(user.uid)) return;

    const prefetchCalendar = async () => {
      try {
        const response = await apiFetch("/api/events");
        if (!response.ok) return;

        const events: ApiEvent[] = await response.json();
        setCachedCalendarEvents(user.uid, events);
      } catch (error) {
        console.error("Failed to prefetch calendar cache:", error);
      }
    };

    void prefetchCalendar();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}
