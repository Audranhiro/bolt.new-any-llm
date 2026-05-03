import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=loading, false=guest, obj=logged
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("apa_token");
      if (!token) {
        setUser(false);
        setBooted(true);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch {
        localStorage.removeItem("apa_token");
        setUser(false);
      } finally {
        setBooted(true);
      }
    })();
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token) localStorage.setItem("apa_token", data.token);
    const u = { id: data.id, email: data.email, role: data.role };
    setUser(u);
    return u;
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    if (data.token) localStorage.setItem("apa_token", data.token);
    const u = { id: data.id, email: data.email, role: data.role };
    setUser(u);
    return u;
  }

  async function logout() {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem("apa_token");
    setUser(false);
  }

  return (
    <AuthContext.Provider value={{ user, booted, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
