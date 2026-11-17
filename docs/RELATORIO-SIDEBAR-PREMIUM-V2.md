# Sidebar Premium V2 — auditoria e entrega

## Diagnóstico inicial

A versão anterior usa sidebar fixa de 292/272px ou drawer até 800px. Não existe botão/estado de recolhimento no desktop. A barra inteira rola, incluindo marca e status, e folhas legadas em arthur.html, ui-foundation.css e ui-polish.css também definem dimensões. A folha isolada sidebar-premium.css será consolidada para resolver esses conflitos sem alterar as outras telas.

Plano: 276px expandida, 80px compacta, preferência local não sensível, rótulos acessíveis e dicas nos ícones; marca/ações de cabeçalho e status fixos, somente lista rolável. Tablet largo compacto por padrão quando não há preferência; drawer até 800px preservado. Detalhes de implementação, testes e limitações serão registrados na conclusão.
