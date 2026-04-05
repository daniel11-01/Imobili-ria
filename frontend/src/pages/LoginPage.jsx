import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const schema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "Palavra-passe inválida."),
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (user) {
    return <Navigate to="/perfil" replace />;
  }

  async function onSubmit(values) {
    setServerError("");
    try {
      await login(values);
      navigate("/perfil", { replace: true });
    } catch (error) {
      setServerError(error?.response?.data?.message || "Não foi possível concluir a autenticação.");
    }
  }

  return (
    <section className="modern-page auth-page">
      <header className="card page-hero">
        <p className="page-hero-badge">Área Reservada</p>
        <h1>Autenticação</h1>
        <p>
          O acesso à área pessoal é protegido e permite gestão de perfil,
          contactos e operações associadas à conta.
        </p>
      </header>

      <section className="card auth-panel">
        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" {...register("email")} />
          {errors.email && <p className="error">{errors.email.message}</p>}

          <label htmlFor="password">Palavra-passe</label>
          <input id="password" type="password" {...register("password")} />
          {errors.password && <p className="error">{errors.password.message}</p>}

          {serverError && <p className="error">{serverError}</p>}

          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "A autenticar..." : "Iniciar sessão"}
          </button>
        </form>

        <div className="auth-links">
          <p>
            A criação de conta encontra-se disponível em <Link to="/registo">Registo</Link>.
          </p>
          <p>
            A recuperação de palavra-passe encontra-se disponível em <Link to="/recuperar-password">Recuperar palavra-passe</Link>.
          </p>
        </div>
      </section>
    </section>
  );
}

export default LoginPage;
