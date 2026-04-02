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
      setError("Token em falta. Usa o link completo recebido por email.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Preenche os dois campos de password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As passwords nao coincidem.");
      return;
    }

    try {
      setLoading(true);
      const response = await resetPassword({ token, newPassword });
      setFeedback(response?.message || "Password redefinida com sucesso.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Falha ao redefinir password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h1>Redefinir Password</h1>
      <p>Define uma nova password para a tua conta.</p>

      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="newPassword">Nova password</label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={8}
          required
        />

        <label htmlFor="confirmPassword">Confirmar nova password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          required
        />

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "A guardar..." : "Guardar nova password"}
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

export default ResetPasswordPage;
