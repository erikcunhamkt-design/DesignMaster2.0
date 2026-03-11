

# Design Builder — Plano de Implementação

## Visão Geral
App web para geração de imagens para redes sociais, com tema escuro e acentos roxos, usando Nano Banana Pro (google/gemini-3-pro-image-preview) como engine de IA. Layout fiel aos screenshots: sidebar + topbar + painel configurador à esquerda + preview à direita.

---

## Fase 1 — Layout Base & Tema
- **Tema escuro** com acentos roxos (#8B5CF6), bordas suaves, cards escuros
- **Sidebar fixa** à esquerda: Explorar, Criar (ativo), Minha Galeria
- **Topbar**: campo de busca, badge "API OK", ícone de usuário, botão "+ Novo"
- **Tabs de projeto** no topo (ex: "Projeto Alpha" com X para fechar e + para novo)
- **Layout split**: painel esquerdo com scroll (configurador) + painel direito grande (preview com estado "AGUARDANDO CRIAÇÃO")

## Fase 2 — Painel Configurador (Todas as Seções)
Todas as seções exatamente como nos screenshots, na ordem correta:

### A) Sujeito Principal
- Upload de fotos do sujeito (box com + e "UPLOAD")
- Quantidade: seleção 1–5 (pills, roxo quando ativo)
- Gênero: Masculino / Feminino (botões)
- Textarea: "Descrição da pose ou roupa (opcional)..."
- Posição do sujeito: ESQUERDA / CENTRO / DIREITA (cards visuais)

### B) Dimensões
- Grid com 4 opções: STORIES (9:16), HORIZONTAL (16:9), FEED QUADRADO (1:1), FEED RETRATO (4:5)
- Destaque roxo na seleção ativa

### C) Texto
- Toggle switch para ativar/desativar
- Campos condicionais: Texto 01 (headline), Texto 02 (subheadline), CTA
- Modo: "Texto como camada no app" ou "Texto dentro da imagem (IA)"

### D) Projeto & Cenário
- Campo nicho/projeto com chips rápidos (Futebol, Social Media, Rap, Trap, Gamer, etc.)
- Campo ambiente (texto livre)
- Toggle "Usar fotos de cenário?" com upload condicional

### E) Cores & Iluminação
- 3 barras de cor com picker: Cor do Ambiente, Luz de Recorte, Luz Complementar
- Salvamento de paleta por projeto

### F) Composição
- Cards: Close-up (Rosto), Plano Médio (Busto), Plano Americano
- Toggle "Elementos Flutuantes?" com campo de texto condicional
- Posição vertical do sujeito: Mais pra cima / Centralizado / Mais pra baixo

### G) Referências de Estilo
- Área de upload para até 4 referências adicionais com "ADICIONAR REFERÊNCIA"

### H) Atributos Visuais & Estilo
- Slider "SOBRIEDADE" (Criativo ↔ Profissional)
- Toggle "ATIVAR ESTILO VISUAL" com grade de estilos (Clássico, Formal, Elegante, Sexy, Institucional, Tecnológico, Glassmorphism, Interface UI, Minimalista, Lúdico, Cartoon, Infoproduto, Jovial, Gamer, Retrato Profissional, Ultra Realista, Glow)
- Toggles: Desfoque (Blur), Degradê Lateral
- "PROMPT ADICIONAL" com toggle + textarea

### I) Ações (Rodapé)
- Botão "Gerar Imagem" (desabilitado até validações)
- Botão "Duplicar Configuração"

## Fase 3 — Backend (Lovable Cloud)
- **Edge function para geração**: recebe configurações, monta prompt via PromptComposer, chama Nano Banana Pro
- **Edge function para upload**: receber e armazenar imagens de referência
- **Storage**: para imagens de referência e imagens geradas
- **Banco de dados**: tabelas para Projetos, Gerações, Referências, Paletas
- **Verificação de API**: endpoint para status "API OK"

## Fase 4 — PromptComposer (Cérebro do App)
Módulo que monta o prompt final a partir de todas as configurações:
- Prioridades: dimensão/safe zones → identidade da referência → paleta → composição → estilo → elementos flutuantes
- Negative prompt automático (mãos ruins, texto deformado, blur excessivo, etc.)
- Lógica de texto: se "camada no app" → pedir clean background/negative space; se "texto na imagem" → incluir texto no prompt
- Posição vertical influencia instrução de safe zone no prompt

## Fase 5 — Fluxo de Geração & Preview
- Estados no preview: "AGUARDANDO CRIAÇÃO" → "GERANDO..." (com skeleton/animação) → "CONCLUÍDO" (imagem renderizada)
- Overlay de texto no frontend quando modo "camada no app" ativo
- Download PNG/JPG da imagem final
- Histórico de gerações por projeto

## Fase 6 — Minha Galeria
- Grid de imagens geradas com filtros por projeto e dimensão
- Ao clicar: detalhe com prompt usado, configurações, botões "Regerar" e "Duplicar Config"

## Fase 7 — Explorar
- Página com templates prontos (Capa, Story, Thumb, Post educativo)
- Ao selecionar: preenche automaticamente o painel "Criar"

## Fase 8 — Fluxo de Referências
- Referência Principal (Pessoa): 1 imagem, prioridade máxima para identidade
- Inspirações adicionais (até 4): com checkboxes para indicar o que aproveitar (Estilo, Iluminação, Paleta, Ambiente, Pose, Composição, Elementos flutuantes, Layout)
- Inspirações nunca sobrescrevem a identidade da referência principal

---

## Validações para "Gerar Imagem"
- Dimensão obrigatória
- Nicho/Projeto obrigatório
- Se texto ativado: Texto 01 mínimo 3 caracteres
- Máximo 5 referências no total

## UX
- Skeleton loaders durante carregamento
- Transições suaves entre estados
- Todos os textos/labels em português conforme os screenshots

