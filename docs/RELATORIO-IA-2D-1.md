# IA-2D.1 — contexto documental e dados ausentes

## Auditoria confirmada antes da alteração

- Knowledge.search retorna até três documentos, cada um com até dois parágrafos e 1.600 caracteres. AssistantService redige dados pessoais e coloca documentos, pergunta e telemetria em JSON, após o histórico. O sistema recebe as regras obrigatórias separadas.
- local-context.js selecionava apenas o primeiro documento, iniciava em 360 caracteres e cortava mais 24 caracteres até caber; podia terminar no meio de palavra, frase ou ressalva.
- O cálculo comparava bytes UTF-8 de sistema/JSON com 4.096 menos saída menos 256 de reserva. Era um teto muito conservador por bytes, não uma contagem real de tokens.
- Histórico recente vinha depois da prioridade de documentos. Na continuação, a pergunta original e a cauda anterior ficam no JSON obrigatório; AssistantService reduz essa cauda se o bloco não cabe. Nenhuma regra essencial é retirada.
- O adaptador Ollama chama fitLocalRequest novamente. Isso exigiu testar idempotência para as fontes enviadas coincidirem com os metadados persistidos pelo serviço.
- numeric(Number(profile.limite_umidade)) convertia null, string vazia, booleano e certos contêineres em número; null aparecia como zero no contexto. Leituras numéricas não eram limitadas ali à faixa do protocolo, embora a entrada operacional já valide esses valores.

Reprodução anterior salva em test/fixtures/context-ia2d1-before.json, commit 6ea98f1, antes de editar código. Usa sete perguntas e contexto sintético SIMULAÇÃO, limite null convertido incorretamente para zero, sem banco ou Ollama.

## Implementação

### Evidências completas e relevantes

Novo evidence.js atua somente sobre os documentos já retornados pelo RAG. Não lê o corpus, não altera a busca IA-2B nem acrescenta fontes externas. Normalização lexical pequena e equivalências explícitas ponderam termos específicos; quando há cultura identificada, parágrafos de outra cultura não entram só por conter irrigação. A ordem original do RAG desempata seleções. Nova cobertura de termos favorece evidências complementares.

O parágrafo é unidade atômica: conserva suas frases e ressalvas ou é omitido integralmente. Intl.Segmenter identifica frases; trecho com final incompleto, título isolado, cabeçalho, URL ou bibliografia não é usado como explicação. Texto continua não confiável e nunca é promovido a mensagem de sistema. Um parágrafo grande que não cabe é descartado, sem resumo inventado ou corte de palavras. Isso pode omitir informação útil; é uma escolha conservadora.

Até quatro parágrafos, entre os três documentos recuperados, são admitidos conforme pertinência e orçamento. Evidência com pontuação inferior à metade da melhor não preenche espaço. IDs e títulos originais são preservados e trechos do mesmo documento ficam agrupados. A seleção é determinística, mas correspondência lexical não comprova fundamentação científica.

O JSON final inclui evidencia_documental com estado parcial, quantidade de trechos e aviso para reconhecer afirmação sem suporte. Sem trecho apropriado que caiba, o estado informa explicitamente a ausência e documentos fica vazio. Nunca se declara cobertura documental completa só porque houve correspondência. As instruções de sistema já orientam reconhecer ausência de suporte; o prompt permanece byte a byte inalterado.

### Orçamento, unidades e prioridade

Mantidos llama3.2:3b, num_ctx=4.096, num_predict=256, timeout 60 s e uma geração. Nenhuma configuração local foi alterada.

A estimativa agora considera palavras latinas em aproximadamente dois bytes UTF-8 por token, com arredondamento por palavra; texto não latino, símbolos e sequências opacas longas usam o teto de bytes. Espaços possuem estimativa própria e cada mensagem tem sobrecarga. Isso é uma heurística conservadora, **não o tokenizador do modelo nem um limite superior formal para qualquer texto**. Não se tratam bytes e tokens como unidades equivalentes.

Reserva fixa de 768 tokens para template/variação da estimativa, além dos 256 de saída: o teto estimado de entrada é 3.072. Campos separados: estimatedInputTokens e serializedBytes. Assim, entrada com mais de 3.584 bytes pode caber na estimativa, sem ampliar o contexto configurado. A margem é proteção adicional, não validação real da tokenização.

Ordem de prioridade: sistema integral e JSON obrigatório (pergunta, telemetria, continuação e aviso documental); evidências; até quatro mensagens recentes de histórico que caibam. Se o obrigatório ultrapassa o teto, CONTEXT_LIMIT é devolvido sem remover regras. O tratamento de redução de cauda da continuação e os limites de caracteres/cotas permanecem existentes.

### Null, zero e validade

