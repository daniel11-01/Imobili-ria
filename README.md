# Planeamento

## Estado de Implementacao (Atualizado em 2026-04-02)

### Blocos concluidos

- [x] **Sprint 1 a Sprint 5 core**: autenticacao, CRUD de imoveis, catalogo publico, detalhe de imovel, contacto com persistencia e inbox admin de mensagens.
- [x] **Bloco A (Hardening inicial)**:
    - rate limit para `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`.
    - limpeza oportunistica de `password_reset_tokens` expirados/usados.
- [x] **Bloco B (Base de testes automatizados backend)**:
    - testes para auth (`login`, `forgot-password`, `reset-password`).
    - testes para mensagens admin (listagem e marcar lida/nao lida).
    - teste para exigencia de consentimento RGPD no contacto.
- [x] **Bloco C (Performance de bundle frontend)**:
    - code splitting por rota com `React.lazy` + `Suspense`.
    - reducao do chunk principal com separacao de paginas.

### Funcionalidades ja entregues (resumo funcional)

- Recuperacao de password funcional com token temporario e email.
- Paginas publicas: Sobre Nos e Politica de Privacidade.
- Consentimento RGPD obrigatorio em registo e contacto.
- Perfil do cliente com estatisticas dos imoveis associados (visualizacoes e interessados).
- Detalhe do imovel com mapa (Leaflet), partilha social e metadados Open Graph.

### Proximos passos priorizados

1. **Bloco E - Testes de frontend e fluxos criticos E2E**
     - Validar rotas de recuperacao de password no frontend.
     - Validar fluxo de mensagens admin (filtros e alteracao de estado).
     - Validar formulario de contacto com consentimento RGPD.
2. **Bloco F - Operacao e observabilidade**
     - Log estruturado de erros por endpoint.
     - Politica de retencao/limpeza adicional para dados operacionais (mensagens e tokens antigos).
3. **Bloco G - Preparacao para deploy cPanel**
     - Checklist final de `.env` de producao.
     - Revisao de CORS/cookies para dominio final.
     - Smoke test pos-deploy com checklist de regressao.

### Nota de Producao (uploads persistentes)

- O backend usa `UPLOADS_ROOT` para definir onde guarda imagens de imoveis e avatares.
- Em ambiente local, o valor por omissao e `./public/uploads`.
- Em Render, configura um **Persistent Disk** e define `UPLOADS_ROOT` para o caminho montado (por exemplo, `/var/data/uploads`).
- Sem disco persistente, os ficheiros podem desaparecer em restart/cold start.

## Stack de Tecnologias & Bibliotecas Sugeridas (O "Motor")

### Backend (Node.js)

- **Framework Base:** `Express.js` (O standard da indústria para criar a API).
- **Upload de Ficheiros:** `Multer`. É esta a biblioteca que vai receber as fotos do frontend antes de as passares para o `Sharp` redimensionar.
- **Comunicação com MariaDB:** Recomendo o `Sequelize` (um ORM). Ele trata das *Prepared Statements* automaticamente (contra SQL Injection) e facilita muito a criação das tabelas no MariaDB.
- **Segurança (Dica de Ouro cPanel):** Usa a biblioteca `bcryptjs` em vez da `bcrypt` normal. A versão "js" é feita em JavaScript puro e não precisa de compilação C++, o que evita 99% dos erros de instalação no cPanel.
- **Proteção de Força Bruta:** `express-rate-limit`. Bloqueia o IP de alguém que tente fazer login com passwords erradas 10 vezes seguidas ou que faça spam no formulário de contacto.

### Frontend (React)

- **Gestão de Formulários:** `react-hook-form` combinado com `Zod`. Isto garante que o utilizador preenche o email corretamente e as passwords coincidem *antes* de enviar para o servidor, tornando o site muito mais rápido.
- **Mapas (Requisito 3.4):** Em vez da API do Google Maps (que exige cartão de crédito e pode ter custos surpresa), recomendo usares o **Leaflet** com o **React-Leaflet** (são 100% gratuitos e usam os mapas do OpenStreetMap).
- **Navegação e Partilha:** `react-router-dom` para mudar de página sem recarregar o site.

## Documento de Requisitos Funcionais (Site Imobiliário)

