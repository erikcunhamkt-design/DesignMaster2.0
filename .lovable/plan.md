

## Plano: Gerar Relatório PDF da Infraestrutura Cloud

### Objetivo
Criar um documento PDF profissional com o panorama completo da infraestrutura backend, sem expor dados sensíveis.

### Dados já coletados
Consultei o banco de dados e o projeto para levantar todos os números:

| Métrica | Valor |
|---------|-------|
| Tabelas (schema public) | 21 |
| Usuários registrados | 27 |
| Storage Buckets | 3 (todos públicos) |
| Edge Functions | 23 |
| Database Functions | 6 |
| Secrets configurados | 7 (apenas nomes) |
| Cron Jobs | 0 |
| Políticas RLS | 63 |
| Tipos customizados (enums) | 2 |

### Conteúdo do PDF
1. **Resumo Executivo** — tabela com todas as métricas acima
2. **Tabelas do Banco** — lista das 21 tabelas com quantidade de colunas e políticas RLS
3. **Storage Buckets** — 3 buckets com visibilidade
4. **Edge Functions** — lista das 23 functions
5. **Database Functions** — 6 functions com tipo e nível de segurança
6. **Secrets** — 7 nomes (sem valores)
7. **Cron Jobs** — nenhum configurado
8. **Tipos Customizados** — app_role e chat_status
9. **Observações de Segurança** — notas sobre RLS, SECURITY DEFINER, buckets públicos

### Implementação
- Script Python com ReportLab para gerar o PDF
- Tabelas estilizadas com cores roxas (identidade do projeto)
- Saída em `/mnt/documents/relatorio_backend_cloud.pdf`
- QA visual após geração

### Segurança
Nenhum valor de secret, token, senha ou chave será incluído — apenas nomes de referência.

