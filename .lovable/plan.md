
Objetivo: fazer o tooltip “Copiar” ter animação suave de entrada/saída e, principalmente, corrigir o fluxo de seleção parcial nas respostas dos agentes para que copiar por seleção funcione de verdade.

O que encontrei
- O tooltip atual depende de `selectionchange` + `window.getSelection()`, mas ele só valida `anchorNode` dentro do container. Isso é frágil quando a seleção cruza nós do markdown, quando o navegador muda foco, ou quando o clique no próprio botão interfere na seleção.
- O botão atual copia usando `selection.toString()` no momento do clique. Se a seleção colapsar ao interagir com o tooltip, o texto some e nada é copiado.
- As páginas dos agentes renderizam o markdown inline em vários lugares, repetindo a mesma estrutura. Isso dificulta corrigir o comportamento de forma consistente.
- Já existe CSS liberando `user-select`, então o problema principal agora parece ser a lógica do tooltip/cópia, não só estilo.
- O replay indica interação na tela, mas não há evidência de um fluxo confiável de “selecionar texto → tooltip aparece → copiar seleção preservada”.

Solução proposta
1. Tornar a seleção estável
- No `SelectionCopyTooltip`, salvar o texto selecionado e o `Range` válido em estado/ref assim que a seleção mudar.
- Validar tanto `anchorNode` quanto `focusNode`, e usar `range.commonAncestorContainer` para garantir que a seleção inteira está dentro do container correto.
- Ignorar seleções vazias, muito pequenas, ou fora de mensagens do assistente.

2. Evitar que o clique destrua a seleção
- No clique do tooltip, copiar o texto salvo em estado/ref, não `window.getSelection()` ao vivo.
- Continuar usando `onMouseDown={preventDefault}`, mas também proteger com `pointerdown`/`mousedown` para impedir perda de foco antes da cópia.
- Manter a seleção visual por um instante após copiar e só depois limpar.

3. Posicionamento mais robusto do tooltip
- Calcular posição com base no `Range.getBoundingClientRect()`, mas prender dentro dos limites do container para não ficar cortado.
- Se não houver espaço acima, mostrar abaixo da seleção.
- Renderizar o tooltip apenas quando existir uma seleção válida dentro de conteúdo do assistente.

4. Entrada e saída suaves
- Trocar o comportamento “mount/unmount imediato” por estado visual:
  - `visible`: há seleção válida
  - `closing`: após copiar ou desfazer seleção, anima saída antes de desmontar
- Usar classes dedicadas de animação no tooltip, com fade + scale leves para entrada e saída.
- Respeitar o modo de acessibilidade com movimento reduzido.

5. Unificar o conteúdo de mensagem do assistente
- Parar de renderizar o markdown inline nas páginas dos agentes e passar a usar `AssistantMessageContent`.
- Isso centraliza:
  - classes de seleção
  - estilo do markdown
  - possíveis `data-attributes` como `data-assistant-message`
- Com isso, o tooltip pode mirar especificamente mensagens do assistente.

6. Restringir a seleção ao que faz sentido
- Adicionar um wrapper/atributo nas respostas do assistente, por exemplo `data-assistant-message="true"`.
- O tooltip só aparece quando a seleção estiver dentro desse wrapper, evitando conflito com input, sidebar e mensagens do usuário.

Arquivos que eu mexeria
- `src/components/chat/SelectionCopyTooltip.tsx`
  - reescrever a lógica de seleção, persistência do texto copiado, posicionamento e animações
- `src/components/chat/MessageContent.tsx`
  - fortalecer `AssistantMessageContent` com wrapper/atributos e classes reutilizáveis
- `src/pages/DesignMasterChatPage.tsx`
- `src/pages/BioChatPage.tsx`
- `src/pages/CalendarChatPage.tsx`
- `src/pages/EditorialChatPage.tsx`
- `src/pages/CarouselMasterChatPage.tsx`
  - substituir markdown inline por `AssistantMessageContent`
- `src/index.css`
  - adicionar animações de entrada/saída do tooltip e, se necessário, regras extras para seleção em conteúdo markdown do assistente

Resultado esperado
- Selecionar qualquer trecho da resposta do agente passa a funcionar de modo confiável.
- O tooltip “Copiar” aparece no local certo, sem sumir ao tentar clicar.
- O texto parcial é copiado mesmo que a seleção visual colapse no clique.
- A entrada e a saída do tooltip ficam suaves e consistentes em todos os chats de agentes.

Detalhes técnicos
```text
Fluxo novo:
1. user seleciona texto
2. selectionchange detecta range válido
3. componente salva:
   - selectedText
   - selectedRangeRect
   - selectionInsideAssistant = true
4. tooltip aparece com animação de entrada
5. user clica em "Copiar"
6. clipboard recebe selectedText salvo
7. estado muda para "Copiado"
8. tooltip anima saída
9. limpeza final da seleção/estado
```

Risco principal
- Como há 5 páginas com markup parecido, a correção precisa ser aplicada de forma uniforme; por isso a centralização em `AssistantMessageContent` é a parte mais importante para evitar que continue “funcionando em uma página e quebrando em outra”.
