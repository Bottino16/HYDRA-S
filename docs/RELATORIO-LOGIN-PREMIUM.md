# HYDRA-S — redesign premium do login

## Diagnóstico visual

A vistoria no navegador confirmou a identidade azul/ciano existente, mas também a ilustração abstrata centrada em H, pouca relação visual com reservatórios e cultivo, hierarquia semelhante entre blocos e composição extensa em telas de menor altura. O formulário já possuía labels, erros seguros, carregamento e proteção contra envio duplicado; esses contratos foram preservados.

## Implementação

- Composição em duas áreas no desktop, com título editorial, destaque aquático e ilustração vetorial de água, reservatório e cultivo. Ilustração decorativa, sem representar telemetria ou uma ligação elétrica real.
- SVG estático e local; sem imagem pesada, biblioteca, fonte remota ou nova dependência.
- Nova superfície do formulário, ícone de gota, campos e botão refinados, mensagens com destaque e indicador leve de carregamento.
- Layout de uma coluna no celular, sem ilustração decorativa, campos de 16px para reduzir risco de ampliação automática em navegadores móveis e alvos de toque de pelo menos 46px.
- Temas claro e escuro usando tokens e preferência existentes; foco visível, link para pular ao formulário e respeito à redução de movimento.
- Os estilos novos são limitados a login-page; CSS compartilhado e administração não foram modificados. As classes de elementos novos existem apenas nesta página.

## Arquivos

- public/login.html: estrutura visual e SVG; IDs, labels, autocomplete e scripts funcionais mantidos.
- public/login-premium.css: estilos exclusivos do login.
- docs/RELATORIO-LOGIN-PREMIUM.md: relatório.

public/login.js e public/access-theme.js permanecem intactos, assim como backend, autenticação, sessões, CSRF, permissões, banco, IA, bombas, firmware e protocolo.

## Verificações

- node --test --test-concurrency=1 test/access-ui.test.js: seis testes aprovados, nenhuma falha. Cobrem payload e CSRF, envio duplicado, carregamento, erro seguro, fluxo de sucesso com fetch simulado, falha de conexão, preferência de tema e regressões da administração compartilhada.
- Conferência visual real em navegador local: 360, 390, 768, 1024 e 1440px, temas claro e escuro, sem sobreposições observadas. Verificações de largura do documento não indicaram rolagem horizontal nos tamanhos medidos.
- Teclado no navegador: Tab do usuário para senha e da senha para Entrar, com contorno de foco visível.
- git diff --check sem erros.
- Sem login real submetido, sem criação de conta, sem acesso ao MySQL, sem carregamento do Ollama e sem alteração de dados operacionais. Testes automatizados usam respostas simuladas; não equivalem a autenticação real no navegador.

Capturas locais não versionadas: .data/login-premium-desktop.jpg e .data/login-premium-mobile.jpg.

## Commits

- 70d60ac — composição premium, ilustração e layout responsivo.
- Commit posterior desta entrega: ajuste de legibilidade mobile e relatório; consultar git log -1.

## Avaliação manual e pendências

1. Com o servidor local já iniciado, abrir http://localhost:3000/login.html e usar Ctrl+F5.
2. Alternar tema, percorrer os campos com Tab e conferir desktop/celular.
3. Entrar com a conta existente; confirmar redirecionamento ao painel e mensagens de erro em uma tentativa controlada, se desejado.
4. Se o servidor estiver parado, executar npm start na raiz usando o ambiente local já configurado em SIMULAÇÃO. Não alterar .env para esta avaliação.

Pendente avaliação em aparelho físico com teclado virtual, preenchimento automático/gerenciador de senhas e autenticação real pelo usuário. Não houve auditoria formal WCAG nem teste de todos os navegadores. A L-2 operacional segue sem implementação; IA-2E continua parcialmente validada. O relatório IA-2E já não versionado no início foi preservado fora destes commits.

Somente o login foi redesenhado. Sistema exclusivamente em SIMULAÇÃO; firmware NÃO VALIDADO fisicamente. Aguardar aprovação antes de avançar para outra tela.
