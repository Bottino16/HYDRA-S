# IA-3C — Respostas unificadas e experiência de leitura

## Auditoria anterior

O backend IA-3B já enviava partes automáticas no mesmo SSE e salvava texto agregado. A interface ignorava generation e usava um aviso genérico para todos os limites. Continuações manuais antigas geravam cartões separados, com cópia individual. Marcadores de continuação apareciam como mensagens do usuário no histórico. Fontes eram apresentadas apenas por cartão. A paginação e a rolagem precisavam considerar o agrupamento de partes e eventos de scroll programáticos.

## Implementação restrita ao frontend

- public/assistant.js: modelo visual de partes vinculadas, reconstrução do histórico, cópia completa, estados de progresso/interrupção, preservação de foco e rolagem.
- public/assistant.css: indicadores discretos, detalhes de rastreabilidade e remoção de parágrafos realmente vazios, sem ocultar texto ou impor limite de altura às respostas.
- test/assistant-unified-ui.test.js: testes novos.
- test/assistant-continuation-ui.test.js: expectativa alterada de dois cartões/âncoras para um cartão e conteúdo completo; mantém as verificações de clique explícito, payload, rascunho e segurança.
- test/assistant-ui.test.js: texto esperado de IDs citados passa de nesta parte para nesta resposta, porque o painel agora apresenta a união das fontes. Demais asserções preservadas.
- Este relatório.

Nenhuma mudança de backend, APIs, banco/migração, configuração, .env, autenticação, permissões ou regras operacionais. Modelo, contexto, tokens, timeout, concorrência, cotas, RAM e teto de caracteres da IA-3B permanecem iguais. Firmware NÃO VALIDADO fisicamente; exclusivamente SIMULAÇÃO.

## Resposta unificada e histórico

As gerações automáticas continuam no cartão existente. O evento generation diferencia Gerando resposta de Continuando resposta automaticamente. Continuações manuais são acrescentadas à mesma mensagem visual, mantendo a identidade de cada registro no modelo de apresentação.

Ao recuperar a conversa, o frontend agrupa registros assistant com continuationOf correspondente ao bloco ativo, em ordem de chegada. Uma pergunta real encerra esse agrupamento: vínculos não atravessam perguntas diferentes. Marcadores kind=continuacao/automatic são omitidos da conversação visual, preservados integralmente no armazenamento. IDs repetidos na paginação não duplicam partes.

O texto agregado da IA-3B não é novamente expandido pelos metadados parts: esses metadados são usados somente para rastreabilidade. Isso evita renderizar as mesmas gerações duas vezes.

Quando a raiz está fora da página carregada, o trecho permanece visível e a interface avisa que o início não está carregado, desabilitando a cópia como resposta completa. Carregar mensagens anteriores permite reconstruir o bloco, remover o aviso e habilitar a cópia. Não são feitos novos tipos de consulta nem inferidos vínculos inexistentes.

Os detalhes Partes e encerramento preservam motivos por geração e IDs de evidências por parte. Fontes e citações são reunidas sem duplicação de IDs. O aviso de que uma citação válida não comprova precisão foi mantido. Nenhuma fonte nova é produzida pelo frontend.

## Cópia e Markdown

Copiar resposta utiliza somente o conteúdo sanitizado da mensagem lógica, na ordem das partes, com separação de parágrafos e blocos. Não inclui indicadores, botões, motivos, pergunta de outro bloco ou painéis de fontes. Funciona durante/ao final do streaming e para respostas parciais; histórico paginado incompleto recebe o tratamento explícito descrito acima.

O renderizador seguro de Markdown não foi alterado. HTML de mensagens continua texto, sem criação de tags executáveis. Os testes incluem HTML malicioso e fontes com texto de script.

## Motivos exibidos

- stop: concluída, com aviso de revisão.
- length: limitada por tokens, possivelmente incompleta; botão manual somente se o backend permitir.
- output_cap: interrompida pelo limite total de caracteres; sem botão para continuar.
- timeout: parcial por tempo limite.
- cancelled: parcial por interrupção do usuário.
- memory: parcial por proteção de memória.
- error: parcial por erro.
- quota/context: parcial por cota ou contexto insuficiente.
- SSE encerrado sem evento terminal: parcial por conexão encerrada sem conclusão.

A interface também preserva o texto revisado do backend nos eventos done/review, substituindo somente a parte correspondente, sem duplicar o agregado. O botão Interromper resposta usa o AbortController existente e cancela a mesma cadeia. Nenhuma repetição automática é iniciada pelo navegador.

## Rolagem, foco e responsividade

Streaming acompanha o final somente enquanto a pessoa estiver no final. Eventos de rolagem provocados pelo próprio acompanhamento não desligam esse comportamento; subir para ler mantém a posição. Ao carregar mensagens anteriores, cartões existentes são reutilizados quando possível e a posição é compensada pela diferença de altura. Fontes/partes mantêm abertura e foco do resumo durante atualizações.

