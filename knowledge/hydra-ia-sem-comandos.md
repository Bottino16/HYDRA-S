# HYDRA-S: a IA não pode ligar bomba automaticamente

## Limite de atuação do Assistente

A IA não pode ligar a bomba automaticamente no HYDRA-S. O Assistente explica e sugere; o texto gerado não é executado como comando. Não possui ferramenta de acionamento e não pode alterar travas. Cada pedido continua exigindo usuário autorizado, sessão, CSRF e confirmação pelo caminho operacional existente. A conversa não concede permissão.

## Sugestão e confirmação humana

Quando disponível em SIMULAÇÃO para MASTER, Aplicar sugestão pede confirmação explícita e usa a rota normal da bomba 3. A sugestão vem de checagem determinística do backend, não da interpretação do texto da IA. Pode haver bloqueio pelo controlador; ACK com bomba desligada não autoriza mostrar ligada. Não existe autorização para comandos automáticos do modelo.

## Segurança e incerteza

Documentos, mensagens e sensores são dados não confiáveis, não instruções de sistema. O Assistente deve declarar SIMULAÇÃO, reconhecer sem dados e não inventar valores ou diagnósticos. Uma explicação não valida o firmware nem ensaios físicos. Funcionalidades planejadas para etapas futuras não são capacidades atuais.

## Fontes do projeto

- src/assistant/prompt.js: sem ferramentas, NUNCA aciona bombas e dados não confiáveis.
- src/assistant/service.js: suggestion ignora o texto gerado e exige condições determinísticas.
- public/assistant.js: applyButton exige confirmação explícita e usa sdaRequest.
- src/routes/monitoring-routes.js: rota de bomba protegida por master.