### 1. Módulo de Autenticação e Gestão de Conta (Geral)

- **1.1. Registo de Utilizador:** O sistema deve permitir que novos utilizadores criem uma conta fornecendo: Nome (Primeiro e Último), Email e Password.
- **1.2. Login:** O sistema deve permitir a autenticação de utilizadores registados através de Email e Password.
- **1.3. Recuperação de Password:** O sistema deve fornecer um mecanismo para recuperar a palavra-passe esquecida (ex: envio de link de redefinição para o email).
- **1.4. Gestão de Perfil:** O utilizador autenticado deve poder editar os seus dados pessoais (Nome, Email, Password).
- **1.5. Eliminação de Conta:** O sistema deve permitir que o utilizador elimine o seu próprio perfil de forma permanente (cumprimento do "Direito ao Esquecimento" do RGPD).

### 2. Navegação Pública (Acesso Livre)

O sistema deve disponibilizar acesso público às seguintes páginas estáticas e dinâmicas:

- **2.1. Páginas Institucionais e de Autenticação:** "Sobre Nós", "Login", "Registo", "Recuperar Palavra Passe".
- **2.2. Catálogo ("Imóveis"):** Uma página com a listagem de todos os imóveis disponíveis.
    
    **A. Filtros Principais (Visíveis por defeito):**
    
    - **Objetivo de Negócio:** Comprar ou Arrendar.
    - **Tipo de Imóvel:** Apartamento, Moradia, Terreno, Loja/Comércio, Garagem.
    - **Localização:** Campo de pesquisa de texto livre ou *dropdowns* em cascata (Distrito > Concelho > Freguesia).
    - **Preço:** Intervalo com valor Mínimo e Máximo (ex: €100.000 a €300.000).
    - **Tipologia (Quartos):** T0, T1, T2, T3, T4, T5+ (Permitir seleção múltipla, ex: procurar T2 e T3 ao mesmo tempo).
    
    **B. Filtros Avançados (Visíveis ao clicar em "Mais Filtros"):**
    
    - **Casas de Banho:** 1, 2, 3, 4+
    - **Estado do Imóvel:** Novo, Usado, Em Construção, Para Recuperar.
    - **Área Útil (m²):** Intervalo Mínimo e Máximo.
    - **Comodidades/Extras (Checkboxes):** * Com Elevador
        - Com Garagem / Estacionamento
        - Com Carregamento para Carros Elétricos
    - **Certificado Energético:** A, B, C, D, E, F.
    
    **C. Ordenação de Resultados (Sorting):**
    
    - Mais Recentes (Por defeito)
    - Preço: Mais Barato para Mais Caro
    - Preço: Mais Caro para Mais Barato
    - Área: Maior para Menor
    
    ---
    
    ### Dica Técnica para o Node.js e React:
    
    Quando fores programar isto, o frontend (React) vai enviar estes filtros no URL (ex: `oteusite.pt/imoveis?tipo=apartamento&precoMin=150000&quartos=2`). O teu backend (Node.js) vai ler esse URL e montar uma *query* dinâmica no MariaDB para devolver apenas as casas que correspondem.
    
- **2.3. Detalhes do Imóvel:** Uma página dinâmica gerada para cada imóvel específico clicado pelo utilizador.

### 3. Módulo da Página "Detalhes do Imóvel"

Cada página de imóvel deve apresentar obrigatoriamente a seguinte informação:

- **3.1. Informação Base:** Descrição geral do imóvel.
- **3.2. Características Físicas:**
    - Área Bruta Privativa (m²) e Área Bruta (m²)
    - Área Total do Lote (m²) e Área Útil (m²)
    - Quartos (Tipologia) e Ano de Construção
    - Piso, Número de WC/Casas de banho
    - Elevador (Sim/Não)
    - Estacionamento (Nº de Lugares)
    - Carregamento de Carros Elétricos (Sim/Não)
    - Divisões (Lista detalhada)
- **3.3. Características Energéticas:** Certificado/Eficiência energética.
- **3.4. Localização:** Morada e integração de Mapa (ex: Google Maps API).
- **3.5. Contacto do Responsável:** Nome, dados de contacto do Agente/Admin associado ao imóvel.
- **3.6. Formulário de Contacto:** Espaço para enviar mensagem diretamente pela plataforma. O sistema deve preencher automaticamente com uma mensagem padrão do objetivo do contacto (pedir informaçoes / agendar visitas).

