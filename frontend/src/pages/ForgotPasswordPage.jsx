import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/authApi";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setError("");

    try {
      setLoading(true);
      const response = await forgotPassword({ email });
      setFeedback(response?.message || "Se o email existir, serão enviadas instruções para redefinição da palavra-passe.");
      setEmail("");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível iniciar a recuperação de palavra-passe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="modern-page auth-page">
      <header className="card page-hero">
        <p className="page-hero-badge">Recuperação de Acesso</p>
        <h1>Recuperar palavra-passe</h1>
        <p>
          Através do email registado, a plataforma envia instruções seguras para
          redefinição da palavra-passe.
        </p>
      </header>

      <section className="card auth-panel">
        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "A enviar..." : "Enviar ligação de redefinição"}
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

export default ForgotPasswordPage;
