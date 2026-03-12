# Configuração do Supabase para Fotos

Este documento descreve as configurações necessárias no Supabase para que a funcionalidade de upload de fotos funcione corretamente.

## 1. Banco de Dados (Tabelas e RLS)

A tabela `photos` armazena os metadados das imagens.

### Estrutura da Tabela
| Coluna | Tipo | Descrição |
| --- | --- | --- |
| `id` | `bigint` | Chave primária |
| `visit_id` | `bigint` | Relacionamento com a tabela `visits` |
| `url` | `text` | Link público da imagem no Storage |
| `caption` | `text` | Legenda da foto |
| `user_id` | `uuid` | ID do usuário dono da foto |
| `created_at`| `timestamptz`| Data de criação |

### Políticas de RLS (SQL)
Execute este script no SQL Editor do Supabase:

```sql
-- Habilitar RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Política de Leitura (SELECT)
CREATE POLICY "photos_select" 
ON photos FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Política de Inserção (INSERT)
CREATE POLICY "photos_insert" 
ON photos FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Política de Exclusão (DELETE)
CREATE POLICY "photos_delete" 
ON photos FOR DELETE TO authenticated 
USING (auth.uid() = user_id);
```

---

## 2. Storage (Buckets e Políticas)

As imagens reais são armazenadas no bucket do Storage.

### Criação do Bucket
1. Vá em **Storage** -> **New Bucket**.
2. Nome: `photos`.
3. Marque como **Public**.

### Políticas do Bucket (Configuração Manual no Dashboard)
As políticas devem ser configuradas para o bucket `photos`:

#### Política de INSERT (Upload)
- **Name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**: `bucket_id = 'photos'`

#### Política de SELECT (Visualização)
- **Name**: `Allow public read`
- **Allowed operation**: `SELECT`
- **Target roles**: `anon`, `authenticated`
- **USING expression**: `bucket_id = 'photos'`

> [!IMPORTANT]
> Certifique-se de que não existam políticas restringindo o caminho (`path/folder`) específicas se você deseja permitir uploads em pastas organizadas por ID de visita.

---

## 3. Estrutura de Pastas
O sistema organiza as fotos da seguinte forma dentro do bucket `photos`:
`{visit_id}/{timestamp}.{extensao}`

Exemplo: `123/1710250000000.jpg`
