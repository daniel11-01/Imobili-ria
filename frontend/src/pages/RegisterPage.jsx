import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const schema = z
  .object({
    firstName: z.string().min(2, "Primeiro nome obrigatório."),
    lastName: z.string().min(2, "Último nome obrigatório."),
    email: z.string().email("Email inválido."),
    password: z
      .string()
      .min(8, "Mínimo de 8 caracteres.")
      .regex(/[a-zA-Z]/, "Deve incluir letras.")
      .regex(/\d/, "Deve incluir números."),
    confirmPassword: z.string(),
    acceptPrivacyPolicy: z.literal(true, {
      errorMap: () => ({ message: "A aceitação da política de privacidade é obrigatória." }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmPassword"],
  });

function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, user } = useAuth();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptPrivacyPolicy: false,
    },
  });

  if (user) {
    return <Navigate to="/perfil" replace />;
  }

  async function onSubmit(values) {
    setServerError("");
    try {
      await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        acceptPrivacyPolicy: values.acceptPrivacyPolicy,
      });
      navigate("/perfil", { replace: true });
    } catch (error) {
      setServerError(error?.response?.data?.message || "Não foi possível concluir o registo.");
    }
  }

  return (
    <section className="card">
      <h1>Criar conta cliente</h1>
      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="firstName">Primeiro nome</label>
        <input id="firstName" type="text" {...register("firstName")} />
        {errors.firstName && <p className="error">{errors.firstName.message}</p>}

        <label htmlFor="lastName">Último nome</label>
        <input id="lastName" type="text" {...register("lastName")} />
        {errors.lastName && <p className="error">{errors.lastName.message}</p>}

        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register("email")} />
        {errors.email && <p className="error">{errors.email.message}</p>}

        <label htmlFor="password">Palavra-passe</label>
        <input id="password" type="password" {...register("password")} />
        {errors.password && <p className="error">{errors.password.message}</p>}

        <label htmlFor="confirmPassword">Confirmar palavra-passe</label>
        <input id="confirmPassword" type="password" {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="error">{errors.confirmPassword.message}</p>}

        <label className="checkbox">
          <input type="checkbox" {...register("acceptPrivacyPolicy")} />
          É declarada a aceitação da <Link to="/politica-privacidade">política de privacidade</Link> e do tratamento de dados.
        </label>
        {errors.acceptPrivacyPolicy && (
          <p className="error">{errors.acceptPrivacyPolicy.message}</p>
        )}

        {serverError && <p className="error">{serverError}</p>}

        <button className="btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "A registar..." : "Submeter registo"}
        </button>
      </form>

      <p>
        A autenticação de contas existentes encontra-se disponível em <Link to="/login">Autenticação</Link>.
      </p>
    </section>
  );
}

export default RegisterPage;
