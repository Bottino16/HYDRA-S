# Relatório — Fase 3: Assistente do Solo

Data: **11/11/2026**. Entrega de software em **SIMULAÇÃO**, com provedor falso/demonstração. Nenhuma chave real da Anthropic foi utilizada e nenhuma chamada real de geração foi feita. Firmware **NÃO VALIDADO**, inalterado; ensaios físicos PAUSADOS. Fase 4 aguarda aprovação.

## Resultado e arquitetura

O painel autenticado ganhou a aba **Assistente do Solo**, integrada ao visual existente, com resposta progressiva, indicador de digitação, perguntas rápidas, cópia, conversas e nova conversa. Renderização local de Markdown por nós DOM: não interpreta HTML, URLs ou imagens, não depende de biblioteca de chat/CDN adicional e mantém aviso de falibilidade.

`POST /api/chat` no backend usa o SDK oficial **@anthropic-ai/sdk 1.8.0**, Messages API em streaming. `ANTHROPIC_API_KEY` e `ANTHROPIC_MODEL` vêm do ambiente; **sem modelo padrão no código**. Chave ausente ou modelo vazio desabilitam só esse recurso. Timeout e cancelamento abortam o provedor; SDK sem retries automáticos, logging e OpenTelemetry de conteúdo desativados. Falhas são mensagens sanitizadas, sem exceção bruta, chave ou corpo de requisição em logs.

