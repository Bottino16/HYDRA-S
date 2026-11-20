# HYDRA-S — Inteligência Hídrica

Sistema de monitoramento e irrigação desenvolvido como Trabalho de Conclusão de Curso (TCC), com interface web premium, Digital Twin do circuito hídrico e Assistente do Solo com inteligência artificial local gratuita.

O projeto integra a jornada **Rio → Poço → Caixa elevada → Plantação**, permitindo estudar o transporte de água, acompanhar sensores e demonstrar comandos sujeitos às proteções do controlador.

> **Estado atual: exclusivamente SIMULAÇÃO, sem Arduino. O firmware NÃO foi validado fisicamente e não está aprovado para uso real.** Os percentuais e movimentos da demonstração são virtuais; não comprovam vazão, volume físico ou condições reais de cultivo.

## Recursos implementados

- **Visão Geral e Digital Twin:** circuito integrado, percentuais, cinco boias, estados confirmados das três bombas e monitoramento ambiental.
- **DEMO-1:** captação, transferência e irrigação reproduzíveis, com iniciar, pausar, retomar, reiniciar e encerrar pelo MASTER. Animações acompanham as saídas confirmadas do simulador.
- **Histórico e Eventos:** leituras, acionamentos, alertas, consulta por período e exportação CSV. Água consumida sempre identificada como **ESTIMATIVA**, dependente de vazão configurada.
- **Configurações:** perfis de plantas, agendamentos, vazões e cenários simulados existentes.
- **Assistente do Solo:** Ollama local, streaming SSE, base documental em português, histórico por usuário, interrupção, cópia e continuações controladas.
- **Acesso autenticado:** contas MASTER/CLIENTE, sessões, CSRF e autorização no backend. Nesta versão, comandos de bombas, administração e cenários são exclusivos do MASTER; não há perfil visitante.
- Interface responsiva, navegação entre seções e temas claro/escuro.

## Circuito e sensores

| Bomba | Função | Percurso |
|---|---|---|
| B01 | Captação | Rio → Poço |
| B02 | Transferência | Poço → Caixa elevada |
| B03 | Irrigação | Caixa elevada → Plantação |

As cinco boias representam presença de água no Rio, mínima/máxima no Poço e mínima/máxima na Caixa. **Boias não medem percentuais.** Rio e Poço têm percentuais virtuais na simulação; sem sensores contínuos correspondentes, esses percentuais não estão disponíveis no hardware. A Caixa tem informação de nível associada ao ultrassônico na implementação, ainda sem validação física.

O solo usa uma escala relativa do sensor capacitivo, não umidade volumétrica nem percentual ideal universal. Também são representadas temperatura e umidade relativa do ar. Leituras ausentes, inválidas ou vencidas aparecem como **sem dados**; zero válido continua sendo zero. Caixa cheia não significa solo encharcado.

As proteções incluem validade dos sensores, coerência das boias, proteção a seco, máximos de 120/120/60 s por ciclo, intervalo mínimo de 30 s, partidas separadas em 2 s e uma bomba simultânea. O painel acompanha ACK/telemetria, sem presumir saída ligada no clique. Saída ligada não comprova fluxo.

## Tecnologias

| Área | Implementação |
|---|---|
| Frontend | HTML, CSS, JavaScript, SVG, Chart.js e Socket.IO |
| Backend | Node.js ≥ 20.19, CommonJS e Express 5 |
| Segurança | express-session, bcryptjs, Helmet, express-rate-limit e CSRF próprio |
| Persistência | MySQL via mysql2 ou modo temporário em memória |
| IA principal | Ollama em loopback, `llama3.2:3b`, NDJSON convertido em SSE |
| Conhecimento | Markdown privado, recuperação local por relevância e referências |
| Controlador | serialport, JSON com sequência/checksum/ACK e simulador Node.js |
| Testes | node:test, Supertest, Socket.IO Client, jsdom e emulação AVR opcional |

As versões exatas estão no [package-lock.json](package-lock.json); comandos e dependências estão em [package.json](package.json). O adaptador Anthropic permanece como legado opcional, sem uso nem chave necessária na implantação Ollama. Não há fallback silencioso para serviço pago ou demonstração.

## Estrutura principal

```text
public/          Frontend e recursos visuais servidos pelo Express
src/             Backend, segurança, serviços, assistente e simulador
knowledge/       Documentos técnicos/agronômicos privados
db/              Schema, seed e ferramentas de configuração do banco
firmware/        Controlador e testes, sem validação física
arduino/         Referências legadas do hardware
test/            Testes e fixtures fictícias
scripts/         Ferramentas de teste e diagnóstico
docs/            Relatórios, roteiros e evidências de simulação
server.js        Servidor da aplicação
.env.example     Modelo de configuração sem credenciais reais
```

