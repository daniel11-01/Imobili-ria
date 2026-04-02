import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyPropertyStats } from "../api/authApi";

function ProfilePage() {
  const { user, updateProfile, updatePassword, deleteAccount, logout } = useAuth();

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [deletePassword, setDeletePassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [propertyStats, setPropertyStats] = useState([]);
  const [statsSummary, setStatsSummary] = useState({
    totalProperties: 0,
    totalViews: 0,
    totalInterestedContacts: 0,
  });

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
        setStatsError(requestError?.response?.data?.message || "Falha ao carregar estatisticas.");
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
      await updateProfile(profileForm);
      setFeedback("Perfil atualizado com sucesso.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Falha ao atualizar perfil.");
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setError("");
    try {
      await updatePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setFeedback("Password atualizada com sucesso.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Falha ao atualizar password.");
    }
  }

  async function handleDeleteAccount(event) {
    event.preventDefault();
    setFeedback("");
    setError("");
    try {
      await deleteAccount(deletePassword);
      setFeedback("Conta eliminada com sucesso.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Falha ao eliminar conta.");
    }
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <section className="card">
      <h1>Perfil</h1>
      <p>
        Sessao ativa como <strong>{user?.role}</strong>
      </p>

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

        <label htmlFor="lastName">Ultimo nome</label>
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

        <button className="btn" type="submit">
          Guardar perfil
        </button>
      </form>

      <form className="form" onSubmit={handlePasswordSubmit}>
        <h2>Alterar password</h2>
        <label htmlFor="currentPassword">Password atual</label>
        <input
          id="currentPassword"
          type="password"
          value={passwordForm.currentPassword}
          onChange={(event) =>
            setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
          }
        />

        <label htmlFor="newPassword">Nova password</label>
        <input
          id="newPassword"
          type="password"
          value={passwordForm.newPassword}
          onChange={(event) =>
            setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
          }
        />

        <button className="btn" type="submit">
          Atualizar password
        </button>
      </form>

      <form className="form danger-zone" onSubmit={handleDeleteAccount}>
        <h2>Eliminar conta</h2>
        <label htmlFor="deletePassword">Confirma password</label>
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

      <div className="actions">
        <button className="btn btn-secondary" type="button" onClick={handleLogout}>
          Terminar sessao
        </button>
      </div>

      <section className="profile-stats">
        <h2>Estatisticas dos teus imoveis</h2>
        {statsLoading ? (
          <p>A carregar estatisticas...</p>
        ) : statsError ? (
          <p className="error">{statsError}</p>
        ) : propertyStats.length === 0 ? (
          <p>Ainda nao tens imoveis associados como proprietario.</p>
        ) : (
          <>
            <div className="stats-summary grid-3">
              <p>
                <strong>Imoveis:</strong> {statsSummary.totalProperties}
              </p>
              <p>
                <strong>Visualizacoes:</strong> {statsSummary.totalViews}
              </p>
              <p>
                <strong>Interessados:</strong> {statsSummary.totalInterestedContacts}
              </p>
            </div>

            <div className="property-list">
              {propertyStats.map((item) => (
                <article className="property-item" key={item.id}>
                  <h3>
                    #{item.id} - {item.title}
                  </h3>
                  <p>
                    {item.objective} | {item.propertyType} | {item.status}
                  </p>
                  <p>
                    <strong>Visualizacoes:</strong> {item.viewsCount}
                  </p>
                  <p>
                    <strong>Contactos interessados:</strong> {item.interestedContacts}
                  </p>
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