### 4. Funcionalidades do Utilizador (Role: Cliente)

O utilizador com o nível de acesso "Cliente" deve poder:

- **4.1.** Aceder à sua área reservada ("Perfil").
- **4.2.** Visualizar estatísticas de imóveis: Caso seja o proprietário (vendedor) de um imóvel, deve conseguir ver o número de cliques/pessoas interessadas na sua propriedade.

### 5. Funcionalidades do Administrador (Role: Admin)

O utilizador com nível de acesso "Admin" herda todas as permissões do "Cliente", com os seguintes acréscimos:

- **5.1. Gestão de Imóveis:** O Admin pode Criar, Editar e Eliminar imóveis na plataforma.
- **5.2. Gestão de Utilizadores:** O Admin pode adicionar novos utilizadores e atribuir-lhes a *role* de Admin (colegas da imobiliária).
- **5.3. Atribuição de Cliente (Vendedor):** O Admin pode associar um imóvel a um "Cliente" registado, permitindo que este aceda às métricas de visualização desse imóvel.
- **5.4. Atribuição de Agente (Admin):** O Admin deve associar cada imóvel a um Administrador específico. É este Admin que receberá as mensagens do formulário de contacto e cujos dados aparecerão na página do imóvel.
- **5.5. Partilha Social:** Após a criação de um imóvel, o sistema deve fornecer atalhos/botões estruturados para que o Admin partilhe facilmente o anúncio, de forma manual e formatada, no Instagram, página de Facebook da imobiliária e grupos de Facebook.

### 6. Módulo de Conformidade Legal (RGPD e Lei 58/2019)

O sistema deve garantir o cumprimento das leis de proteção de dados portuguesas e europeias:

- **6.1. Consentimento Explícito (Opt-in):** Os formulários de registo e contacto devem ter *checkboxes* não pré-assinaladas para aceitação do tratamento de dados.
- **6.2. Política de Privacidade:** O site deve ter uma página detalhada e acessível explicando a recolha, finalidade, retenção e não-partilha de dados com terceiros (venda de dados).
- **6.3. Direito ao Esquecimento:** Garantido pela funcionalidade de eliminação de perfil (Requisito 1.5).
- **6.4. Gestão de Cookies:** Preparação estrutural para implementação futura de um banner de consentimento ativo para cookies não-essenciais (estatísticas, rastreio).(não considerar até eu pedir)

## Requisitos Não Funcionais (Detalhe Técnico)

### 1. Segurança e Privacidade (Focado no RGPD)

- **Criptografia de Dados:** As passwords e contactos dos utilizadores (Admin e Cliente) têm de ser obrigatoriamente guardadas na base de dados (MariaDB) usando `bcrypt` (com um "salt" mínimo de 10 rounds). Nenhuma password pode estar em texto limpo.
- **Autenticação:** O sistema de login em Node.js deve usar **JWT (JSON Web Tokens)**. O token deve expirar (ex: após 24h) para forçar um novo login, aumentando a segurança.
- **Proteção contra SQL Injection:** No Node.js, todas as queries ao MariaDB devem ser feitas usando "Prepared Statements" (se usares uma library como `mysql2` ou um ORM como `Sequelize`, isto é garantido).
- **Direito ao Esquecimento (Soft Delete vs Hard Delete):** Quando o cliente clica em "Deletar o seu perfil", os seus dados pessoais (Nome, Email) devem ser apagados da base de dados (*Hard Delete*) ou anonimizados. Se o cliente tiver casas associadas ou mensagens trocadas, temos de garantir que a BD não "quebra" quando o utilizador desaparece (falaremos disto na arquitetura da BD).

### 2. Performance e Otimização (Focado no cPanel)

- **Gestão de Imagens:** É imperativo que o backend em Node.js redimensione e comprima as imagens dos imóveis no momento do upload (usando uma biblioteca como o `sharp`). Imagens pesadas esgotam o espaço no cPanel e penalizam o SEO do site.
- **Carregamento Rápido:** O frontend em React deve implementar *Lazy Loading* nas imagens do catálogo. Ou seja, as fotos das casas só carregam à medida que o utilizador faz *scroll* para baixo, poupando tráfego e acelerando a página.

