

## Plano: Integrar sistema Content Machine no Carrossel Master (sem menções a BD/Content Machine)

### Resumo
Substituir o `SYSTEM_PROMPT` atual do Carrossel Master pelo sistema editorial de 3 estados (Sensor → Intérprete → Editor) do arquivo enviado, removendo **todas** as referências a "BrandsDecoded", "BD", "Content Machine" e a frase de autoria final.

### Alterações

**1. Edge function `supabase/functions/chat-carousel-master/index.ts`**

- **Substituir o `SYSTEM_PROMPT`** (linhas 9-76) pelo conteúdo completo do arquivo `CONTENT_MACHINE_6-2.txt` (linhas 7-243), com as seguintes sanitizações:
  - Remover "Content Machine BD — Unified Agent 7.0" → usar título interno genérico (ex: "Sistema Editorial Interno")
  - Substituir toda menção a "BD" e "BrandsDecoded®" por referências neutras (ex: "editorial", "sistema")
  - "Micro-leitura BD" → "Micro-leitura"
  - "narrativa editorial BD" → "narrativa editorial"
  - "Carrossel BD" → "Carrossel editorial"
  - "densidade pop BrandsDecoded®" → "densidade pop cultural"
  - Linha 243 (frase "Fui criado pela BrandsDecoded®...") → substituir por: `"Sou o Carrossel Master, especializado em transformar cultura e tendências em narrativas editoriais de alto nível."`
  - Slide 10 disclaimer manter como está ("Post produzido com ajuda de Inteligência Artificial.")

- **Atualizar mensagem de abertura do model** (linha 101):
  - De: "Entendido! Sou o Carrossel Master..."
  - Para: "Você quer:\n1) Transformar um conteúdo existente em narrativa, ou\n2) Investigar um tema ou fenômeno atual?"

**2. Sugestões rápidas `src/pages/CarouselMasterChatPage.tsx`** (linhas 31-37)

Atualizar para refletir o novo sistema editorial:
- "🔍 Investigar um fenômeno cultural atual"
- "📰 Transformar um conteúdo existente em narrativa editorial"
- "🎯 Criar um carrossel investigativo sobre tendências de design"
- "🧠 Decodificar um comportamento de consumo recente"
- "🔥 Analisar uma tendência viral e transformar em carrossel"

**3. Deploy** da edge function `chat-carousel-master`

### Não muda
- Nome da página, rota, topbar — continua "Carrossel Master"
- Lógica de streaming, API key, imagens, histórico de conversas
- Modelo Gemini 3.1 Pro

