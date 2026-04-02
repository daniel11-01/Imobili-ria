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
      setFeedback(response?.message || "Se o email existir, vais receber instrucoes para redefinir a password.");
      setEmail("");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Falha ao iniciar recuperacao de password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h1>Recuperar Password</h1>
      <p>Indica o teu email para receberes o link de redefinicao.</p>

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
          {loading ? "A enviar..." : "Enviar link"}
        </button>
      </form>

      {feedback && <p className="success">{feedback}</p>}
      {error && <p className="error">{error}</p>}

      <p>
        Voltar para <Link to="/login">login</Link>.
      </p>
    </section>
  );
}

export default ForgotPasswordPage;
