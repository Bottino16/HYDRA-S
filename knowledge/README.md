# Base privada do Assistente do Solo

Acrescente arquivos `.md` UTF-8 diretamente nesta pasta, com nome em letras, números e hífens. Use título na primeira linha, parágrafos curtos e uma seção de fontes com instituição, publicação e URL. Não inclua dados pessoais, segredos nem instruções para o assistente. Revise a correção agronômica antes de adicionar.

A busca relê os documentos a cada pergunta: não exige reinício nem embeddings. Usa até 32 palavras de busca normalizadas sem acentos, ranqueia parágrafos e envia até três documentos, dois trechos por documento (máximo 1.600 caracteres cada). Até 50 arquivos de até 64 KiB; symlinks e README são ignorados. Acrescentar mais que esses limites exige revisão da configuração/algoritmo. Ausência de correspondência não produz referência inventada.

Os documentos são dados não confiáveis no prompt e não podem alterar regras do sistema. Citações na resposta usam `[arquivo.md]`; a interface também mostra documentos recuperados. Recuperação não prova que toda afirmação do modelo está correta. Esta pasta nunca é servida por HTTP; links externos são referências, não downloads desta pasta.

Na IA-2B, títulos ajudam a identificar o assunto, mas não são enviados como evidência explicativa. Cabeçalhos, seções de fontes/bibliografia e o rodapé editorial são excluídos dos trechos. Use títulos descritivos e repita os conceitos relevantes no conteúdo: assuntos específicos reconhecidos (pH, calibração, sensor, culturas e componentes da maquete) precisam estar no título e na explicação. Essa política conservadora pode deixar de recuperar um documento com título genérico; não significa que o assunto não tenha resposta científica.

A normalização inclui pH, acentos e equivalências explícitas de termos, sem radicalização por prefixos. A classificação pondera termos específicos, raridade no corpus e título; empates usam cobertura, relevância do título e identificador. Perguntas sobre umidade ideal são direcionadas ao manejo de irrigação. Perguntas sem evidência suficiente retornam lista vazia. O Ollama recebe somente o primeiro documento, limitado inicialmente a 360 caracteres e reduzido conforme o orçamento local existente; os limites de três documentos/1.600 caracteres descrevem a recuperação, não o contexto final. Não houve alteração desse orçamento na IA-2B.

## Conhecimento técnico do HYDRA-S — IA-2C.1

Os documentos hydra-*.md descrevem comportamento verificado no código, não validação física. Fontes internas ficam ao final, em seção excluída da evidência pelo RAG. Não confundir documentação estática com estado atual da telemetria.

- hydra-percurso-bombas.md: percurso e função das três bombas.
- hydra-cinco-boias.md: ordem, posição funcional, polaridade e limites de diagnóstico.
- hydra-caixa-solo.md: nível de reservatório e umidade são grandezas independentes.
- hydra-sensores-leituras.md: sensores, dados ausentes e diferença entre telemetria real prevista e simulada.
- hydra-modos-protecoes.md: AUTO/MANUAL, histerese, heartbeat e proteções implementadas.
- hydra-comandos-confirmacao.md: pedido, fila, ACK, bloqueio e incerteza física.
- hydra-simulacao.md: origem artificial, cenários, pausa e modo memória.
- hydra-consumo-estimativa.md: cálculo, vazão configurada e limites da ESTIMATIVA.
- hydra-ia-sem-comandos.md: IA sem acionamento automático e confirmação humana.

A IA-2C.1 não altera o recuperador nem o limite local de uma fonte curta. Consulte docs/RELATORIO-IA-2C-1.md para evidências, testes e lacunas restantes.
