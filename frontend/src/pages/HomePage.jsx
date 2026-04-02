import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function HomePage() {
  const { user } = useAuth();

  return (
    <section className="card">
      <h1>Projeto Imobiliaria</h1>
      <p>
        Sprint 3 ativo: catalogo publico com filtros, ordenacao e pagina de detalhe
        do imovel.
      </p>
      <div className="actions">
        <Link className="btn btn-secondary" to="/imoveis">
          Explorar catalogo
        </Link>
      </div>
      {!user ? (
        <div className="actions">
          <Link className="btn" to="/login">
            Entrar
          </Link>
          <Link className="btn btn-secondary" to="/registo">
            Criar conta cliente
          </Link>
        </div>
      ) : (
        <div className="actions">
          <Link className="btn" to="/perfil">
            Ir para perfil
          </Link>
          {user.role === "admin" && (
            <>
              <Link className="btn btn-secondary" to="/admin/utilizadores">
                Gestao de admins
              </Link>
              <Link className="btn btn-secondary" to="/admin/imoveis">
                Gestao de imoveis
              </Link>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default HomePage;