Somente `public/` fornece assets web; páginas privadas exigem autenticação. `src/`, `db/`, `knowledge/`, `.env` e `node_modules/` não são servidos publicamente.

## Instalação local em SIMULAÇÃO

### Pré-requisitos

- Git e Node.js **20.19 ou superior**, com npm e versão compatível com os requisitos das dependências.
- Navegador moderno.
- Para IA real: Ollama instalado e modelo `llama3.2:3b` disponível. O HYDRA-S não instala programas nem baixa modelos automaticamente.
- Memória disponível para o painel e o modelo. As proteções podem impedir uma geração; não as desative. O notebook de desenvolvimento tem 8 GB de RAM e GTX 1050 Ti de 4 GB, mas a validação real da IA permanece parcial.
- **MySQL não é necessário com `DB_MODE=memory`.**

### 1. Dependências e ambiente

O código está no repositório privado [Bottino16/HYDRA-S](https://github.com/Bottino16/HYDRA-S). Para obter uma cópia, autentique-se no GitHub com uma conta autorizada e execute, fora de outra pasta do projeto:

```powershell
git clone https://github.com/Bottino16/HYDRA-S.git
Set-Location HYDRA-S
```

No PowerShell, dentro da pasta do projeto:

```powershell
npm ci
if (!(Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

O `.npmrc` usa `https://registry.yarnpkg.com/`, mantendo verificação TLS. A primeira instalação depende de internet.

Edite o `.env` **localmente** e confira:

```ini
SIMULATE=true
DB_MODE=memory
HOST=127.0.0.1
PORT=3000
APP_ORIGIN=http://localhost:3000
COOKIE_SECURE=false
ASSISTANT_PROVIDER=ollama
ASSISTANT_DEMO=false
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_NUM_CTX=4096
OLLAMA_NUM_PREDICT=256
ASSISTANT_TIMEOUT_SECONDS=60
ASSISTANT_AUTO_CONTINUATIONS=2
ASSISTANT_MAX_CONTINUATIONS=2
```

Preencha também `ADMIN_USER`, `ADMIN_PASSWORD` e `SESSION_SECRET`. **Não existe senha padrão.** A senha precisa de 12+ caracteres, maiúscula, minúscula, número e símbolo, sem padrões proibidos nem nome do usuário, e no máximo 72 bytes. Coloque-a entre aspas no `.env`, especialmente se contiver `#`.

Gere um segredo aleatório no seu terminal e copie o resultado para `SESSION_SECRET`, sem compartilhá-lo:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

O modo memória cria o MASTER com essas variáveis e recusa senha fraca. Ele **não pede senha interativamente em `npm start`**; o prompt oculto pertence ao setup MySQL. Deixe as chaves Anthropic vazias ao usar Ollama. Nunca envie `.env`, segredos ou dados reais de usuários ao GitHub.

### 2. Iniciar e acessar

```powershell
ollama list
npm start
```

Confira que `llama3.2:3b` está listado e que o serviço Ollama está disponível somente em loopback. Caso não esteja iniciado, siga o procedimento da instalação; `ollama serve` pode ser usado em outro terminal somente se não houver uma instância em execução. Não abra a porta 11434 para a rede.

Abra **http://localhost:3000/login.html** e entre com o MASTER local. Frontend e backend usam o mesmo servidor: não abra o HTML diretamente no sistema de arquivos. Se mudar a porta, ajuste `PORT` e `APP_ORIGIN` juntos. Não inicie outro servidor numa porta ocupada.

No **Assistente do Solo**, confira o motor **Ollama local** e o modelo **llama3.2:3b**. Falha do provedor é informada no chat e não deve impedir o painel. A IA não aciona bombas automaticamente. RAG e referências não garantem precisão nem substituem agrônomo ou análise de solo.

### 3. Gravar a demonstração

1. Na Visão Geral, confira **SIMULAÇÃO ATIVA** e telemetria recente.
2. Desative agendamentos simulados ativos antes de preparar a tomada.
3. Clique **Iniciar demonstração**. As três etapas executam sob as travas existentes.
4. Use **Pausar** e **Retomar** quando necessário. Pausar desliga bombas e mantém telemetria; retomar pode aguardar o cooldown.
5. **Reiniciar** prepara outra tomada. **Encerrar** termina com saídas desligadas e modo MANUAL.

Um ciclo observado levou aproximadamente 106 s; perfil/calibração, pausas e esperas podem mudar a duração. Ao concluir, níveis finais ficam congelados até encerrar/reiniciar. Consulte o [roteiro DEMO-1](docs/RELATORIO-DEMO-1.md).

Para encerrar um servidor iniciado por você, use `Ctrl+C` no terminal correspondente. **No modo memória, reiniciar perde contas temporárias, leituras, eventos e conversas; sessões também terminam.** Configurações e diário de agendamentos em `.data/` são arquivos privados e ficam fora do GitHub. Avalie esse impacto antes de parar um servidor existente.

## MySQL opcional

Para persistência, configure um banco local separado com credenciais próprias: `DB_MODE=mysql`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`. O usuário precisa das permissões usadas pelo setup. Em ambiente novo, execute conscientemente:

```powershell
npm run db:setup
npm start
```

O setup cria schema e primeiro MASTER, valida a senha e pode solicitá-la com entrada oculta. Não redefine automaticamente contas existentes. `npm run ready` combina setup/início; em modo memória ele pula o banco. Não execute resets sobre dados importantes.

Falhas no MySQL podem ativar fallback identificado para memória; alterações temporárias não são reaplicadas automaticamente ao banco. Para TLS, use `DB_SSL=true` e, se necessário, CA confiável em `DB_SSL_CA`; não desative verificação de certificado. Docker Compose é opcional e exige configuração/revisão separada.

## Testes

```powershell
npm test
```

A suíte verifica autenticação, CSRF, isolamento de conversas, streaming com mocks, limites, RAG, APIs, simulação, ACK, navegação e componentes. Não carrega o modelo real e não substitui revisão visual ou ensaio físico.

Integrações MySQL são opcionais, habilitadas por `SDA_TEST_MYSQL_PORT` e credenciais de teste. Elas criam/apagam bancos de teste: não as configure para a instância de uso. Sem essa porta, são ignoradas. `npm run firmware:test` exige ferramentas AVR e executa emulação sem placa; não é necessário para abrir o painel simulado.

## Limitações e segurança

- Firmware, ligações, boias, relés e sensores **não validados fisicamente**. Não conecte bombas reais com base nesta demonstração.
- IA-3D: precisão agronômica, desempenho e continuações com Ollama real ainda têm ensaios pendentes. Contexto 4096, 256 tokens por geração, até duas continuações, timeout total de 60 s e uma geração ativa por processo; sem fila global de apresentação.
- O teto de caracteres depende da configuração efetiva; na implantação local de validação era 3.072. Tokens e caracteres são diferentes. Consulte relatórios recentes antes de alterar limites.
- Não existe parada de emergência global dedicada nesta versão. Desligar bombas/encerrar demonstração não substitui emergência elétrica.
- Instância única local; sessões em memória não constituem arquitetura de produção distribuída.
- Alguns recursos visuais usam CDN. Ollama local não torna toda a interface ou a primeira instalação automaticamente offline.
- Rede local/QR Code, hospedagem pública e demonstração estática pública não foram implementados nesta entrega.
- Segredos, logs, bancos, modelos, sessões e backups privados são excluídos pelo `.gitignore`. Revise sempre `git diff --cached` antes de enviar.

## Vídeo demonstrativo do TCC

Espaço reservado para o vídeo do HYDRA-S. A consulta autenticada na conta **Bottino16** não encontrou o repositório planejado **HYDRA-S-Demonstracao**; o link poderá ser incluído quando o endereço for confirmado. Nenhum repositório de vídeo foi criado nesta entrega, e nenhum vídeo grande foi incluído no repositório de código.

## Versão online futura

Repositório privado não disponibiliza o sistema como serviço. [GitHub Pages hospeda HTML/CSS/JavaScript estáticos](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages); não executa este backend Node.js.

Uma apresentação estática separada poderia mostrar identidade, imagens, vídeo e cena conceitual rotulada. Exige aprovação e adaptação: os HTML atuais dependem de sessão/APIs e não devem ser apresentados como sistema completo no Pages.

Login, comandos, simulador, Socket.IO, histórico/CSV, clima e SSE dependem do Express. IA real exige que o backend alcance o Ollama local. `127.0.0.1` numa hospedagem não aponta para o notebook do autor. **Não exponha Ollama nem MySQL diretamente à internet.**

Implantação pública exigiria auditoria própria, HTTPS/proxy, cookies seguros, sessões persistentes, armazenamento durável, controles de origem/abuso, isolamento de comandos e observabilidade sem segredos. Uma demonstração pública deve ser explicitamente simulada e isolada de hardware. Nenhuma hospedagem ou abertura de portas foi feita.

## Documentação técnica

- [DEMO-1: testes e gravação](docs/RELATORIO-DEMO-1.md)
- [Ollama: ativação e teste manual](docs/TESTE-MANUAL-OLLAMA.md)
- [Pinos e ligações — ainda não validados](docs/PINOS-E-LIGACOES.md)
- [Protocolo serial](docs/PROTOCOLO-SERIAL-V1.md)
- [Plano físico supervisionado — pendente](docs/TESTE-FISICO-FASE-1.md)
- [Organização do conhecimento](knowledge/README.md)

Relatórios históricos registram limitações à época de cada etapa; confirme o comportamento atual pelo código e pelos relatórios recentes.
