

## Problema

O PROMPT ARCHITECT PRO recebe as partes **LOCKED** (seleções do sidebar: formato, cores, pose, enquadramento, etc.) e **EXPANDABLE** juntas num único prompt para o LLM. O sistema pede ao LLM "preserve MANDATORY INSTRUCTIONS exactly", mas o modelo frequentemente ignora, reescreve ou omite essas instruções — especialmente formato, cores e enquadramento.

## Solução

**Não confiar no LLM para preservar as partes locked.** Em vez de enviar tudo junto e esperar que o Architect preserve, a lógica deve:

1. Enviar **apenas o EXPANDABLE** para o Architect expandir criativamente
2. **Concatenar mecanicamente** `locked + architect_output` no código (não no LLM)

Isso garante 100% de fidelidade às seleções do sidebar, sem depender do comportamento do modelo.

## Alterações

**`supabase/functions/generate-image/index.ts`**

- Modificar `createPromptWithArchitect()`:
  - Enviar apenas `expandable` ao LLM para enriquecimento criativo
  - O system prompt do Architect será simplificado: "You receive a creative context. Enhance it into a hyper-detailed cinematic prompt following the 12-stage structure."
  - Remover do system prompt a instrução de "preserve MANDATORY" (não é mais necessário — locked não vai ao LLM)
  - Após receber o output do Architect, concatenar: `finalPrompt = sanitize(locked) + " " + sanitize(architectOutput)`
  - Se `expandable` estiver vazio, usar apenas `locked` sem chamar o Architect
  - Se `locked` estiver vazio, usar apenas o output do Architect

Esta mudança é cirúrgica — apenas na função `createPromptWithArchitect` e na constante `PROMPT_ARCHITECT_SYSTEM`. Nenhuma alteração no frontend ou no `PromptAgent.ts`.