Prévia visual isolada em 127.0.0.1:3101, DB_MODE=memory, SIMULATE=true, com provedor falso e conversas de teste explicitamente identificadas no conteúdo. Nenhum Ollama real, MySQL ou servidor existente na porta 3000 foi usado para gerar essas respostas.

Revisados desktop 1440px, tablet 768px, celulares 360px e 390px, temas claro e escuro. Nas larguras móveis verificadas, não houve rolagem horizontal da página e o campo de entrada permaneceu dentro do viewport. O drawer de histórico móvel foi utilizado. Teste de teclado virtual FÍSICO não foi realizado: a verificação usa navegador desktop com viewport redimensionado e a integração visualViewport já existente. Deve ser conferido em aparelho real.

Capturas locais de apoio (não versionadas): .data/ia3c-desktop-escuro.jpg, .data/ia3c-360-claro.jpg, .data/ia3c-360-escuro.jpg, .data/ia3c-390-claro.jpg, .data/ia3c-390-escuro.jpg e .data/ia3c-768-escuro.jpg. As imagens de prévia não validam conteúdo agronômico do modelo.

## Testes

Suíte final:

    node --test --test-concurrency=1 test/assistant-unified-ui.test.js test/assistant-auto.test.js test/assistant-continuation.test.js test/assistant-references.test.js test/assistant-context.test.js test/assistant-ui.test.js test/assistant-continuation-ui.test.js test/assistant.test.js test/ollama.test.js test/frontend-sections.test.js

Log local: .data/tests-ia3c-final.txt. Resultado: 79 testes aprovados, zero falhas e zero ignorados, em 70,70 segundos. Os novos casos cobrem 0/1/2 continuações, estados distintos, reconstrução, duplicação por ID, referências, cópia, XSS, barreira entre perguntas, troca de conversa, paginação com raiz ausente, foco das fontes e leitura durante streaming. Testes existentes mantêm cobertura de cancelamento, isolamento entre usuários no backend, cotas, SSE, RAM, timeout, segurança e navegação.

As verificações são determinísticas com mocks, exceto a interação visual com navegador real usando provedor falso. Nenhum ensaio de qualidade/desempenho do Ollama real foi realizado. MySQL e testes de migração não foram executados.

## Roteiro manual

1. Reinicie normalmente o servidor se necessário e atualize o painel com Ctrl+F5. Mantenha SIMULATE=true e o provedor Ollama já configurado; não é preciso mudar o .env.
2. Abra Assistente do Solo. Faça uma pergunta curta e depois uma que gere length; confira Gerando resposta e Continuando resposta automaticamente no mesmo cartão.
3. Suba para ler durante o streaming: a leitura não deve ser puxada para o final. Volte ao final para retomar acompanhamento.
4. Interrompa uma geração. Confira texto preservado e identificação de resposta parcial.
5. Abra conversa antiga com continuações. Confira um cartão lógico, fontes e Partes e encerramento. Copie e cole em um editor: todas as partes devem estar em ordem, sem indicadores de progresso.
6. Se o início não estiver carregado, use Carregar mensagens anteriores antes de copiar a resposta completa.
7. Confira output_cap como limite total de caracteres, diferente de length. Não espere continuação após output_cap.
8. Confira 360/390px, tablet e desktop nos dois temas. Em celular real, abra o teclado e verifique campo, botão Enviar/Interromper e rolagem. Não force falta de RAM para testar a proteção.

## Proposta separada — orçamento maior (NÃO implementada)

Uma etapa futura, mediante autorização, pode comparar 3072, 6144 e 9216 caracteres agregados, mantendo 256 tokens por geração, até duas continuações, contexto 4096, uma geração ativa e deadline total de 60 segundos. Caracteres não equivalem a tokens; o teto por geração e o agregado devem ser contados separadamente e medidos empiricamente em português, incluindo Markdown e referências.

Critérios dessa avaliação futura: mais respostas com conclusão coerente, sem aumento de falhas por timeout/RAM, sem paralelismo, sem perda de cancelamento/cotas e com integridade do texto persistido e copiado. Medir latência, RAM/VRAM, taxa de length/output_cap e qualidade agronômica com memória suficiente. Aumento de caracteres não garante conclusão nem corrige conhecimento incorreto. Nenhum aumento foi aplicado nesta entrega.

## Pendências

Avaliação manual do usuário, teclado virtual em dispositivo físico e IA-3D com Ollama real em ambiente com memória suficiente. A interface não elimina repetições semânticas do modelo: preserva as partes armazenadas e apenas evita duplicá-las na apresentação. Não foi iniciada IA-3D nem alterado limite de geração.

## Commits

25b4146 — feat(chat): unifica respostas e apresenta motivos de encerramento. Este relatório é registrado em commit separado de documentação.
