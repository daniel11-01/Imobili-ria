import { Suspense, lazy } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminPropertiesPage = lazy(() => import("./pages/AdminPropertiesPage"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const PropertyDetailPage = lazy(() => import("./pages/PropertyDetailPage"));
const AdminPropertyEditPage = lazy(() => import("./pages/AdminPropertyEditPage"));
const AdminMessagesPage = lazy(() => import("./pages/AdminMessagesPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));

function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" to="/">
            <span className="brand-kicker">Erudite Prelude</span>
            <span className="brand-name">A chave para escolher com confianca</span>
          </Link>

          <nav className="menu" aria-label="Navegacao principal">
            <Link to="/">Inicio</Link>
            <Link to="/sobre">Sobre Nos</Link>
            <Link to="/imoveis">Imoveis</Link>
            <Link to="/politica-privacidade">Privacidade</Link>
            {!user && <Link to="/login">Login</Link>}
            {!user && <Link to="/registo">Registo</Link>}
            {user && <Link to="/perfil">Perfil</Link>}
            {user?.role === "admin" && <Link to="/admin/utilizadores">Admins</Link>}
            {user?.role === "admin" && <Link to="/admin/imoveis">Imoveis</Link>}
            {user?.role === "admin" && <Link to="/admin/mensagens">Mensagens</Link>}
            {user && (
              <button className="link-btn" type="button" onClick={logout}>
                Sair
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="page-shell">
        <Suspense fallback={<p>A carregar pagina...</p>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="/politica-privacidade" element={<PrivacyPolicyPage />} />
            <Route path="/imoveis" element={<CatalogPage />} />
            <Route path="/imoveis/:propertyId" element={<PropertyDetailPage />} />
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/perfil" replace />} />
            <Route path="/registo" element={!user ? <RegisterPage /> : <Navigate to="/perfil" replace />} />
            <Route path="/recuperar-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/perfil" replace />} />
            <Route path="/reset-password" element={!user ? <ResetPasswordPage /> : <Navigate to="/perfil" replace />} />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/utilizadores"
              element={
                <ProtectedRoute role="admin">
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/imoveis"
              element={
                <ProtectedRoute role="admin">
                  <AdminPropertiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/imoveis/:propertyId/editar"
              element={
                <ProtectedRoute role="admin">
                  <AdminPropertyEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/mensagens"
              element={
                <ProtectedRoute role="admin">
                  <AdminMessagesPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
