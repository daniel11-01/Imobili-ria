import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const schema = z.object({
  email: z.string().email("Email invalido."),
  password: z.string().min(8, "Password invalida."),
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
      setServerError(error?.response?.data?.message || "Nao foi possivel concluir a autenticacao.");
    }
  }

  return (
    <section className="card">
      <h1>Autenticacao</h1>
      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register("email")} />
        {errors.email && <p className="error">{errors.email.message}</p>}

        <label htmlFor="password">Password</label>
        <input id="password" type="password" {...register("password")} />
        {errors.password && <p className="error">{errors.password.message}</p>}

        {serverError && <p className="error">{serverError}</p>}

        <button className="btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "A autenticar..." : "Iniciar sessao"}
        </button>
      </form>

      <p>
        A criacao de conta encontra-se disponivel em <Link to="/registo">Registo</Link>.
      </p>
      <p>
        A recuperacao de password encontra-se disponivel em <Link to="/recuperar-password">Recuperar password</Link>.
      </p>
    </section>
  );
}

export default LoginPage;