### 3. Implementação da Partilha Social (Ponto 5.5)

- **Partilha Estruturada:** O frontend deverá usar os URLs dinâmicos de partilha nativos do Facebook e Twitter/X (ex: `https://www.facebook.com/sharer/sharer.php?u=[URL_DO_IMOVEL]`).
- **Open Graph Tags:** Para que a partilha no Facebook/Instagram (via link) puxe a foto certa da casa, o título e o preço, as páginas de "Detalhes do Imóvel" têm de ter as *Meta Tags do Open Graph* (`og:image`, `og:title`, `og:description`) injetadas no HTML pelo React (usando algo como o `react-helmet`).

### 4. Arquitetura de Comunicação (Mensagens e Emails)

- **Sistema de Mensagens:** Quando um cliente envia uma mensagem na página do imóvel, o Node.js deve guardar essa mensagem no MariaDB e, em simultâneo, disparar um email via SMTP para o Admin/Agente associado àquele imóvel (usando a biblioteca `nodemailer`).
- **Proteção contra Spam:** O formulário de contacto tem de ter um sistema de validação (como o Google reCAPTCHA) para evitar que bots encham o email dos agentes com lixo.

## Estrutura da Base de Dados Relacional (MariaDB)

### 1. Tabela: `users`

Guarda todos os utilizadores (Clientes e Admins).

- **id** (INT, Primary Key, Auto Increment)
- **first_name** (VARCHAR 50)
- **last_name** (VARCHAR 50)
- **email** (VARCHAR 100, Unique)
- **password_hash** (VARCHAR 255) -> *Aqui entra o bcrypt.*
- **phone_encrypted** (VARCHAR 255, Nullable) -> *Contacto cifrado via AES-256.*
- **role** (ENUM: 'cliente', 'admin') -> *Define as permissões.*
- **created_at** (TIMESTAMP)
- **deleted_at** (TIMESTAMP, Nullable).
    - Se este campo tiver uma data, o Node.js sabe que essa conta foi apagada e não permite login, mas mantém o histórico interno temporariamente (útil para auditorias legais antes de um *Hard Delete* definitivo).

### 2. Tabela: `properties` (Imóveis)

A tabela central, estruturada para que as tuas pesquisas dinâmicas com filtros sejam muito rápidas.

- **id** (INT, Primary Key, Auto Increment)
- title (VARCHAR 100) -> Ex: "Magnífico T3 no Centro de Lisboa".
- **description** (TEXT)
- **objective** (ENUM: 'comprar', 'arrendar')
- **property_type** (ENUM: 'apartamento', 'moradia', 'terreno', 'loja', 'garagem')
- **status** (ENUM: 'novo', 'usado', 'em_construcao', 'para_recuperar')
- **price** (DECIMAL 10,2)
- **district** (VARCHAR 50)
- **county** (VARCHAR 50) -> *Concelho*
- **parish** (VARCHAR 50) -> *Freguesia*
- **address_map** (VARCHAR 255) -> *Morada ou link/coordenadas do Maps*
- **rooms** (INT) -> *Tipologia: 0 para T0, 1 para T1, etc.*
- **bathrooms** (INT)
- **useful_area** (DECIMAL 8,2) -> *Área Útil*
- **gross_area** (DECIMAL 8,2) -> *Área Bruta*
- **privative_gross_area** (DECIMAL 8,2) -> *Área Bruta Privativa*
- **lot_area** (DECIMAL 10,2, Nullable) -> *Área Total do Lote*
- **build_year** (INT, Nullable)
- **floor** (VARCHAR 20, Nullable) -> *Pode ser "R/C", "1º", etc.*
- **elevator** (BOOLEAN)
- **parking_spaces** (INT)
- **ev_charging** (BOOLEAN) -> *Carregamento elétrico*
- **energy_cert** (ENUM: 'A', 'B', 'C', 'D', 'E', 'F', 'Isento')
- **views_count** (INT, Default 0) -> *Alimenta as estatísticas do cliente.*
- **owner_id** (INT, Foreign Key -> `users.id`, Nullable) -> *O Cliente Vendedor.*
- **agent_id** (INT, Foreign Key -> `users.id`, Nullable) -> *O Admin responsável.*
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)

