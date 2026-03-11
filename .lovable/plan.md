

## Resultado do Scan de Segurança

O scan identificou 3 problemas:

### 1. CRITICO — Todas as 48 políticas RLS estão como RESTRICTIVE
Sem nenhuma política PERMISSIVE, nenhum usuário consegue acessar dados pelo client API. Isso significa que o app inteiro está efetivamente quebrado para operações de banco de dados. As políticas que concedem acesso (leitura, inserção, etc.) precisam ser PERMISSIVE. Apenas políticas que restringem (admin-only, service-role) devem permanecer RESTRICTIVE.

### 2. CRITICO — Participantes de conversas DM podem ser substituídos
A política UPDATE da tabela `direct_conversations` tem `WITH CHECK (participant_1 = participant_1 AND participant_2 = participant_2)` que compara a coluna consigo mesma (sempre TRUE). Qualquer participante pode trocar os IDs por qualquer outro usuário.

### 3. AVISO — Proteção contra senhas vazadas desabilitada
Recurso de autenticação que verifica se a senha do usuário aparece em bases de dados vazadas. Precisa ser habilitado manualmente nas configurações.

---

## Plano de Correção

### Migração SQL única para resolver os 2 problemas críticos:

**A) Converter políticas de acesso de RESTRICTIVE para PERMISSIVE**

Dropar e recriar como PERMISSIVE todas as políticas que concedem acesso aos usuários em todas as 16 tabelas. Manter como RESTRICTIVE apenas políticas de admin/service-role que servem para restringir.

Tabelas afetadas: `chat_conversations`, `chat_messages`, `chat_user_status`, `community_messages`, `direct_conversations`, `direct_messages`, `friendships`, `licenses`, `notification_reads`, `notifications`, `profiles`, `user_allowed_ips`, `user_favorites`, `user_recent_tools`, `user_roles`, `webhook_events`.

**B) Corrigir política UPDATE de `direct_conversations`**

Substituir o WITH CHECK tautológico por uma subquery que garante imutabilidade dos participantes:
```sql
WITH CHECK (
  participant_1 = (SELECT dc.participant_1 FROM direct_conversations dc WHERE dc.id = id)
  AND participant_2 = (SELECT dc.participant_2 FROM direct_conversations dc WHERE dc.id = id)
)
```

### Proteção contra senhas vazadas
Isso precisa ser habilitado manualmente em **Settings → Cloud → Authentication**. Não pode ser feito via código.

---

## Detalhes Técnicos

A migração SQL vai:
1. DROP cada política de acesso do usuário (SELECT, INSERT, UPDATE, DELETE por usuários autenticados)
2. Recriar com `CREATE POLICY ... AS PERMISSIVE` mantendo exatamente as mesmas expressões USING/WITH CHECK
3. Políticas admin-only e service-role permanecem RESTRICTIVE
4. Corrigir o WITH CHECK da `direct_conversations`

Nenhuma alteração no frontend. Nenhuma funcionalidade afetada — apenas corrige o modelo de acesso.

