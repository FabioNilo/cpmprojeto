"""
Fase A - Descoberta do banco Access `bancoFad` (CPM Romulo Galvao).

Somente leitura. NAO abre tabelas de anexo (f_* / _f_*). Gera um relatorio
de schema em prisma/import/.data/schema-report.json e imprime um resumo.

Uso:
    pip install pyodbc
    python prisma/import/01-explore.py [caminho_do_accdb]

Se o caminho nao for passado, procura por ../bancoFad.accdb (hardlink do
arquivo `bancoFad` sem extensao) e depois ../bancoFad.
"""

import json
import os
import sys
from datetime import date, datetime
from decimal import Decimal

try:
    import pyodbc  # type: ignore
except ImportError:
    sys.exit("pyodbc nao instalado. Rode: pip install pyodbc")

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
WORKSPACE_ROOT = os.path.abspath(os.path.join(REPO_ROOT, ".."))
OUT_DIR = os.path.join(HERE, ".data")
OUT_FILE = os.path.join(OUT_DIR, "schema-report.json")

DRIVER = "{Microsoft Access Driver (*.mdb, *.accdb)}"

# Tabelas de sistema / anexo que NAO devem ser lidas.
SKIP_PREFIXES = ("MSys", "~", "f_", "_f_", "USys")

# Tipos ODBC binarios / OLE que nao devem entrar nas amostras.
BINARY_SQL_TYPES = {-2, -3, -4, -10}  # BINARY, VARBINARY, LONGVARBINARY, WLONGVARCHAR-ish


def resolve_db_path() -> str:
    if len(sys.argv) > 1:
        return sys.argv[1]
    for cand in (
        os.path.join(WORKSPACE_ROOT, "bancoFad.accdb"),
        os.path.join(WORKSPACE_ROOT, "bancoFad"),
    ):
        if os.path.exists(cand):
            return cand
    sys.exit(
        "Nao encontrei bancoFad.accdb nem bancoFad em "
        + WORKSPACE_ROOT
        + ". Passe o caminho como argumento."
    )


def jsonable(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (bytes, bytearray, memoryview)):
        return f"<binario {len(bytes(value))} bytes>"
    if isinstance(value, str) and len(value) > 120:
        return value[:120] + "..."
    return value


def main() -> None:
    db_path = resolve_db_path()
    print(f"Banco: {db_path}")
    os.makedirs(OUT_DIR, exist_ok=True)

    conn_str = f"Driver={DRIVER};Dbq={db_path};Mode=Read;"
    conn = pyodbc.connect(conn_str, readonly=True, timeout=15)
    cur = conn.cursor()

    tables = []
    for row in cur.tables(tableType="TABLE"):
        name = row.table_name
        if name.startswith(SKIP_PREFIXES):
            continue
        tables.append(name)
    tables.sort()
    print(f"{len(tables)} tabelas de usuario encontradas.\n")

    report = {"db_path": db_path, "tables": {}}

    for name in tables:
        entry = {"columns": [], "row_count": None, "sample": [], "error": None}
        try:
            cols = []
            for c in cur.columns(table=name):
                cols.append(
                    {
                        "name": c.column_name,
                        "type_name": c.type_name,
                        "sql_type": c.sql_data_type,
                        "size": c.column_size,
                        "nullable": bool(c.nullable),
                    }
                )
            entry["columns"] = cols

            try:
                cur.execute(f"SELECT COUNT(*) FROM [{name}]")
                entry["row_count"] = cur.fetchone()[0]
            except Exception as e:  # noqa: BLE001
                entry["row_count"] = f"erro: {e}"

            safe_cols = [
                c["name"]
                for c in cols
                if c["sql_type"] not in BINARY_SQL_TYPES
                and "OLE" not in (c["type_name"] or "").upper()
                and "ATTACH" not in (c["type_name"] or "").upper()
            ]
            if safe_cols:
                col_list = ", ".join(f"[{c}]" for c in safe_cols)
                cur.execute(f"SELECT TOP 5 {col_list} FROM [{name}]")
                fetched = cur.fetchall()
                for r in fetched:
                    entry["sample"].append(
                        {safe_cols[i]: jsonable(r[i]) for i in range(len(safe_cols))}
                    )
        except Exception as e:  # noqa: BLE001
            entry["error"] = str(e)

        report["tables"][name] = entry

        cnt = entry["row_count"]
        col_names = ", ".join(c["name"] for c in entry["columns"][:12])
        more = "" if len(entry["columns"]) <= 12 else f" (+{len(entry['columns']) - 12})"
        print(f"- {name}  [{cnt} linhas]")
        print(f"    colunas: {col_names}{more}")
        if entry["error"]:
            print(f"    ERRO: {entry['error']}")

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\nRelatorio completo em: {OUT_FILE}")
    conn.close()


if __name__ == "__main__":
    main()
