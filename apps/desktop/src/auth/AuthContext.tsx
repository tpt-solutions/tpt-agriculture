// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CurrentUser } from "./auth-service.js";
import { validateSession } from "./auth-service.js";

interface AuthState {
  user: CurrentUser | null;
  loading: boolean;
  setUser: (user: CurrentUser | null) => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  setUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateSession()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

