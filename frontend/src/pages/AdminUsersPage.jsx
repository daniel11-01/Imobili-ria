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
      setFeedback(`Admin criado com sucesso: ${createdUser.email}`);
      setForm({ firstName: "", lastName: "", email: "", password: "" });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Falha ao criar admin.");
    }
  }

  return (
    <section className="card">
      <h1>Gestao de Admins</h1>
      <p>Apenas admins autenticados podem criar novos admins.</p>

      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="firstName">Primeiro nome</label>
        <input
          id="firstName"
          type="text"
          value={form.firstName}
          onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
        />

        <label htmlFor="lastName">Ultimo nome</label>
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

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />

        <button className="btn" type="submit">
          Criar admin
        </button>
      </form>

      {feedback && <p className="success">{feedback}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}

export default AdminUsersPage;