### 3. Tabela: `property_images`

Como um imóvel tem várias fotos, precisamos de uma tabela separada (Relação 1 para Muitos).

- **id** (INT, Primary Key, Auto Increment)
- **property_id** (INT, Foreign Key -> `properties.id`)
- **image_url** (VARCHAR 255) -> *O caminho para a imagem já redimensionada pelo teu Node.js.*
- **is_main** (BOOLEAN, Default FALSE) -> *Para saberes qual é a foto de capa que aparece no catálogo.*

### 4. Tabela: `property_divisions` (Opcional, mas Recomendada)

No teu requisito falas em "Divisões (Lista detalhada)". Em vez de meteres tudo num texto confuso na tabela `properties`, cria uma tabela para as listar.

- **id** (INT, Primary Key, Auto Increment)
- **property_id** (INT, Foreign Key -> `properties.id`)
- **name** (VARCHAR 50) -> *Ex: "Cozinha", "Suite Principal"*
- **area** (DECIMAL 8,2, Nullable) -> *Ex: 15.5 m²*

### 5. Tabela: `messages` (Contactos e Leads)

Guarda as mensagens enviadas através do formulário do imóvel.

- **id** (INT, Primary Key, Auto Increment)
- **property_id** (INT, Foreign Key -> `properties.id`, Nullable)
- **sender_name** (VARCHAR 100)
- **sender_email** (VARCHAR 100)
- **sender_id** (INT, Foreign Key -> `users.id`, Nullable) -> *Se quem enviou a mensagem estiver com o login feito.*
- **message_text** (TEXT)
- **created_at** (TIMESTAMP)
- **sender_phone** (VARCHAR 20, Nullable)
- **is_read** (BOOLEAN, Default FALSE)

## Como o RGPD (Direito ao Esquecimento) é garantido no MariaDB:

O teu requisito diz: *"Se o cliente tiver casas associadas ou mensagens trocadas, temos de garantir que a BD não 'quebra' quando o utilizador desaparece."*

No MariaDB, resolvemos isto de forma elegante quando criamos as chaves estrangeiras (Foreign Keys), usando a regra `ON DELETE SET NULL`.

### 3. Ponto de Atenção: O Desafio do SEO no React (React-Helmet)

No teu ponto 3 tens o `react-helmet` para colocar as tags do Facebook/Instagram.
Como vais compilar o React para ficheiros estáticos no cPanel (o chamado SPA - Single Page Application), os *crawlers* do Facebook e do Google às vezes têm dificuldade em ler o `react-helmet` a tempo.

**A Solução Simples:** Quando fores fazer o *build* do React, pondera usar uma ferramenta como o **Vite** (muito mais rápido que o Create React App) e configurar uma ferramenta leve de *prerendering* (como o `react-snap`) apenas para que o Facebook consiga puxar a imagem da casa quando partilhas o link.

```
meu-projeto-imobiliario/
│
├── [REQUIREMENTS.md](http://requirements.md/)          <-- O teu documento de planeamento mestre!
│
├── backend/                 <-- (O Motor: Node.js)
│   ├── config/              
│   ├── controllers/         
│   ├── middlewares/         
│   ├── models/              
│   ├── routes/              
│   ├── services/            
│   ├── public/
```

```
│   │   └── uploads/         
│   └── utils/               
│
└── frontend/                <-- (A Cara do Site: React)
├── public/              <-- Coisas que não mudam (Logos da imobiliária, favicon, ficheiros base).
└── src/
├── api/             <-- Onde configuras o Axios/Fetch para "falar" com o backend.
├── assets/          <-- CSS global, ícones de design e imagens ilustrativas do site.
├── components/      <-- Peças de Lego (ex: BotaoPartilha, CardDoImovel, BannerCookies).
├── context/         <-- Memória global do React (ex: guardar o Estado do Utilizador logado).
├── pages/           <-- As páginas inteiras (ex: Catalogo.jsx, DetalheImovel.jsx, Login.jsx).
├── routes/          <-- As regras de navegação (ex: o admin tem acesso a X, o cliente a Y).
└── utils/           <-- Ferramentas visuais (ex: formatar o número 150000 para "150.000 €").
```