No contexto do assistente, limite de perfil aceita número finito entre 0 e 100, ou string decimal não vazia válida do MySQL. null, undefined, vazio, espaços, booleanos, contêineres, NaN, infinito e valores fora de faixa viram sem dados. Zero numérico e string decimal zero continuam zero.

Leituras permanecem numéricas e usam as faixas já existentes no protocolo: temperatura DHT de 0 a 60 e percentuais de 0 a 100. Máscara de alerta exige inteiro de 0 a 511. Bombas ausentes/inválidas aparecem desconhecidas; chuva ausente não vira false. Telemetria vencida continua sem dados, enquanto configuração do perfil permanece separada das medições. SIMULAÇÃO é preservada.

Nenhum valor armazenado é modificado. Conversões Number existentes em regras operacionais, scheduler e checagem de sugestão não foram alteradas, pois isso mudaria decisões de controle fora do escopo. Não foi concedido novo comando à IA.

## Comparação antes/depois

Mesmo corpus/perguntas/leituras sintéticas; no depois o limite originalmente null é corretamente sem dados. Contagens: antes = documentos/caracteres; depois = documentos/parágrafos/caracteres. Bytes e estimativas não são comparados como se fossem a mesma unidade.

| Pergunta | Antes docs/caracteres | Depois docs/trechos/caracteres | Entrada estimada/teto | Fontes efetivamente selecionadas |
|---|---|---|---|---|
| Qual é a umidade ideal para alface? | 1 / 288 | 1 / 1 / 382 | 2444 / 3072 | `irrigacao-culturas.md` |
| Como irrigar tomate? | 1 / 312 | 1 / 1 / 414 | 2456 / 3072 | `irrigacao-culturas.md` |
| Como irrigar milho? | 1 / 312 | 1 / 1 / 426 | 2465 / 3072 | `irrigacao-culturas.md` |
| Qual irrigação para tomate e milho? | 1 / 288 | 1 / 2 / 842 | 2750 / 3072 | `irrigacao-culturas.md` |
| Por que calibrar um sensor capacitivo de umidade? | 1 / 288 | 1 / 2 / 698 | 2634 / 3072 | `sensor-capacitivo-calibracao.md` |
| Qual é a diferença entre o nível da caixa e a umidade do solo? | 1 / 240 | 2 / 3 / 963 | 2925 / 3072 | `hydra-caixa-solo.md`, `hydra-cinco-boias.md` |
| Posso regar? | 0 / 0 | 0 / 0 / 0 | 2127 / 3072 | nenhuma |

Para tomate e milho, há um documento com duas evidências completas, uma de cada cultura, em vez de apenas o começo do tomate. Para caixa versus solo, o texto principal e informações relacionadas de boias explicam finalidades diferentes; não são medições atuais. Calibração preserva explicação e ressalva sem transferir equações do IRRIGAP ao HYDRA-S.

### Qual é a umidade ideal para alface?

Antes:

> Alface tem raízes relativamente superficiais. Não há percentual universal de umidade ideal na escala de um sensor não calibrado. Falta de água no estabelecimento, expansão das folhas e até a colheita prejudica a cultura. Irrigação considera clima e solo: em solo leve, aplicações menores

Depois:

**irrigacao-culturas.md**

> Alface tem raízes relativamente superficiais. Não há percentual universal de umidade ideal na escala de um sensor não calibrado. Falta de água no estabelecimento, expansão das folhas e até a colheita prejudica a cultura. Irrigação considera clima e solo: em solo leve, aplicações menores e mais frequentes podem ser necessárias. Excesso de água também prejudica qualidade e aeração.

### Como irrigar tomate?

Antes:

> Tomate não tem percentual ideal universal de umidade sem calibração e avaliação local. Irrigação deve atender florescimento, pegamento e crescimento dos frutos, sensíveis à falta de água. Considerar solo, chuva e demanda atmosférica; solo com menor reserva disponível tende a exigir maior frequência. Excesso de

Depois:

**irrigacao-culturas.md**

> Tomate não tem percentual ideal universal de umidade sem calibração e avaliação local. Irrigação deve atender florescimento, pegamento e crescimento dos frutos, sensíveis à falta de água. Considerar solo, chuva e demanda atmosférica; solo com menor reserva disponível tende a exigir maior frequência. Excesso de água pode reduzir qualidade e aeração radicular. Não há minutos fixos de bomba para tomate nesta base.

### Como irrigar milho?

Antes:

> Milho não tem percentual ideal universal de umidade em sensor não calibrado. Irrigação deve considerar a sensibilidade à falta de água no pendoamento, emissão de estigmas e polinização. O uso de água cresce com folhas e raízes; chuva, reserva do solo e fase importam. Solo arenoso pode exigir reposição mais freq

Depois:

**irrigacao-culturas.md**