A integração foi conferida na [documentação oficial do SDK](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript) e na [lista oficial de modelos](https://platform.claude.com/docs/en/models/overview), consultadas em 11/11/2026. A lista publica, por exemplo, `claude-sonnet-5-5`; o `.env.example` o cita somente como referência, não o seleciona. A disponibilidade na conta e a qualidade de respostas reais precisam de teste manual.

Separação de responsabilidades:

- `src/assistant/prompt.js`: regras fixas agronômicas, português brasileiro, cautela com incertezas, escopo, doses e laudos.
- `context.js` / `privacy.js`: campos técnicos permitidos, validade de leituras, fonte, perfil reconhecido, clima e alertas; remoção de identificadores conhecidos/padrões pessoais.
- `knowledge.js`: busca por palavras normalizadas em Markdown privado; seleção de trechos e referências.
- `provider.js`: adaptadores Claude e demonstração; sem ferramentas de comando.
- `service.js` / `routes.js`: limites, histórico truncado, preparação, SSE, cancelamento e proposta manual independente do modelo.
- `src/db/chat-store.js`: mensagens, conversas, paginação e contagem de uso por usuário na tabela existente `conversas_ia`.
- `public/assistant*`: interface, estilos locais e renderizador seguro.

## Contexto, conhecimento e privacidade

Cada pergunta inclui a leitura mais recente após aguardar operações auxiliares, evitando transportar um snapshot que venceu durante a consulta do clima. Solo, temperatura, umidade, níveis, três bombas e alertas são permitidos explicitamente; valores ausentes/vencidos viram **sem dados**. O contexto distingue perfil de configuração de recomendação agronômica. Clima offline não é fabricado; boias/estados inválidos não viram medição válida.

Nomes livres de perfil não saem do backend: envia-se cultura reconhecida e limite numérico. Não há objeto de usuário/sessão, senha, hash, e-mail, token ou ID de usuário no payload da Messages API. Perguntas/histórico/documentos passam por sanitização de identificadores conhecidos, credenciais, e-mails, CPF e telefone. Mensagens salvas usam texto sanitizado. A interface orienta não enviar dados pessoais. **Texto livre não oferece anonimização perfeita**: padrões não reconhecidos e informações pessoais indiretas precisam ser evitados pelo usuário.

O backend acrescenta avisos de SIMULAÇÃO, ausência de telemetria e demonstração ao fluxo independentemente de o modelo obedecer. O system prompt instrui a não inferir valores, pH, nutrientes, doses ou diagnóstico a partir de umidade; assuntos fora do tema são redirecionados, e prescrições dependentes de laboratório remetem a agrônomo/análise de solo.

Base inicial: **sete documentos em português**, com referências, sobre capacidade de campo, textura/drenagem, pH/nutrientes, matéria orgânica, irrigação por cultura, excesso/falta de água e sensor capacitivo/calibração. Fontes principais: [FAO — Soil and Water](https://www.fao.org/4/r4082e/r4082e03.htm), [Embrapa — calibração de sensor capacitivo](https://www.embrapa.br/busca-de-publicacoes/-/publicacao/1004787/calibracao-do-sensor-de-capacitancia-irrigap-para-medida-da-umidade-em-solo-de-textura-franco-argilosa), [UMN Extension — análise de solo](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/soil-testing-for-lawns-and-gardens) e [USU Extension — irrigação de folhas](https://extension.usu.edu/vegetableguide/leafy-greens/irrigation).

Busca sem serviço externo/embeddings, limitada a 32 palavras por pergunta: relê até 50 `.md` de até 64 KiB, ignora README/symlinks, recupera até três documentos, dois parágrafos por documento e 1.600 caracteres por documento. Não é busca semântica profunda. A resposta pede citação `[arquivo.md]`; a UI mostra fontes recuperadas e o histórico preserva referências. Recuperação não prova suporte de cada frase nem elimina alucinações. `/knowledge` continua retornando 404.

## Segurança de comando e prompt injection

O modelo recebe apenas dados serializados, separados do system prompt. Mensagens, histórico, sensores e documentos são explicitamente não confiáveis. **Não há tool calling, agente de comando, execução de JavaScript, parser de receitas ou conversão do texto em requisições de bomba.** A contenção de ações independe de o modelo seguir o prompt.

**Aplicar sugestão** não interpreta números do texto gerado. O backend pode oferecer uma proposta determinística de teste, somente para master em SIMULAÇÃO: bomba 3 por até 4 s, quando há telemetria recente, perfil compatível, água, sensores válidos, bombas paradas e nenhum alerta atual. A interface exige confirmação explícita e considera a proposta expirada após 60 s. Usa o mesmo `POST /api/bombas/3`, sessão, CSRF, permissão master, trava, fila e ACK das outras telas. NACK agora tem motivo legível, sem alterar máquina de estados/protocolo/firmware. Uma proposta não garante partida: cooldown, histerese ou outra alteração podem bloquear. O AUTO local não é controlado pelo chat.

Cliente não recebe proposta e continua obtendo 403 ao tentar comandar. HTML e links `javascript:` ficam como texto. Conta excluída não deixa histórico acessível por uma conta nova: IDs de usuário em memória são monotônicos e os caches associados são removidos na exclusão.

A defesa de prompt não é uma garantia de alinhamento linguístico. Um modelo ainda pode produzir orientação errada ou texto inadequado; isso não lhe dá acesso a atuadores, segredos ou navegação. A revisão agronômica continua necessária.

## Histórico, custo e falhas

Migração aditiva acrescenta UUID de conversa, metadados JSON e índices de consulta/uso em `conversas_ia`; mantém **sete tabelas**. Conversas antigas são agrupadas por usuário, sem apagar mensagens. Todas as consultas usam usuário autenticado; IDs de outro usuário retornam 404. Listagem e mensagens paginam em blocos de 100.

Padrões configuráveis: **20 mensagens/h**, **100/24 h**, pergunta até **2.000 caracteres**, histórico de até **6.000 caracteres**, resposta até **700 tokens** e timeout de geração de **30 s**. As janelas são móveis, não viradas de calendário. Uma geração simultânea por usuário; mensagens aceitas com erro/cancelamento contam, pois podem consumir API. SDK recebe `max_tokens`; há ainda teto de texto local de até 12.000 caracteres. Respostas parciais são identificadas e excluídas do histórico reenviado ao modelo.

Uso e conversas persistem com MySQL, inclusive após reinício. Em `DB_MODE=memory`, são temporários e reinício zera uso; o banner avisa. Escopo continua uma única instância local, sem coordenação distribuída de cotas ou sessões.

Erros antes do streaming usam JSON/HTTP (400, 401, 403, 404, 409, 429 ou 503). Após abrir SSE, falhas usam evento `error`; sucesso usa `done`. Fechar/interromper resposta aborta a geração, e sessão é revalidada periodicamente durante o fluxo. O painel e a irrigação continuam independentes.

`ASSISTANT_DEMO=true` usa respostas pré-definidas e rótulo **resposta de demonstração, sem IA real**. Não precisa de chave, modelo ou internet e não faz fallback silencioso a partir de Claude. É o modo documentado para a banca.

## Evidência dos testes

Executados em SIMULAÇÃO, SDK/provedor falso e MySQL isolado local, sem Arduino nem chave real:

```powershell
$env:SDA_TEST_MYSQL_PORT = '3307'
npm test
npm run firmware:test
npm audit --omit=dev
```

**Resultado final Node: 57 aprovados, 0 falhas, 0 ignorados** — 44 anteriores e 13 novos. Testes antigos e firmware preservados sem edição. A suíte usa APIs/Socket.io locais reais, jsdom e mock de provedor, inclusive o SDK oficial com `fetch` falso. Bancos aleatórios de testes foram removidos ao final; o serviço MySQL80 existente foi preservado.

| Área | Evidência |
| --- | --- |
| Sessão/CSRF/master | Chat anônimo 401, sem CSRF 403; cliente usa chat, mas comando de bomba 403; regressões de logout/expiração/socket continuam aprovadas |
| Privacidade/contexto | Campos permitidos, SIMULAÇÃO, nulos/vencidos, vencimento durante clima, nomes livres descartados; PII/credenciais sanitizadas antes do payload |
| RAG | Recuperação de sensor/pH, ausência de correspondência, adição de documento e README ignorado; fontes em metadados |
| Streaming | Eventos progressivos antes do término, cancelamento, timeout e liberação da geração ativa |
| SDK oficial | Transporte falso verifica modelo configurado, `max_tokens`, `stream=true` e ausência de ferramentas; sem conexão real à Anthropic |
| Custo | Tamanho excedente, campos desconhecidos, cotas horárias/24 h, concorrência; uso persistido e recuperado em MySQL |
| Isolamento | Outro usuário não lista/abre/envia para conversa alheia; exclusão e recriação de conta não herdam conversas |
| Migração/persistência | Schema legado reconstituído migra; conteúdo e metadados persistem após reinício; paginação de 113 mensagens na conversa; sete tabelas mantidas |
| Falhas | Sem chave/modelo retorna 503; provedor falha com segredo falso e ele não aparece no retorno; parcial marcada e estado HTTP continua 200 |
| Prompt injection | Usuário, histórico e documento maliciosos ficam em dados; valores de sensor com instrução viram sem dados; nenhuma ação é executada |
| XSS/interface | HTML e `javascript:` não criam imagem/script/link; streaming no DOM, navegação e modo demo; cancelar confirmação envia zero comandos |
| Aplicação | Confirmar chama a mesma rota de bomba; NACK exibe retenção de partida e não muda bomba para ligada |

Firmware: **9.340 verificações em emulação**, zero falhas (9.319 controle/paridade, 6 concorrência alternativa, 15 sketch). Flash 14.150 bytes, SRAM 1.124 bytes; nenhum upload. `git diff 3875dd3 -- firmware scripts/check-firmware.js scripts/check-sketch.js` vazio.

Dependências: SDK adicionado e correções compatíveis aplicadas ao lockfile; `npm audit --omit=dev` terminou com **0 vulnerabilidades** reportadas. Isso não substitui revisão de segurança contínua.

## Roteiro e pendências

O passo a passo completo está em **TESTE-MANUAL-FASE-3.md**: instalar, executar demonstração sem chave, configurar MySQL, perguntas rápidas, contexto vencido, histórico, confirmação/ACK, limites, isolamento, adicionar documentos e ensaio opcional com chave/modelo reais.

Pendências:

1. **Firmware NÃO VALIDADO e ensaios físicos PAUSADOS.** Nenhuma alteração elétrica, de pinos, firmware ou lógica de segurança nesta fase. Somente o usuário confirma os ensaios quando tiver Arduino.
2. Teste opcional com conta real Anthropic, modelo disponível e orçamento próprio; qualidade, alinhamento, latência externa e disponibilidade do serviço não foram validados pelo provedor falso.
3. Revisão visual manual em Chrome/Edge/mobile e cópia via clipboard conforme permissões do navegador. Testes DOM não substituem revisão visual real.
4. Aprimorar conhecimento com materiais agronômicos revisados e adequados à cultura/região. Não há prescrição química, calibração física, garantia de anonimização de texto livre ou garantia de ausência de alucinação.
5. Instância única, sessões em memória e cotas persistentes dependentes do MySQL; produção distribuída e observabilidade de custos da conta exigem trabalho próprio.
6. Offline completo de Chart.js, fontes e ícones, além do redesign, permanece **Fase 4 — não iniciada**. O chat demo e seu renderizador são locais; o dashboard legado ainda usa CDN/cache.

## Commits por etapa

- `68d6cba`: SDK oficial e correções compatíveis de dependências.
- `b609dfb`: backend de streaming, contexto/RAG, limites e histórico.
- `eb32543`: privacidade, paginação e isolamento de conta excluída.
- `4cc6fb8`: sete documentos e instruções da base privada.
- `4e44e6a`: interface, Markdown seguro e aplicação confirmada.
- Commits seguintes: refinamentos finais, testes e documentação desta entrega.
