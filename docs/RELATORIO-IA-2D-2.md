# HYDRA-S — IA-2D.2: rastreabilidade, fontes e instruções

## Diagnóstico antes das alterações

Auditoria registrada antes das edições em test/fixtures/sources-ia2d2-before.json, commit aae0458. Inspecionados Knowledge.search, fitLocalRequest, AssistantService, rotas SSE, ChatStore, Markdown e interface do Assistente.

- Os documentos já chegavam como dados JSON com ID, título e texto após seleção IA-2D.1. O adaptador Ollama repete o ajuste, cuja idempotência continua testada.
- sources no SSE e no histórico guardava somente ID/título dos documentos selecionados. Isso identifica envio ao modelo, não comprova que ele utilizou cada documento para cada afirmação.
- Não havia snapshot ou hash dos trechos. Uma edição futura na base dificultava reconstruir qual versão foi enviada.
- Não se conferiam IDs escritos no corpo, URLs, autores ou bibliografias gerados pelo modelo. A interface dizia Base consultada e remetia às referências da resposta, podendo sugerir mais confiança do que os dados permitiam.
- A continuação refazia a busca da pergunta original. Poderia usar outros documentos ou versões, apesar do vínculo com a resposta original.
- O prompt já continha regras essenciais de segurança e dados não confiáveis; faltava distinguir explicitamente explicação geral, ID citado e evidência efetivamente enviada.

## Estratégia implementada

### Proveniência no backend, por resposta e por parte

Após a montagem final, cada resposta recebe metadados opcionais provenance, no JSON já existente de conversas_ia. Contém versão, origem, ID raiz da continuação, documentos com ID/título/texto exato enviado, SHA-256 do texto, identificadores e hashes dos parágrafos e um hash do conjunto. O hash é do trecho enviado, não do arquivo completo, nem assinatura de uma instituição ou comprovação científica.

Os textos já passam pela redação de dados pessoais e seleção antes do snapshot. Os parágrafos mantêm a origem por ID de documento; IDs de evidência combinam esse ID e parte do hash, com hash integral também registrado. Snapshot não executa instruções presentes na base.

O campo sources foi mantido como lista de evidências enviadas, preservando a compatibilidade existente. Novo citations contém somente IDs encontrados no texto revisado e permitidos naquela parte. referenceReview indica versão, estágio de revisão e omissões; seu estado se chama ids-only-not-claim-validation para evitar confundir correspondência de identificador com validação de afirmações.

Não houve DDL, migração, nova tabela, mudança de armazenamento, nova rota ou alteração nos parâmetros aceitos. Metadados são opcionais e aditivos. As rotas continuam protegidas pelas verificações atuais de sessão, CSRF, conta e isolamento por usuário.

### Texto gerado e streaming

ReferenceGuard filtra referências reconhecidas antes de emitir os respectivos trechos: IDs entre colchetes precisam estar no contexto efetivo; arquivos .md sem colchetes também são conferidos. Referência a documento existente na base mas não enviado é igualmente recusada. Links Markdown externos, URLs HTTP/HTTPS, www, DOI e formas comuns de domínio não são aceitos como fontes do modelo: a bibliografia original foi excluída da seleção IA-2D.1 e não deve ser reconstruída por adivinhação.

Blocos de fontes/referências/bibliografia e atribuições explícitas como Segundo, Conforme e De acordo com são removidos quando reconhecidos. Há revisão final de padrões autor-ano. Marcadores incompletos são retidos entre fragmentos; não se esvazia buffer de referência inacabada após cancelamento. O limite de saída contabiliza o texto recebido, inclusive referências omitidas: filtragem não concede geração adicional.

Eventos meta/delta/done/error continuam existentes. done pode incluir reviewedText, citations e referenceReview; a interface aplica o texto final revisado à mesma mensagem, sem recarregar ou reiniciar streaming. Em falha com parte persistida, evento opcional review comunica a revisão antes de error. Clientes antigos podem ignorar campos/evento adicionais; nenhum parâmetro antigo se tornou obrigatório.

O texto salvo é o revisado, igual ao final exibido. Em interrupção pelo usuário, a conexão pode fechar antes dessa revisão chegar; o histórico recupera a parte persistida e sua auditoria. Por isso a interface não afirma que citações pendentes foram conferidas.