> Milho não tem percentual ideal universal de umidade em sensor não calibrado. Irrigação deve considerar a sensibilidade à falta de água no pendoamento, emissão de estigmas e polinização. O uso de água cresce com folhas e raízes; chuva, reserva do solo e fase importam. Solo arenoso pode exigir reposição mais frequente. Excesso de água restringe raízes e absorção de nutrientes. Não há lâmina diária fixa para milho nesta base.

### Qual irrigação para tomate e milho?

Antes:

> Tomate não tem percentual ideal universal de umidade sem calibração e avaliação local. Irrigação deve atender florescimento, pegamento e crescimento dos frutos, sensíveis à falta de água. Considerar solo, chuva e demanda atmosférica; solo com menor reserva disponível tende a exigir maior

Depois:

**irrigacao-culturas.md**

> Tomate não tem percentual ideal universal de umidade sem calibração e avaliação local. Irrigação deve atender florescimento, pegamento e crescimento dos frutos, sensíveis à falta de água. Considerar solo, chuva e demanda atmosférica; solo com menor reserva disponível tende a exigir maior frequência. Excesso de água pode reduzir qualidade e aeração radicular. Não há minutos fixos de bomba para tomate nesta base.

> Milho não tem percentual ideal universal de umidade em sensor não calibrado. Irrigação deve considerar a sensibilidade à falta de água no pendoamento, emissão de estigmas e polinização. O uso de água cresce com folhas e raízes; chuva, reserva do solo e fase importam. Solo arenoso pode exigir reposição mais frequente. Excesso de água restringe raízes e absorção de nutrientes. Não há lâmina diária fixa para milho nesta base.

### Por que calibrar um sensor capacitivo de umidade?

Antes:

> Sensores capacitivos estimam água indiretamente por resposta dielétrica; precisam de calibração adequada ao solo. No HYDRA-S, seco e úmido criam escala relativa: isso não garante medição volumétrica nem capacidade de campo. Sem Arduino, apenas simulamos; valores provisórios não constitue

Depois:

**sensor-capacitivo-calibracao.md**

> Sensores capacitivos estimam água indiretamente por resposta dielétrica; precisam de calibração adequada ao solo. No HYDRA-S, seco e úmido criam escala relativa: isso não garante medição volumétrica nem capacidade de campo. Sem Arduino, apenas simulamos; valores provisórios não constituem calibração física.

> O IRRIGAP estudado em solo franco-argiloso não é comprovação de desempenho do sensor da maquete. Os dois extremos da escala do HYDRA-S não comprovam linearidade física nem transformam a leitura em teor volumétrico. Não transferir coeficientes, profundidades ou percentuais do artigo para perfis de plantas. Sensor capacitivo não mede pH ou nutrientes; dados ausentes significam sem dados.

### Qual é a diferença entre o nível da caixa e a umidade do solo?

Antes:

> Caixa cheia não significa solo encharcado. Nível da Caixa é água no reservatório; umidade do solo vem de outra leitura. Solo seco não significa falta de água na Caixa: pode haver água armazenada sem irrigação. No HYDRA-S, dados simulados de

Depois:

**hydra-caixa-solo.md**

> Caixa cheia não significa solo encharcado. Nível da Caixa é água no reservatório; umidade do solo vem de outra leitura. Solo seco não significa falta de água na Caixa: pode haver água armazenada sem irrigação. No HYDRA-S, dados simulados descrevem grandezas distintas, não medições físicas nem diagnóstico definitivo da plantação.

> O ultrassônico estima o nível da Caixa por distância; as boias da Caixa indicam mínimo e máximo. O sensor capacitivo representa umidade relativa do solo. A Caixa pode estar cheia enquanto o solo permanece seco; inversamente, solo úmido não comprova reserva de água. Para avaliar encharcamento, faltam observação de drenagem, solo e calibração física.

**hydra-cinco-boias.md**

> As cinco boias são, nesta ordem: Rio com água, Poço mínimo, Poço máximo, Caixa mínimo e Caixa máximo. A boia do Rio indica disponibilidade; as duas do Poço e as duas da Caixa indicam limiares de enchimento e disponibilidade. Não medem umidade do solo nem volume contínuo em litros.

### Posso regar?

Antes:

> Sem documentos.

Depois:

> Sem evidência pertinente que caiba no orçamento.


## Testes

- node --test test/assistant-context.test.js: seis aprovados, zero falhas.
- Regressão direcionada após ajuste final: node --test --test-concurrency=1 test/ollama.test.js test/assistant-context.test.js — 17 aprovados, zero falhas.
- npm test: 130 testes, 127 aprovados, zero falhas, três testes opcionais MySQL ignorados; duração 106,0 segundos. Não houve acesso a MySQL real.
- A suíte completa inclui os testes existentes de continuação, SSE/cancelamento/timeout, privacidade e prompt injection, autenticação/CSRF/permissões, regressões das interfaces e ACK/travas simuladas. Nada disso valida firmware ou respostas agronômicas reais.
- git diff --check sem problemas; diff de firmware, protocolo, bombas, banco, public/, documentos knowledge/ e configuração vazio nesta etapa.

