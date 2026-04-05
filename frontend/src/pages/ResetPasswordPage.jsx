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
      setError("Token em falta. Deve ser utilizada a ligacao completa recebida por email.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("E necessario preencher ambos os campos de password.");
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
      setError(requestError?.response?.data?.message || "Nao foi possivel redefinir a password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h1>Redefinir Password</h1>
      <p>Deve ser definida uma nova password para a conta.</p>

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
        O acesso a autenticacao encontra-se disponivel em <Link to="/login">Autenticacao</Link>.
      </p>
    </section>
  );
}

export default ResetPasswordPage;
