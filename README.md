# SDA — Sistema de Irrigação Inteligente

TCC SENAI / CETAF-AJU. Fase 0.5: banco e autenticação recriados, com simulação no backend. O firmware existente está preservado e **não deve ser usado na nova maquete antes da Fase 1**.

## Subir do zero em cerca de 5 minutos

Pré-requisitos: Node.js 20.19+ e MySQL 8 ou MariaDB local disponível. Docker Desktop é uma alternativa opcional. A primeira instalação depende de internet. O `.npmrc` do projeto usa o registro espelho Yarn com TLS válido, pois o npmjs apresentou cadeia de certificado não confiável neste ambiente; a verificação TLS permanece ativa.

1. Execute `npm ci`.
2. Copie `.env.example` para `.env` (`Copy-Item .env.example .env` no PowerShell).
3. Edite `.env`: preencha `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `ADMIN_USER`, `ADMIN_PASSWORD` e `SESSION_SECRET`. Gere o segredo com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Use senha administrativa exclusiva com pelo menos 12 caracteres, maiúscula, minúscula, número e símbolo; evite padrões, nome do usuário e palavras como senha/admin. Coloque senhas entre aspas no `.env`, especialmente se contiverem `#`. Não há senha padrão.
4. Com um banco local existente: o usuário configurado precisa criar o banco escolhido e suas tabelas. Não reutilize credenciais do Aiven antigo. Como alternativa, preencha também `DB_ROOT_PASSWORD` com outro valor forte e execute `docker compose up -d --wait` (escolha uma `DB_PORT` livre; o Compose publica só em 127.0.0.1). O Docker provisiona o banco e o usuário automaticamente.
5. Execute o comando único `npm run ready`: prepara as tabelas, cria o primeiro master se ele não existe e inicia a aplicação. Abra **http://localhost:3000** e entre com as credenciais escolhidas. Se alterar a porta, atualize `PORT` e `APP_ORIGIN` juntos.

O seed também pode pedir as credenciais em terminal interativo, com senha oculta. Não imprime nem grava a senha no código. Um seed posterior nunca redefine a senha de um usuário existente.

### Usar MySQL em nuvem

No `.env`, troque host, porta, usuário, senha e nome do banco. Use `DB_SSL=true`; se o provedor exigir CA própria, aponte `DB_SSL_CA` para o arquivo PEM confiável. Sem esse caminho, usa as autoridades do runtime. O certificado e o nome do servidor são verificados; não existe opção para ignorar a verificação. O usuário precisa ter permissão de criação no banco; quando o provedor já fornece um banco, use exatamente esse `DB_NAME`.

Execute `npm run ready`. O procedimento de seed e schema é o mesmo. A conexão com nuvem não foi testada contra um provedor nesta entrega; a persistência foi validada em MySQL 8 local isolado.

### Demonstração sem banco

Configure `DB_MODE=memory`, `SIMULATE=true`, `ADMIN_USER`, `ADMIN_PASSWORD` forte e `SESSION_SECRET` e execute `npm run ready`. Login continua obrigatório. Os dados desaparecem ao encerrar.

