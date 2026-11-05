-- Cria o usuario "cpm_app", com acesso somente ao schema "cpm".
-- O outro sistema do mesmo projeto Supabase (schema "public") fica fora do alcance dele.
--
-- Como usar (passo a passo em docs/DEPLOY.md, secao 7):
-- 1. Gere uma senha no seu terminal: openssl rand -hex 32
-- 2. Troque TROQUE_ESTA_SENHA abaixo, sem salvar este arquivo com a senha real.
-- 3. Execute tudo no SQL Editor do Supabase.
-- O script pode ser executado de novo: ele so atualiza a senha e as permissoes.

DO $$
DECLARE
  senha text := 'TROQUE_ESTA_SENHA';
  objeto record;
BEGIN
  IF senha = 'TROQUE_ESTA_SENHA' THEN
    RAISE EXCEPTION 'Troque TROQUE_ESTA_SENHA antes de executar.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cpm_app') THEN
    EXECUTE format(
      'CREATE ROLE cpm_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD %L',
      senha
    );
  ELSE
    EXECUTE format('ALTER ROLE cpm_app LOGIN PASSWORD %L', senha);
  END IF;

  -- Necessario para o usuario atual poder transferir a propriedade.
  EXECUTE 'GRANT cpm_app TO CURRENT_USER';

  -- As migrations (prisma migrate deploy) alteram tabelas, entao o usuario do
  -- app precisa ser dono dos objetos do schema "cpm", e somente desse schema.
  EXECUTE 'ALTER SCHEMA cpm OWNER TO cpm_app';

  FOR objeto IN
    SELECT c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'cpm'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'S')
      -- Sequencia ligada a uma tabela muda de dono junto com a tabela.
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.classid = 'pg_class'::regclass
          AND d.objid = c.oid
          AND d.deptype IN ('a', 'i')
      )
  LOOP
    EXECUTE format(
      'ALTER %s cpm.%I OWNER TO cpm_app',
      CASE objeto.relkind
        WHEN 'S' THEN 'SEQUENCE'
        WHEN 'v' THEN 'VIEW'
        WHEN 'm' THEN 'MATERIALIZED VIEW'
        ELSE 'TABLE'
      END,
      objeto.relname
    );
  END LOOP;

  -- Tipos enum do schema (tipos internos de tabela nao entram).
  FOR objeto IN
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'cpm' AND t.typtype = 'e'
  LOOP
    EXECUTE format('ALTER TYPE cpm.%I OWNER TO cpm_app', objeto.typname);
  END LOOP;

  -- Retira qualquer acesso direto a tabelas de outros schemas. Nao altera as
  -- permissoes dos usuarios do outro sistema.
  EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM cpm_app';
  EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM cpm_app';

  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA storage FROM cpm_app';
  END IF;
END
$$;

-- Conferencia. Esperado: acesso_cpm = true e os demais = false.
SELECT
  has_schema_privilege('cpm_app', 'cpm', 'USAGE') AS acesso_cpm,
  EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm')
      AND has_table_privilege('cpm_app', c.oid, 'SELECT')
  ) AS le_tabelas_public,
  (SELECT rolsuper OR rolbypassrls OR rolcreaterole FROM pg_roles WHERE rolname = 'cpm_app') AS tem_privilegio_elevado;
