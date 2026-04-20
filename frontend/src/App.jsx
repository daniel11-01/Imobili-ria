import { Suspense, lazy } from "react";
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import brandLogo from "./assets/logotipo-transparent.png";

const FACEBOOK_URL = "https://www.facebook.com/ERUDITEPRELUDE";
const INSTAGRAM_URL = "https://www.instagram.com/eruditeprelude";

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
  const currentYear = new Date().getFullYear();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" to="/">
            <img
              className="brand-logo"
              src={brandLogo}
              alt="Logotipo EURODITEPRELUDE"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "";
              }}
            />
            <span className="brand-text">
              <span className="brand-kicker">EURODITEPRELUDE</span>
              <span className="brand-name">A Chave que abre portas e que revela novos caminhos</span>
            </span>
          </Link>

          <nav className="menu" aria-label="Navegação principal">
            <NavLink className="menu-link" to="/imoveis">
              Catálogo
            </NavLink>
            {!user && (
              <NavLink className="menu-link" to="/login">
                Autenticação
              </NavLink>
            )}
            {!user && (
              <NavLink className="menu-link menu-link-cta" to="/registo">
                Registo
              </NavLink>
            )}
            {user && (
              <NavLink className="menu-link" to="/perfil">
                Área Pessoal
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink className="menu-link" to="/admin/utilizadores">
                Admins
              </NavLink>
            )}
            {(user?.role === "admin" || user?.role === "colaborador") && (
              <NavLink className="menu-link" to="/admin/imoveis">
                Imóveis
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink className="menu-link" to="/admin/mensagens">
                Mensagens
              </NavLink>
            )}
            {user && (
              <button className="menu-link menu-link-ghost" type="button" onClick={logout}>
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
                <ProtectedRoute roles={["admin", "colaborador"]}>
                  <AdminPropertiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/imoveis/:propertyId/editar"
              element={
                <ProtectedRoute roles={["admin", "colaborador"]}>
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
            <img
              className="site-footer-logo"
              src={brandLogo}
              alt="Logotipo EURODITEPRELUDE"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "";
              }}
            />
            <div>
              <p className="site-footer-brand">EURODITEPRELUDE</p>
              <p className="site-footer-copy">
                A Chave que abre portas e que revela novos caminhos.
              </p>
            </div>
          </div>

          <div className="site-footer-col">
            <p className="site-footer-heading">Navegação</p>
            <div className="site-footer-links">
              <Link to="/imoveis">Catálogo de Imóveis</Link>
              {!user && <Link to="/login">Autenticação</Link>}
              {!user && <Link to="/registo">Criar Conta</Link>}
              {user && <Link to="/perfil">Área Pessoal</Link>}
              <Link to="/politica-privacidade">Política de Privacidade</Link>
            </div>
          </div>

          <div className="site-footer-col site-footer-contacts">
            <p className="site-footer-heading">Presença Digital</p>
            <div className="site-footer-links" aria-label="Redes sociais oficiais">
              <a href={FACEBOOK_URL} target="_blank" rel="noreferrer">
                Facebook
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p>© {currentYear} EURODITEPRELUDE. Todos os direitos reservados.</p>
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
