# Deploy cPanel - Checklist rapido

## 1) Frontend (site publico)
1. Em `frontend/`, criar `.env.production` com base em `frontend/.env.production.example`.
2. Gerar build local: `npm run build`.
3. Upload de todo o conteudo de `frontend/dist/` para `public_html/`.
4. Copiar `frontend/.htaccess.production` para `public_html/.htaccess`.

## 2) Backend (Node.js App no cPanel)
1. Criar app Node no cPanel (Application Manager).
2. Definir App Root (exemplo): `nodeapps/imobiliaria-api`.
3. Startup file: `server.js`.
4. Fazer upload da pasta `backend/` para a App Root (sem `node_modules`).
5. Criar `.env` no backend com base em `backend/.env.cpanel.example`.

## 3) Imagens via cPanel (pasta images)
1. Garantir que existe a pasta: `/home/UTILIZADOR/public_html/images`.
2. No `.env` do backend:
   - `UPLOADS_ROOT=/home/UTILIZADOR/public_html/images`
   - `UPLOADS_PUBLIC_PATH=/images`
   - `UPLOADS_PUBLIC_BASE_URL=https://teudominio.pt`
3. Isto permite: upload, leitura e apagamento das imagens pelo backend, mas servidas no dominio principal.

## 4) Comandos iniciais no backend (terminal cPanel)
1. `npm install --omit=dev`
2. `node scripts/initDb.js`
3. `node scripts/seedInitialAdmin.js`
4. Restart da app Node no cPanel.

## 5) Teste rapido
1. Abrir site e confirmar catalogo.
2. Criar/editar imovel com imagens.
3. Confirmar se imagens ficam acessiveis em `https://teudominio.pt/images/...`.
4. Apagar imagem no admin e confirmar remocao fisica do ficheiro.
