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
    <section className="card">
      <h1>Recuperar Palavra-passe</h1>
      <p>Deve ser indicado o email para receção da ligação de redefinição.</p>

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

      <p>
        O acesso à autenticação encontra-se disponível em <Link to="/login">Autenticação</Link>.
      </p>
    </section>
  );
}

export default ForgotPasswordPage;
