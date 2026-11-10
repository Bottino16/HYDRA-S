# Evidências — Fase 0.5

Verificações executadas no Windows, Node 20.20.2 e MySQL 8.0.45 em instância isolada (porta 3307, diretório ignorado `.data/mysql-test`). **Resultado final: 21 testes aprovados, zero falhas e zero testes ignorados**, com a integração MySQL habilitada. Nenhuma conexão ao banco antigo; serviço MySQL80 existente preservado.

| Caso | Resultado esperado e verificado |
| --- | --- |
| APIs privadas sem sessão | 401 |
| Cliente em CRUD de usuários, comandos master e página admin | 403 |
| Login sem CSRF / origem externa | 403 |
| Logout | sessão destruída, HTTP 401, socket desconectado e reconexão com cookie antigo recusada |
| Senha fraca no seed | recusa antes de conexão ou criação de banco |
| Hash de senha | bcrypt; senha/hash ausentes nas respostas públicas |
| Arquivos internos | 404 para server.js, server-original.js, setup-db.js, db/schema.sql, db/seed.js, knowledge/README.md, .env, .env.example, package.json, node_modules e src/store.js |
| Contorno de página por URL codificada | 404; páginas privadas normais redirecionam anônimo ao login |
| Socket sem sessão / sem CSRF | handshake recusado com 401 / 403 |
| Socket de cliente em comando master | 403; nenhum acionamento |
| Socket autenticado | recebe telemetria simulada |
| Expiração | HTTP perde acesso e socket é desconectado |
| Troca/redefinição de senha | revoga sessão antiga; nova senha permite login |
| Último master | remoção/rebaixamento recusados |
| XSS | payload aparece como texto; nenhum elemento img nem onclick dinâmico na tabela |
| Dashboard | carrega sessão e perfis reais; recebe solo pelo socket; aviso de simulação visível |
| Banco real | schema/seed idempotentes; CRUD e persistência após novo Store |
| Retenção | leitura antiga excluída, leitura recente preservada |
| Reset | recusa sem confirmação interativa |
| Banco inacessível | login em memória com senha forte; aviso explícito |
| TLS | rejectUnauthorized=true quando DB_SSL=true |

A integração com nuvem, certificados de um provedor real e inspeção visual em navegador não foram executadas. O teste DOM usa doubles para gráfico/canvas e clima, sem baixar assets de CDN. Não houve teste físico ou alteração de firmware. O teste de expiração foi ajustado para prazo absoluto, independente da atividade do Socket.io.
