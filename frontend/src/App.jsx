import { Suspense, lazy } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import brandLogo from "./assets/logotipo.jpeg";

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
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));

function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" to="/">
            <img className="brand-logo" src={brandLogo} alt="Logotipo EURODITEPRELUDE" />
            <span className="brand-text">
              <span className="brand-kicker">EURODITEPRELUDE</span>
              <span className="brand-name">A Chave que abre portas e que revela novos caminhos</span>
            </span>
          </Link>

          <nav className="menu" aria-label="Navegação principal">
            <Link to="/">Página Inicial</Link>
            <Link to="/#sobre-nos">Sobre a Marca</Link>
            <Link to="/imoveis">Catálogo</Link>
            {!user && <Link to="/login">Autenticação</Link>}
            {!user && <Link to="/registo">Registo</Link>}
            {user && <Link to="/perfil">Área Pessoal</Link>}
            {user?.role === "admin" && <Link to="/admin/utilizadores">Administradores</Link>}
            {user?.role === "admin" && <Link to="/admin/imoveis">Gestão de Imóveis</Link>}
            {user?.role === "admin" && <Link to="/admin/mensagens">Mensagens</Link>}
            {user && (
              <button className="link-btn" type="button" onClick={logout}>
                Encerrar Sessão
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="page-shell">
        <Suspense fallback={<p>A carregar página...</p>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sobre" element={<Navigate to="/" replace />} />
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

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand-block">
            <img className="site-footer-logo" src={brandLogo} alt="Logotipo EURODITEPRELUDE" />
            <div>
              <p className="site-footer-brand">EURODITEPRELUDE</p>
              <p className="site-footer-copy">
                A Chave que abre portas e que revela novos caminhos.
              </p>
              <p className="site-footer-note">Contactos e logotipo serão disponibilizados em breve.</p>
            </div>
          </div>

          <div className="site-footer-links" aria-label="Redes sociais">
            <a href="#" aria-label="Instagram">
              Instagram
            </a>
            <a href="#" aria-label="Facebook">
              Facebook
            </a>
            <a href="#" aria-label="LinkedIn">
              LinkedIn
            </a>
          </div>

          <div className="site-footer-legal">
            <Link to="/politica-privacidade">Política de Privacidade</Link>
          </div>
        </div>
      </footer>
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
