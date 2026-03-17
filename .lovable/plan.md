
Objetivo: desbloquear a seleção e cópia parcial do texto nas respostas do chat, inclusive via clique direito/long press, sem depender do tooltip.

O que identifiquei
- O bloqueio principal não é o tooltip.
- Em `src/main.tsx` existe um bloqueio global que afeta toda a aplicação:
  - `contextmenu` com `preventDefault()` desativa o botão direito.
  - `selectstart` com `preventDefault()` impede selecionar qualquer texto fora de `input/textarea`.
- Isso explica exatamente o comportamento que você descreveu: o texto da resposta da IA fica “travado”, então não dá para marcar e copiar um trecho normalmente.

Plano de correção
1. Remover o bloqueio global de seleção e menu contextual
- Tirar ou relaxar os listeners globais de `contextmenu` e `selectstart` em `src/main.tsx`.
- Prioridade: permitir o comportamento nativo do navegador no conteúdo do chat.
- Recomendação mais segura e robusta: remover esses bloqueios globalmente, porque eles não trazem proteção real e quebram UX/acessibilidade.

2. Garantir que as mensagens continuem explicitamente selecionáveis
- Manter o `AssistantMessageContent` com `select-text`.
- Revisar também o conteúdo das mensagens do usuário e wrappers dos bubbles para garantir que nenhum container acima esteja impondo `select-none` ou comportamento impeditivo.
- Se necessário, adicionar uma classe/wrapper padrão de conteúdo copiável para todas as mensagens de chat.

3. Preservar o tooltip apenas como recurso extra
- O tooltip de “Copiar” passa a ser complementar.
- Mesmo sem usar o tooltip, o usuário deve conseguir:
  - selecionar com mouse
  - copiar com `Ctrl/Cmd + C`
  - usar clique direito quando quiser
  - usar long press no mobile quando o navegador suportar

4. Validar em todas as telas de chat que usam o componente unificado
- Conferir principalmente as páginas que já usam `AssistantMessageContent` e `SelectionCopyTooltip`, para garantir consistência entre os agentes.
- Como a renderização já foi centralizada, a correção deve propagar bem.

Arquivos que eu alteraria
- `src/main.tsx`
  - remover/relaxar os bloqueios globais de `contextmenu` e `selectstart`
- `src/components/chat/MessageContent.tsx`
  - confirmar/fortalecer classes de seleção
- Páginas de chat que usam o conteúdo unificado
  - apenas se algum wrapper ainda estiver interferindo na seleção

Resultado esperado
- Será possível selecionar apenas um pedaço da resposta da IA normalmente.
- `Ctrl/Cmd + C` volta a funcionar sobre o trecho selecionado.
- O botão direito deixa de estar bloqueado no chat.
- O tooltip continua opcional, mas não será mais necessário para viabilizar a cópia.

Detalhe técnico
```text
Hoje:
main.tsx bloqueia "contextmenu" e "selectstart" no documento inteiro
-> o navegador nem deixa iniciar a seleção corretamente

Depois:
comportamento nativo do navegador liberado
+ conteúdo do chat marcado como selecionável
-> copiar trecho parcial funciona como em qualquer chat/editor normal
```

Observação de design
- Bloquear seleção, botão direito, devtools e atalhos não impede cópia de verdade e piora muito a experiência.
- Para chat com respostas longas, o correto é deixar o texto livre para seleção e usar o tooltip apenas como conveniência adicional.
