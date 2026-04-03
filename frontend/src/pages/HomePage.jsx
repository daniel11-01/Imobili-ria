import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function HomePage() {
  const { user } = useAuth();

  return (
    <section className="home-page">
      <div className="hero-panel card">
        <p className="eyebrow">Mercado Imobiliario em Vila Real</p>
        <h1>Comparar casas nunca foi tao claro</h1>
        <p className="hero-copy">
          Pesquisa com filtros detalhados, compara ate 3 imoveis lado a lado e decide com
          dados reais: preco, area, tipologia e localizacao.
        </p>

        <div className="actions hero-actions">
          <Link className="btn" to="/imoveis">
            Ver imoveis disponiveis
          </Link>
          <Link className="btn btn-secondary" to="/imoveis?objective=comprar&sortBy=recent&page=1">
            Quero comprar
          </Link>
          <Link className="btn btn-secondary" to="/imoveis?objective=arrendar&sortBy=recent&page=1">
            Quero arrendar
          </Link>
        </div>
      </div>

      <div className="home-kpis">
        <article className="card kpi-card">
          <p className="kpi-value">Filtro Avancado</p>
          <p className="kpi-label">Objetivo, tipologia, localizacao, preco e mais criterios.</p>
        </article>
        <article className="card kpi-card">
          <p className="kpi-value">Comparacao Direta</p>
          <p className="kpi-label">Escolhe ate 3 opcoes e compara diferencas em segundos.</p>
        </article>
        <article className="card kpi-card">
          <p className="kpi-value">Contacto Imediato</p>
          <p className="kpi-label">Fala com o agente do imovel sem sair da plataforma.</p>
        </article>
      </div>

      {!user ? (
        <div className="card home-auth-card">
          <h2>Comeca em menos de 1 minuto</h2>
          <p>
            Cria conta para guardar pesquisas e gerir os teus contactos com maior rapidez.
          </p>
          <div className="actions">
            <Link className="btn" to="/registo">
              Criar conta
            </Link>
            <Link className="btn btn-secondary" to="/login">
              Ja tenho conta
            </Link>
          </div>
        </div>
      ) : (
        <div className="card home-auth-card">
          <h2>Bem-vindo de volta</h2>
          <p>Continua a tua pesquisa ou gere a tua area reservada.</p>
          <div className="actions">
            <Link className="btn" to="/perfil">
              Ir para perfil
            </Link>
            <Link className="btn btn-secondary" to="/imoveis">
              Explorar catalogo
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
        </div>
      )}
    </section>
  );
}

export default HomePage;
