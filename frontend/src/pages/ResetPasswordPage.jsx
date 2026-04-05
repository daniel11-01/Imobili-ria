import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authApi";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => String(searchParams.get("token") || "").trim(), [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setError("");

    if (!token) {
      setError("Token em falta. Deve ser utilizada a ligação completa recebida por email.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("É necessário preencher ambos os campos de palavra-passe.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    try {
      setLoading(true);
      const response = await resetPassword({ token, newPassword });
      setFeedback(response?.message || "Palavra-passe redefinida com sucesso.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível redefinir a palavra-passe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="modern-page auth-page">
      <header className="card page-hero">
        <p className="page-hero-badge">Atualização de Credenciais</p>
        <h1>Redefinir palavra-passe</h1>
        <p>
          Defina uma nova palavra-passe para restabelecer o acesso à conta
          através do token de recuperação recebido por email.
        </p>
      </header>

      <section className="card auth-panel">
        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="newPassword">Nova palavra-passe</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={8}
            required
          />

          <label htmlFor="confirmPassword">Confirmar nova palavra-passe</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
          />

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "A guardar..." : "Guardar nova palavra-passe"}
          </button>
        </form>

        {feedback && <p className="success">{feedback}</p>}
        {error && <p className="error">{error}</p>}

        <div className="auth-links">
          <p>
            O acesso à autenticação encontra-se disponível em <Link to="/login">Autenticação</Link>.
          </p>
        </div>
      </section>
    </section>
  );
}

export default ResetPasswordPage;
