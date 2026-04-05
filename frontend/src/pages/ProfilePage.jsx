import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyPropertyStats } from "../api/authApi";
import { getBackendBaseUrl } from "../utils/backendBaseUrl";

function buildAvatarSrc(avatarUrl, backendBaseUrl) {
  const source = String(avatarUrl || "").trim();
  if (!source) {
    return "";
  }

  if (/^https?:\/\//i.test(source)) {
    return source;
  }

  return `${backendBaseUrl}${source}`;
}

function getInitials(firstName, lastName) {
  const first = String(firstName || "").trim().charAt(0);
  const last = String(lastName || "").trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "AD";
}

function ProfilePage() {
  const { user, updateProfile, updatePassword, deleteAccount, logout } = useAuth();

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    publicPhone: user?.publicPhone || "",
    licenseNumber: user?.licenseNumber || "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [deletePassword, setDeletePassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [avatarObjectUrl, setAvatarObjectUrl] = useState("");
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [propertyStats, setPropertyStats] = useState([]);
  const [statsSummary, setStatsSummary] = useState({
    totalProperties: 0,
    totalViews: 0,
    totalInterestedContacts: 0,
  });

  const backendBaseUrl = useMemo(() => getBackendBaseUrl(), []);
  const currentAvatarSrc = useMemo(
    () => buildAvatarSrc(profileForm.avatarUrl, backendBaseUrl),
    [backendBaseUrl, profileForm.avatarUrl]
  );
  const avatarPreviewUrl = useMemo(() => {
    return avatarObjectUrl || currentAvatarSrc;
  }, [avatarObjectUrl, currentAvatarSrc]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarObjectUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarObjectUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [avatarFile]);

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      publicPhone: user?.publicPhone || "",
      licenseNumber: user?.licenseNumber || "",
      avatarUrl: user?.avatarUrl || "",
    });
  }, [user]);

  useEffect(() => {
    async function loadStats() {
      try {
        setStatsLoading(true);
        setStatsError("");
        const response = await getMyPropertyStats();
        setPropertyStats(response.stats || []);
        setStatsSummary(
          response.summary || {
            totalProperties: 0,
            totalViews: 0,
            totalInterestedContacts: 0,
          }
        );
      } catch (requestError) {
        setStatsError(requestError?.response?.data?.message || "Não foi possível carregar as estatísticas.");
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats();
  }, []);

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setError("");
    try {
      const payload = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
      };

      if (user?.role === "admin") {
        payload.publicPhone = profileForm.publicPhone;
        payload.licenseNumber = profileForm.licenseNumber;
        payload.removeAvatar = removeAvatar;

        if (avatarFile) {
          payload.avatarFile = avatarFile;
        }
      }

      const updatedUser = await updateProfile(payload);
      setProfileForm((prev) => ({
        ...prev,
        publicPhone: updatedUser?.publicPhone || "",
        licenseNumber: updatedUser?.licenseNumber || "",
        avatarUrl: updatedUser?.avatarUrl || "",
      }));
      setAvatarFile(null);
      setRemoveAvatar(false);
      setFeedback("Os dados de perfil foram atualizados com sucesso.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível atualizar o perfil.");
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setError("");
    try {
      await updatePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setFeedback("A palavra-passe foi atualizada com sucesso.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível atualizar a palavra-passe.");
    }
  }

  async function handleDeleteAccount(event) {
    event.preventDefault();
    setFeedback("");
    setError("");
    try {
      await deleteAccount(deletePassword);
      setFeedback("A conta foi eliminada com sucesso.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível eliminar a conta.");
    }
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <section className="modern-page profile-page">
      <header className="card page-hero">
        <p className="page-hero-badge">Área Pessoal</p>
        <h1>Perfil</h1>
        <p>
          Sessão ativa com perfil <strong>{user?.role}</strong>. A gestão de dados,
          credenciais e estatísticas encontra-se centralizada nesta área.
        </p>
      </header>

      <div className="profile-layout">
        <section className="card">
          <form className="form" onSubmit={handleProfileSubmit}>
            <h2>Dados pessoais</h2>
            <label htmlFor="firstName">Primeiro nome</label>
            <input
              id="firstName"
              type="text"
              value={profileForm.firstName}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, firstName: event.target.value }))
              }
            />

            <label htmlFor="lastName">Último nome</label>
            <input
              id="lastName"
              type="text"
              value={profileForm.lastName}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, lastName: event.target.value }))
              }
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={profileForm.email}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, email: event.target.value }))
              }
            />

            {user?.role === "admin" && (
              <section className="admin-digital-card">
                <h3>Cartão digital do responsável</h3>

                <div className="admin-card-preview">
                  {avatarPreviewUrl && !removeAvatar ? (
                    <img src={avatarPreviewUrl} alt="Avatar do administrador" />
                  ) : (
                    <div className="avatar-fallback">
                      {getInitials(profileForm.firstName, profileForm.lastName)}
                    </div>
                  )}

                  <div>
                    <p>
                      <strong>
                        {profileForm.firstName} {profileForm.lastName}
                      </strong>
                    </p>
                    <p>{profileForm.email}</p>
                    <p>{profileForm.publicPhone || "Sem contacto público definido"}</p>
                    <p>{profileForm.licenseNumber || "Sem número profissional definido"}</p>
                  </div>
                </div>

                <label htmlFor="publicPhone">Contacto público</label>
                <input
                  id="publicPhone"
                  value={profileForm.publicPhone}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, publicPhone: event.target.value }))
                  }
                  placeholder="Ex: +351 9XX XXX XXX"
                />

                <label htmlFor="licenseNumber">Número profissional</label>
                <input
                  id="licenseNumber"
                  value={profileForm.licenseNumber}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, licenseNumber: event.target.value }))
                  }
                  placeholder="Ex: AMI 00000"
                />

                <label htmlFor="avatar">Fotografia de perfil</label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setAvatarFile(file);
                    if (file) {
                      setRemoveAvatar(false);
                    }
                  }}
                />

                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={removeAvatar}
                    onChange={(event) => setRemoveAvatar(event.target.checked)}
                  />
                  Remover fotografia atual
                </label>
              </section>
            )}

            <button className="btn" type="submit">
              Guardar perfil
            </button>
          </form>
        </section>

        <section className="card">
          <form className="form" onSubmit={handlePasswordSubmit}>
            <h2>Alterar palavra-passe</h2>
            <label htmlFor="currentPassword">Palavra-passe atual</label>
            <input
              id="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
            />

            <label htmlFor="newPassword">Nova palavra-passe</label>
            <input
              id="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
              }
            />

            <button className="btn" type="submit">
              Atualizar palavra-passe
            </button>
          </form>

          <div className="actions">
            <button className="btn btn-secondary" type="button" onClick={handleLogout}>
              Terminar sessão
            </button>
          </div>
        </section>

        <section className="card">
          <form className="form danger-zone" onSubmit={handleDeleteAccount}>
            <h2>Eliminar conta</h2>
            <label htmlFor="deletePassword">Confirmar palavra-passe</label>
            <input
              id="deletePassword"
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
            />
            <button className="btn btn-danger" type="submit">
              Eliminar conta
            </button>
          </form>
        </section>
      </div>

      <section className="card profile-stats">
        <h2>Estatísticas dos imóveis associados</h2>
        {statsLoading ? (
          <p>A carregar estatísticas...</p>
        ) : statsError ? (
          <p className="error">{statsError}</p>
        ) : propertyStats.length === 0 ? (
          <p>Não existem imóveis associados como proprietário.</p>
        ) : (
          <>
            <div className="stats-kpi-grid">
              <article className="stats-kpi-card">
                <p className="stats-kpi-label">Imóveis</p>
                <p className="stats-kpi-value">{statsSummary.totalProperties}</p>
              </article>
              <article className="stats-kpi-card">
                <p className="stats-kpi-label">Visualizações</p>
                <p className="stats-kpi-value">{statsSummary.totalViews}</p>
              </article>
              <article className="stats-kpi-card">
                <p className="stats-kpi-label">Interessados</p>
                <p className="stats-kpi-value">{statsSummary.totalInterestedContacts}</p>
              </article>
            </div>

            <div className="property-list profile-property-grid">
              {propertyStats.map((item) => (
                <article className="property-item profile-property-card" key={item.id}>
                  <h3>
                    #{item.id} - {item.title}
                  </h3>
                  <p className="profile-property-meta">
                    {item.objective} | {item.propertyType} | {item.status}
                  </p>
                  <div className="profile-property-stats">
                    <p>
                      <strong>Visualizações:</strong> {item.viewsCount}
                    </p>
                    <p>
                      <strong>Contactos interessados:</strong> {item.interestedContacts}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {feedback && <p className="success">{feedback}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}

export default ProfilePage;