Em `DB_MODE=mysql`, `npm start` tenta carregar o banco. Se falhar, usa memória com administrador validado a partir do `.env`; sem credenciais fortes, recusa iniciar. A interface exibe o aviso. `npm run ready` interrompe se o setup falhar; use `npm start` para o fallback explícito. Após perda de conexão durante operação, as alterações ficam temporárias; não são reaplicadas automaticamente. Reinicie após recuperar o banco. Não troque senhas importantes nesse modo esperando persistência.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run ready` | Setup idempotente e servidor em uma execução, depois de configurar o ambiente |
| `npm start` | Servidor com banco existente ou fallback em memória |
| `npm run db:setup` | Cria banco, tabelas e primeiro administrador |
| `npm run db:reset` | Apaga tabelas da aplicação somente após digitar `APAGAR nome_do_banco` em terminal interativo |
| `npm test` | Testes de autenticação, autorização, sockets, fallback, XSS e carregamento funcional |

`db:reset` perde todos os dados da aplicação e não possui opção de confirmação automática. Não apaga outros bancos.

## Uso das telas

- `/login.html`: login real, sem sessionStorage como credencial.
- `/arthur.html`: painel autenticado; rega manual e parada exigem master.
- `/painel-adm.html`: CRUD real, exclusivo do master. Editar a senha de um usuário é a redefinição administrativa; alterações revogam suas sessões.
- “Trocar senha”: exige senha atual e nova senha confirmada, em campos ocultos; força novo login.
- “Encerrar sessão”: destrói a sessão no servidor e desconecta os sockets.
- Cliente acessa telemetria e mantém seus próprios perfis/agendamentos, sem administrar usuários ou comandar a bomba compartilhada. A automação compartilhada usa o primeiro master ativo nesta fase.

## Arquitetura desta fase

`server.js` é o único servidor. Apenas `/public` fornece assets. As páginas privadas passam por autenticação antes de serem enviadas; HTML codificado não contorna essas rotas. Arquivos de servidor, `.env`, `/db`, `/knowledge`, `/src` e `node_modules` retornam 404. As versões antigas inseguras foram aposentadas antes do primeiro commit.

- `src/config.js`: ambiente e TLS.
- `src/password.js`: política de senha e bcrypt, custo 12.
- `src/store.js`: SQL parametrizado, cache transitório e fallback.
- `src/simulation.js`: simulação compartilhada transitória de uma bomba, sem serial.
- `db/schema.sql`: sete tabelas, relações, índices e nomes corrigidos.
- `db/seed.js`, `db/setup.js`: provisionamento e seed seguro.
- `public/auth.js`, `public/login.js`: sessão real, CSRF, login/logout e troca de senha.
- `test/`: verificações automatizadas.

Sessões usam cookie `httpOnly`, `SameSite=Strict`, expiração absoluta de 60 minutos por padrão e armazenamento em memória no servidor. Reiniciar encerra todas as sessões. Logout, troca/redefinição de senha, edição de usuário e exclusão revogam as sessões afetadas. Sockets revalidam a sessão em cada comando e são desconectados até um segundo após expiração. Rate limit por IP e bloqueio temporário por IP/usuário reduzem tentativas de login. Nunca confie em papéis enviados pelo navegador.

Consultas com valores usam prepared statements. A criação de banco e os comandos DDL usam SQL estático ou escape `??` de identificadores pelo driver, com `DB_NAME` validado. Os segredos antigos não foram usados nem migrados; removê-los daqui não revoga credenciais no provedor.

Perfis e agendamentos pertencem ao usuário. O schema suporta vínculo do agendamento com planta; esta interface edita um agendamento por usuário. Histórico grava solo, temperatura, umidade do ar e nível disponível; rio/poço ficam nulos na simulação atual. `READING_SAVE_SECONDS` controla coleta; `READING_RETENTION_DAYS` controla exclusão no início e a cada hora. O buffer em memória tem limite de 1000 leituras.

## Testar

`npm test` não precisa de banco: testa APIs reais com Supertest, conexões Socket.io reais e DOM com jsdom. O teste de dashboard substitui somente Chart.js/canvas e a consulta meteorológica por doubles, sem mudar a aplicação; não equivale a revisão visual em Chrome ou celular.

Para incluir integração com um banco **exclusivo de testes**, no PowerShell:

```powershell
$env:SDA_TEST_MYSQL_PORT = '3307'
$env:SDA_TEST_MYSQL_USER = 'usuario_de_testes'
$env:SDA_TEST_MYSQL_PASSWORD = 'sua_credencial_local'
npm test
```

O usuário deve poder criar/apagar bancos com prefixo `sda_test_`. A suíte cria nome aleatório e remove apenas esse banco no final. Não aponte para produção. Sem `SDA_TEST_MYSQL_PORT`, a integração é marcada como ignorada; o teste da configuração TLS continua rodando.

## Variáveis e operação

O `.env.example` contém todos os campos utilizados. `DB_SSL_CA` aponta para certificado confiável e não precisa ser público. `COOKIE_SECURE=true` e HTTPS são obrigatórios em `NODE_ENV=production`; nesta fase use uma única instância local. Não há store persistente de sessões, coordenação entre processos nem terminação HTTPS embutida. Expansão para produção deve tratar esses pontos.

`HOST=127.0.0.1` é o padrão. Para acesso por outros aparelhos, configure a origem exata e disponibilize HTTPS conforme o ambiente. Não existe CORS aberto. Requisições mutáveis exigem `X-CSRF-Token`; o login obtém o token em `/api/auth/csrf`. As únicas APIs públicas são bootstrap CSRF e login. Handshake Socket.io exige sessão e token CSRF.

## Pendências das próximas fases

- **Fase 1:** firmware novo, boias, três bombas e travas físicas. Nada do firmware foi alterado nesta fase.
- **Fase 2:** camadas completas de routes/controllers/services, serial/reconexão, simulação das três bombas, clima centralizado, histórico consultável e auditoria operacional de eventos/acionamentos. As tabelas correspondentes já estão criadas. O clima atual ainda vem do Open-Meteo no navegador; os limites meteorológicos não são uma trava física.
- **Fase 3:** Claude, streaming, limites de uso e conhecimento. As variáveis reservadas não são usadas agora.
- **Fase 4 — OFFLINE, apenas planejado:** versionar Chart.js e ícones em `/public/vendor`, servir fontes WOFF2 localmente, remover CDNs/importações remotas e adaptar CSP; oferecer clima indisponível/simulado sem internet. Testar em navegador com rede bloqueada. Dependências, imagem Docker e banco deverão estar previamente instalados; a IA remota requer internet.
- **Fase 5:** documentação elétrica, testes de segurança física, roteiro da banca e revisão visual final.

A CSP ainda permite scripts/estilos inline do dashboard legado e CDNs identificadas. O XSS de dados de usuário foi corrigido com DOM/textContent e handlers vinculados por função; remoção completa de inline faz parte do redesign. Os logs visuais antigos e o documento `.doc` de demonstração ainda são legados, sem valor de auditoria.
