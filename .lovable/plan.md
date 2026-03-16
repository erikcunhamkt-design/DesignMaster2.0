

## Problema Identificado

O tooltip **nunca aparece visualmente** porque está renderizado dentro do `ScrollArea` (Radix), que aplica `overflow: hidden` no viewport. O tooltip usa `position: absolute` dentro do conteúdo scrollável, mas fica cortado/clipado pelo container do scroll.

Além disso, há um bug de closure stale: `dismiss` depende de `visualState`, e `handleSelectionChange` depende de `dismiss`, criando re-criações cíclicas dos callbacks.

## Solução

### 1. Tooltip com `position: fixed` (viewport coordinates)
Em vez de calcular posição relativa ao container e usar `absolute`, usar `position: fixed` com as coordenadas diretas do `getBoundingClientRect()` do Range. Isso elimina completamente o problema de clipping do ScrollArea.

### 2. Corrigir stale closures
Usar um `useRef` para `visualState` ao lado do state, para que `dismiss` não precise estar no dependency array de `handleSelectionChange`.

### Arquivo alterado
- `src/components/chat/SelectionCopyTooltip.tsx` — posicionamento fixed + refs para evitar closures stale

Nenhuma alteração necessária nas páginas de chat ou outros componentes.

