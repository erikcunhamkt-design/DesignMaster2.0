

# Plano: Exportar dados do backend em CSV (Painel Admin)

## O que será feito

Adicionar uma seção "Exportar Dados" no painel Admin (`AdminPage.tsx`) com botões para exportar em CSV os dados de todas as tabelas do banco. Cada botão consulta uma tabela via Supabase client e gera um download CSV no navegador.

## Tabelas exportáveis

| Botão | Tabela/Fonte | Campos |
|-------|-------------|--------|
| Database (Licenças) | `licenses` | todos os campos |
| Users (Perfis) | `profiles` | todos os campos |
| Storage (Relatórios) | `admin_reports` | todos os campos |
| Chat Conversations | `chat_conversations` | todos os campos |
| Chat Messages | `chat_messages` | todos os campos |
| Community Messages | `community_messages` | todos os campos |
| Notificações | `notifications` | todos os campos |
| Favoritos | `user_favorites` | todos os campos |
| Roles | `user_roles` | todos os campos |
| IPs Permitidos | `user_allowed_ips` | todos os campos |
| DMs | `direct_messages` + `direct_conversations` | todos os campos |
| Posts Agendados | `scheduled_posts` | todos os campos |

> Nota: Secrets e Edge Functions não estão em tabelas acessíveis pelo client — serão omitidos ou indicados como "não exportável via frontend".

## Implementação

### 1. Criar componente `AdminDataExport.tsx`
- Grid de cards/botões, cada um representando uma categoria de dados
- Ao clicar, faz `supabase.from('tabela').select('*')` (admin tem RLS permissivo para a maioria)
- Converte o resultado em CSV (helper inline simples: headers + rows com `JSON.stringify` para campos JSON)
- Dispara download via `Blob` + `URL.createObjectURL`
- Indicador de loading por botão

### 2. Integrar no `AdminPage.tsx`
- Adicionar o componente `AdminDataExport` dentro da página admin, junto ao `AdminReports`

### 3. Acesso restrito
- Já protegido pelo `AdminRoute` existente — somente admin vê o painel

## Arquivos modificados
- **Novo**: `src/components/admin/AdminDataExport.tsx`
- **Editado**: `src/pages/AdminPage.tsx` (importar e renderizar o novo componente)

