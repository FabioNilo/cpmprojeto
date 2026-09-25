# Import de dados reais — CPM Rômulo Galvão (`bancoFad`)

Carrega o cadastro e o histórico disciplinar reais do arquivo Access `bancoFad`
(raiz de `react-projects`) para o schema `cpm` do Supabase, para testar o
módulo disciplinar com dados verídicos.

> ⚠️ **PII de menores.** O `bancoFad`, o `bancoFad.accdb` (hardlink) e
> `prisma/import/.data/*` estão no `.gitignore` e **não devem** ser versionados
> nem enviados a lugar nenhum. Rode só contra o schema `cpm` (**nunca**
> `cpm_test`). Depois do teste, restrinja o acesso ao projeto Supabase e
> resete a senha do banco.

## Pré-requisitos

- Python 3 + `pip install pyodbc` (o driver ODBC *Microsoft Access (`*.mdb, *.accdb`)*
  já vem instalado no Windows usado).
- Hardlink com extensão para o driver aceitar o arquivo sem extensão:
  ```powershell
  New-Item -ItemType HardLink -Path "..\..\..\bancoFad.accdb" -Target "..\..\..\bancoFad"
  ```
- `.env` com `DATABASE_URL` apontando para `...supabase.com:5432/postgres?schema=cpm`.

## Passos

```bash
npm run import:explore    # 01 - lista tabelas/colunas -> .data/schema-report.json
npm run import:extract    # 02 - extrai cadastro + FICHA 2026 -> .data/romulo-galvao.json
npm run import:load       # 03 - upsert no Supabase (idempotente)
npm run import:load -- --reset   # apaga as linhas do colégio RG e recarrega
```

## O que entra

| Origem no `bancoFad` | Vira |
|---|---|
| `Cópia de INFORMAÇÃO ALUNO1 03 03 26` (linhas com `ANO ATUAL = 2026`) | `Colegio` CPM-BA-RG + `AnoLetivo` 2026 + `Turma` (`Nº MED/FUN Letra`) + `Aluno` (matrícula/nome) + `AlunoVinculoColegio` ATIVO + `Matricula` |
| `FICHA` (linhas de 2026, sem marcador de início de ano) | `Ocorrencia` (tipo DISCIPLINAR, status ENCERRADA, `numero` = nº da comunicação) + `OcorrenciaAluno` (PROCEDENTE, ou ARQUIVADO se a disposição foi ARQUIVAMENTO). A disposição (ADVERTÊNCIA/REPREENSÃO/SUSPENSÃO/IMPEDIMENTO) fica no `resumo`; o texto do fato no `descricao`. Comunicante = usuário sintético `import.sef`. |

O `admin` do seed também é vinculado ao CPM-BA-RG como ADMINISTRADOR para dar
para navegar (`admin` / `Admin@12345` → trocar de CPM → CPM Rômulo Galvão).

**Faltas** (`faltas MES *`) não são importadas: as colunas de dia estão vazias
no arquivo.

## Não importado (disponível para fases futuras)

Responsáveis (nome/CPF/telefone estão no cadastro), notas por área
(`NOTAS GERAL *`), sanções como entidade própria (D5 fará o vínculo
disposição→`Sancao`), anexos embutidos.
