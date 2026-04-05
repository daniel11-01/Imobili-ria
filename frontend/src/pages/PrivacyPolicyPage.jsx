function PrivacyPolicyPage() {
  return (
    <section className="modern-page">
      <header className="card page-hero">
        <p className="page-hero-badge">Conformidade e Segurança</p>
        <h1>Política de Privacidade</h1>
        <p>
          O tratamento de dados pessoais é realizado com base em necessidade operacional,
          proporcionalidade e proteção efetiva da informação.
        </p>
      </header>

      <section className="card">
        <h2>Dados recolhidos</h2>
        <p>
          A plataforma recolhe apenas os dados estritamente necessários para criação de conta,
          gestão de contactos de imóveis e suporte comercial.
        </p>
      </section>

      <section className="card">
        <h2>Finalidade e utilização</h2>
        <p>
          Os dados podem incluir nome, email, telefone (quando fornecido) e mensagens enviadas
          através dos formulários. A plataforma não comercializa dados pessoais com terceiros.
        </p>
      </section>

      <section className="card">
        <h2>Direitos do titular</h2>
        <p>
          O titular dos dados tem direito de acesso, retificação e eliminação dos respetivos
          dados pessoais. Estes direitos podem ser exercidos na área de perfil ou por contacto
          direto com a equipa da plataforma.
        </p>
      </section>

      <section className="card">
        <h2>Medidas técnicas</h2>
        <p>
          Para reforço de segurança, a plataforma utiliza autenticação por token, palavra-passe
          cifrada e mecanismos de proteção anti-spam nos formulários.
        </p>
      </section>
    </section>
  );
}

export default PrivacyPolicyPage;
