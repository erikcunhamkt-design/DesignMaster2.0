

## Plano: Substituir PROMPT ARCHITECT PRO pelo GAB - PROMPT CREATOR PRO

### O que muda

O sistema atual (PROMPT ARCHITECT PRO) apenas **expande contexto** — recebe partes "expandable" e enriquece com iluminação/textura. O GAB é mais poderoso: ele **cria prompts hiper-detalhados completos** a partir de ideias simples, seguindo uma estrutura mandatória de 12 estágios.

### Arquitetura

A substituição acontece na edge function `generate-image/index.ts`:

```text
ANTES:
  locked + expandable → Architect expande só o expandable → junta com locked → gera

DEPOIS:
  locked + expandable → GAB recebe TUDO e cria prompt completo respeitando locked → gera
```

### Alterações

**1. `supabase/functions/generate-image/index.ts`**

- Substituir o `PROMPT_ARCHITECT_SYSTEM` pelo system prompt do GAB adaptado
- O GAB receberá as partes locked como "MANDATORY INSTRUCTIONS (preserve exactly)" e o expandable como "CREATIVE CONTEXT (enhance freely)"
- A estrutura mandatória do GAB será aplicada: `[Main Subject] [Pose/Action] [Environment] [Camera Angle] [Style] [Physical Details] [Texture/Lighting] [Colors] [Art Style] [Negative Commands] [Realism] [Deep Texture]`
- Output: prompt contínuo em uma linha, sem explicações
- Manter a lógica de fallback (se a chamada falhar, usar prompt raw)
- Ajustar temperatura para 0.4 (GAB precisa de mais criatividade que o Architect)
- Aumentar `maxOutputTokens` para 1200 (prompts do GAB são mais longos)

**2. Regras do GAB adaptadas ao contexto**

O system prompt será adaptado para:
- Respeitar partes LOCKED (sidebar selections) como instruções mandatórias
- Aplicar a estrutura de 12 estágios do GAB sobre o contexto expandable
- Sempre incluir: skin texture, extreme sharpness, depth of field, cinematic lighting
- Sempre adicionar negative commands: `(no text, no watermark, no logo)` — complementando o negative prompt existente
- Output somente em inglês (sem tradução PT, já que é interno)
- Prompt contínuo sem quebras de linha

**3. O que NÃO muda**

- `PromptAgent.ts` continua montando locked/expandable como antes
- A lógica de referenceImages, modelo, negative prompt separado — tudo igual
- O `expandedPrompt` continua sendo retornado no payload para exibição na UI
- Todas as outras edge functions e páginas não são afetadas

