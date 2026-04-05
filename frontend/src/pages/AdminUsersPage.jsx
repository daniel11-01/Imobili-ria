import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function AdminUsersPage() {
  const { createAdmin } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setError("");
    try {
      const createdUser = await createAdmin(form);
      setFeedback(`Utilizador administrador criado com sucesso: ${createdUser.email}.`);
      setForm({ firstName: "", lastName: "", email: "", password: "" });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível criar o utilizador administrador.");
    }
  }

  return (
    <section className="card">
      <h1>Gestão de Administradores</h1>
      <p>A criação de administradores é permitida apenas a utilizadores autenticados com perfil admin.</p>

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

        <button className="btn" type="submit">
          Criar administrador
        </button>
      </form>

      {feedback && <p className="success">{feedback}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}

export default AdminUsersPage;