Os seis testes novos abrangem auditoria anterior, idempotência da montagem, parágrafos completos, múltiplas culturas/fontes, rejeição de título/bibliografia/trecho truncado ou irrelevante, ausência explícita, estimador, margem, falha fechada, continuação como dado não confiável, null/zero/DECIMAL e leituras inválidas/vencidas. A suíte existente verifica cancelamento, SSE, isolamento, privacidade e ausência de comando automático por prompt injection. Testes não provam resistência absoluta do modelo real.

### Ajustes de testes antigos

- knowledge*.test.js: substituir teto antigo em bytes por estimatedInputTokens e teto de 3.072, sem mexer no contexto/fonte SIMULAÇÃO nem nas perguntas e expectativas de recuperação.
- knowledge.test.js: a asserção de exatamente um documento e prefixo cortado foi substituída por comprovação de origem de cada parágrafo selecionado, sem conteúdo fabricado. Agora múltiplas fontes e trechos completos são comportamentos autorizados.
- ollama.test.js: novo nome de campo e teto; saída 256, contexto 4.096, modelo, rejeição de excesso e todas as regras continuam exigidos.
- assistant-continuation.test.js: usar a mesma estimativa explícita em vez de somar bytes; preservados isolamento, CSRF, cancelamento, cauda não confiável, pergunta original, vínculo e limites de continuação.

Nenhuma asserção agronômica, de autenticação ou segurança operacional foi removida. Documentos agronômicos/técnicos e algoritmo Knowledge.search não foram editados.

## Arquivos e commits

- src/assistant/context.js: interpretação de valores ausentes e validade no contexto somente.
- src/assistant/local-context.js: orçamento e montagem.
- src/assistant/evidence.js: seleção local de parágrafos completos.
- test/assistant-context.test.js: seis novos testes determinísticos.
- test/fixtures/context-ia2d1-before.json: auditoria anterior.
- test/knowledge.test.js, knowledge-system.test.js, knowledge-agronomy.test.js, ollama.test.js e assistant-continuation.test.js: adaptação das invariantes do orçamento.
- docs/RELATORIO-IA-2D-1.md: este relatório.

Commits:

- 6ea98f1 — reprodução anterior.
- d79125f — dados ausentes e inválidos no contexto.
- 41a3335 — seleção de evidências, estimativa explícita e regressões.
- Commit de relatório: consultar git log -1 ao abrir esta entrega.

## Limitações e pendências para IA-2D.2

- Validar estimativa com a tokenização/contagem real de prompt do Ollama quando houver RAM segura; nenhum modelo foi carregado, nenhum benchmark RAM/VRAM ou precisão real foi afirmado. A margem não elimina toda incerteza.
- Seleção lexical não é validação semântica: ainda pode faltar evidência específica sobre uma cultura não coberta ou haver associação equivocada, como capacidade física/capacidade de campo. Nenhuma correção no recuperador IA-2B foi autorizada ou executada. A metadata parcial não certifica cobertura nem garante que o modelo admita a insuficiência.
- Parágrafo muito longo, incompleto após o corte de 1.600 caracteres do RAG ou sem pontuação final pode ser omitido. Não foi criado resumo automático. Contextos obrigatórios muito grandes continuam recusados. Contexto de 2.048 pode não comportar todas as instruções, e falha de forma explícita; a implantação permanece em 4.096.
- Histórico tem menor prioridade que evidências; continuação preserva a cauda dentro da política existente, mas pode omitir mais evidências se ocupar o orçamento. Cada continuação continua manual.
- Validar citações do texto gerado contra as fontes efetivamente enviadas continua pendente. ID correto em metadados não comprova que a resposta foi fundamentada.
- Relatórios antigos e notas históricas da IA-2B/IA-2C descrevem o corte anterior de 360 caracteres; esta entrega passa a documentar a montagem atual, sem editar os documentos protegidos.
- Firmware NÃO VALIDADO fisicamente; somente SIMULAÇÃO. Validação real da IA-1 e pendência operacional anterior da irrigação permanecem separadas.

## Conferência manual sem carregar modelo

1. Na raiz: node --test test/assistant-context.test.js.
2. Confira a tabela e os parágrafos completos acima, incluindo a pergunta conjunta de tomate e milho.
3. Para regressões: npm test. Os testes de MySQL real são opcionais e não precisam ser habilitados.
4. Não alterar .env nem iniciar Ollama para esta verificação determinística. Aguardar autorização para validações reais/etapa seguinte.

Somente IA-2D.1 implementada; aguardando aprovação.
