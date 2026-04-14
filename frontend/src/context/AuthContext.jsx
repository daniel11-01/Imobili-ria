import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/authApi";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrapSession() {
      try {
        const response = await authApi.me();
        setUser(response.user || null);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrapSession();
  }, []);

  async function register(payload) {
    const response = await authApi.register(payload);
    setUser(response.user);
    return response.user;
  }

  async function login(payload) {
    const response = await authApi.login(payload);
    setUser(response.user);
    return response.user;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch (error) {
      // Keep UX resilient if the server session is already invalid or temporarily unreachable.
    } finally {
      setUser(null);
    }
  }

  async function refreshMe() {
    const response = await authApi.me();
    setUser(response.user);
    return response.user;
  }

  async function updateProfile(payload) {
    const response = await authApi.updateProfile(payload);
    setUser(response.user);
    return response.user;
  }

  async function updatePassword(payload) {
    await authApi.updatePassword(payload);
  }

  async function deleteAccount(password) {
    await authApi.deleteAccount(password);
    setUser(null);
  }

  async function createAdmin(payload) {
    const response = await authApi.createAdmin(payload);
    return response.user;
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      register,
      login,
      logout,
      refreshMe,
      updateProfile,
      updatePassword,
      deleteAccount,
      createAdmin,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth tem de ser usado dentro de AuthProvider.");
  }
  return context;
}

export { AuthProvider, useAuth };
