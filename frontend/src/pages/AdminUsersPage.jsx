import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function AdminUsersPage() {
  const { createStaff } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setError("");
    try {
      const createdUser = await createStaff(form);
      setFeedback(`Utilizador criado com sucesso: ${createdUser.email} (${createdUser.role}).`);
      setForm({ firstName: "", lastName: "", email: "", password: "", role: "admin" });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível criar o utilizador de equipa.");
    }
  }

  return (
    <section className="modern-page admin-page">
      <header className="card page-hero">
        <p className="page-hero-badge">Backoffice</p>
        <h1>Gestão de Equipa</h1>
        <p>
          A criação de administradores e colaboradores encontra-se limitada a sessões com perfil admin,
          garantindo controlo e rastreabilidade das permissões de gestão.
        </p>
      </header>

      <section className="card">
        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="firstName">Primeiro nome</label>
          <input
            id="firstName"
            type="text"
            value={form.firstName}
            onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
          />

          <label htmlFor="lastName">Último nome</label>
          <input
            id="lastName"
            type="text"
            value={form.lastName}
            onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />

          <label htmlFor="password">Palavra-passe</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />

          <label htmlFor="role">Perfil</label>
          <select
            id="role"
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
          >
            <option value="admin">Administrador</option>
            <option value="colaborador">Colaborador</option>
          </select>

          <button className="btn" type="submit">
            Criar utilizador de equipa
          </button>
        </form>

        {feedback && <p className="success">{feedback}</p>}
        {error && <p className="error">{error}</p>}
      </section>
    </section>
  );
}

export default AdminUsersPage;