**Limite importante:** o filtro é lexical e não prova que toda atribuição implícita, nome próprio, URL ofuscada ou afirmação em linguagem livre foi identificada. Algumas referências podem ser reconhecidas apenas na revisão final. Não se promete ausência absoluta de alucinação no texto livre nem veracidade das frases. Uma atribuição legítima parecida com os padrões também pode ser omitida. A lista oficial de fontes exibida, entretanto, é montada pelo backend a partir do contexto, não por autores ou links inventados pelo modelo.

### Interface e histórico

No mesmo componente de fontes, com as mesmas classes e sem CSS novo:

- Evidências enviadas ao modelo: lista controlada pelo backend, mesmo se não citada.
- IDs citados nesta parte: subconjunto conferido, sem herdar citações de outra mensagem.
- Aviso de que envio de evidência ou ID válido não comprova precisão; indicação de referências omitidas e de ausência de evidência.
- Registro antigo sem snapshot: rotulado como fonte antiga sem auditoria de trechos. Não há reconstrução ou validação retroativa fictícia do histórico.

Modelo local, SIMULAÇÃO, Markdown seguro, cópia, vínculos da continuação, avisos de limite, carregamento de conversas e layout premium permanecem. Não foi realizada validação visual manual no navegador; os testes de DOM verificam os comportamentos alterados.

### Continuação manual

A primeira resposta guarda o snapshot. Cada continuação reutiliza os documentos desse snapshot, verificando os hashes, e passa novamente pela seleção/orçamento IA-2D.1 com telemetria atual. Não refaz a busca na base, não importa documento recém-adicionado e não declara como enviada uma fonte que não coube nesta parte.

Cada parte tem seu próprio snapshot e citations, ligada pela continuationOf/rootId existentes. Fontes do início não se tornam citações automáticas da continuação. Conversas antigas sem snapshot podem continuar com texto anterior e estado recente, mas sem alegar evidência documental original indisponível; não recebem fontes reconstruídas a partir da base atual.

Mantidos ação explícita, máximo configurável existente, limites de uso, uma geração, streaming, timeout e cancelamento. Não há continuação automática nem comando de bomba gerado pelo texto.

## Instruções revisadas

Reorganizadas por domínio/clareza, dados não confiáveis, segurança operacional, interpretação de dados, orientação profissional, fontes e continuação. Removida enumeração temática repetitiva; regras de fontes foram tornadas mais explícitas. Simplificação de organização não significa remover proteção ou prometer redução de tokens: novas regras de proveniência ocupam contexto.

Preservados português claro, até três tópicos curtos, conclusão objetiva, reconhecimento de ausência, diferenciação entre configuração e medição, sensor relativo e umidade volumétrica, caixa e solo, SIMULAÇÃO, privacidade, firmware NÃO VALIDADO, agrônomo/análise de solo, proibição de comandos executáveis ou contorno de travas. O aviso já dado pela aplicação não precisa ser repetido sem necessidade.

O modelo deve priorizar documentos pertinentes, diferenciar fatos documentados de explicações gerais e citar só IDs recebidos. Não inventar URLs, autores, datas ou bibliografias. A continuação usa pergunta/cauda como dados e não herda citações sem evidência atual daquela parte.

## Exemplo determinístico antes/depois

Exemplo sintético da auditoria, não uma geração real:

Antes, o texto não era conferido:

> Calibre [inexistente.md]. Fonte: Autor Inventado (2099). https://fonte-inventada.invalid/

Depois da revisão com somente sensor.md disponível:

> Calibre .

Citações aceitas: 0. Há evidência enviada, mas a resposta não citou um ID permitido; portanto não se cria citação artificial. O ID inexistente e a atribuição externa foram omitidos.

Snapshot sintético de sensor.md: SHA-256 13d7cf04f530b706a3de45f835e4491c20fcd4987b6ff4357a9837e56d9e94b7; ID do primeiro parágrafo sensor.md#13d7cf04f530b706. Esse exemplo não afirma que sensor.md seja arquivo agronômico real: é dado controlado de teste.

## Testes e resultados

- Suíte completa: npm test — **136 testes, 133 aprovados, zero falhas, três opcionais MySQL ignorados**, duração 112,2 segundos. Nenhum teste MySQL real executado.
- Testes direcionados de fontes/contexto/UI: 17 aprovados, zero falhas, 8,4 segundos.
- Após o refinamento de nomes .md sem colchetes/fronteiras de fragmento: fontes + suíte anterior do Assistente, 17 aprovados, zero falhas, 23,7 segundos. A suíte completa antecedeu esse refinamento; os testes pertinentes foram reexecutados depois. A alteração final de texto do aviso pendente não muda lógica.
- git diff --check sem erros. Firmware, banco, documentos knowledge/, algoritmo RAG, seleção/orçamento local, sensores/controle operacional e configuração sem alterações nesta etapa.

