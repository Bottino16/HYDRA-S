# Visão Geral Premium V2 — auditoria inicial

Inspecionados public/maquete.js, dashboard.css, arthur.html, monitoring.js, ui-sections.js, ui-navigation.js e contratos dos testes de protocolo.

Problemas confirmados: reservatórios retangulares planos; grande quantidade de textos pequenos concorrentes nas boias; cartões de bombas com hierarquia pouco distinta; eixo X do gráfico sem quantidade máxima explícita de rótulos; quatro cartões de telemetria sem ressalvas locais sobre escala relativa. O circuito já respeita dados nulos e zero e não assume partida no clique. Esses contratos serão preservados.

Rolagem: desktop utiliza conteúdo e sidebar como painéis independentes; o corpo permanece fixo. A barra própria do menu é necessária quando a navegação excede a altura. Ajustes serão restritos à Visão Geral e não removerão itens nem o acesso por teclado. Mobile mantém rolagem natural e drawer existente.

Plano: estilos isolados em overview-v2.css; acabamento dos elementos existentes; indicador de nível continua baseado no número recebido, sem inferir vazão. Animação ambiente não significa circulação. Sem alterar comandos, validações, permissões, ACK, segurança, perfis, backend ou L-2. Exclusivamente SIMULAÇÃO; firmware NÃO VALIDADO fisicamente.

Resultados e roteiro serão acrescentados ao concluir a implementação.
