# Histórico e Eventos Premium V2 — auditoria e entrega

Auditoria: a seção é gerada por monitoring.js e history-view.js, com estilos history.css. A consulta atual usa três endpoints, período máximo de 31 dias e limit=100 por categoria. CSV exporta leituras do período (não acionamentos/eventos), sem o limite visual de 100. Eventos ao vivo guardam os últimos 100 recebidos desde a abertura, separados dos filtros locais dos eventos consultados.

Problemas visuais: título e descrição repetidos entre HTML e painel, filtros/feedback dispersos, cartões de indicadores grandes, três módulos longos empilhados e tabelas móveis pouco hierarquizadas. Direção aprovada: HYDRA-S Analytics, filtros compactos, indicadores proporcionais e abas locais sem refetch ou perda de estado; dados, unidades, validações e contratos preservados. A entrega final registrará testes, limites e roteiro.