Novos testes verificam cinco perguntas reais de recuperação (alface, tomate, milho, calibração, caixa versus solo), correspondência exata entre payload/snapshot/SSE/histórico, ausência de evidência, arquivo inexistente, documento bibliográfico não enviado, URL/atribuição externa, fragmentos de 1/2/7 caracteres, hashes e snapshot adulterado, mudança da base entre partes, legado, injeção como dado, ausência de comandos e isolamento entre contas autenticadas. Os testes anteriores cobrem dados nulos/inválidos/simulados, timeout/cancelamento, autorização, ACK e travas, sem hardware.

O teste de contexto histórico agora compara as instruções da amostra com sua própria versão original, em vez de exigir que o prompt antigo da fixture seja idêntico ao prompt revisado autorizado. Mantém a asserção de que o ajuste não modifica o sistema fornecido; testes novos verificam as regras obrigatórias do prompt atual. Nenhuma asserção de autenticação, RAG ou controle foi removida.

## Arquivos modificados

- src/assistant/references.js: proveniência, verificação de snapshot, guarda incremental e revisão de IDs/formatos de referência.
- src/assistant/service.js: snapshots, fontes por parte e reutilização na continuação; persistência no JSON existente.
- src/assistant/routes.js: guarda do streaming e revisão final/parcial.
- src/assistant/prompt.js: instruções organizadas e critérios explícitos de fontes.
- public/assistant.js: rótulos de rastreabilidade e aplicação da revisão, sem redesign.
- test/assistant-references.test.js: cinco novos testes unitários/de integração.
- test/assistant-ui.test.js: teste adicional de fontes/revisão no DOM.
- test/assistant-context.test.js: comparação correta do prompt histórico.
- test/fixtures/sources-ia2d2-before.json: auditoria anterior.
- docs/RELATORIO-IA-2D-2.md: esta entrega.

## Commits

- aae0458 — auditoria anterior.
- e8c1025 — instruções e preservação do prompt da amostra histórica.
- ddf8965 — proveniência, revisão e testes.
- 2ca8b2a — arquivos .md sem colchetes e fronteira do streaming.
- 93ab65f — aviso de conferência pendente correto também após interrupção.
- Commit de relatório: consultar git log -1 após esta entrega.

## Limitações e recomendações para IA-2E

1. Avaliar respostas reais com RAM segura: fundamentação, extrapolações, repetições e atribuições em linguagem livre/ofuscadas. Testes determinísticos não comprovam precisão do llama3.2:3b nem resistência absoluta a prompt injection.
2. Confirmar tokenização real e estimativa/margem IA-2D.1. Não foram alterados seus parâmetros ou algoritmo; mudança do prompt pode alterar quais evidências cabem.
3. Avaliar se omissões por filtragem deixam a resposta clara e útil. O modelo pode citar um ID permitido para uma frase não sustentada; isso ainda exige avaliação semântica/humana.
4. Considerar política de retenção para snapshots no histórico, com autorização se exigir mudanças no banco. Esta etapa só acrescenta dados no JSON já suportado; não registra segredos de configuração, mas aumenta o tamanho dos metadados.
5. Registros antigos permanecem sem comprovação retroativa de trechos; seu texto original não foi reescrito no banco. Snapshots não são assinaturas e não cobrem adulteração por alguém com controle do armazenamento.
6. Firmware NÃO VALIDADO fisicamente; somente SIMULAÇÃO. Pendências operacionais anteriores e ensaios físicos continuam separados.

Não foram carregados modelos, instaladas dependências, modificados .env/limites, usadas APIs pagas ou aberta rede. Mantidos llama3.2:3b, contexto 4.096, saída 256, 60 segundos, uma geração e endpoint Ollama em loopback. Os provedores dos testes são falsos; nenhuma resposta real de IA foi validada.

## Conferência sem Ollama

1. Na raiz: node --test test/assistant-references.test.js.
2. Para interface: node --test test/assistant-ui.test.js.
3. Inspecione os metadados provenance, sources, citations e referenceReview gerados nos testes, observando a diferença entre envio e citação.
4. Aguarde autorização para IA-2E e ensaios reais com memória suficiente; não é necessário iniciar backend, MySQL ou modelo para esta conferência.

Somente IA-2D.2 implementada; aguardando aprovação.
