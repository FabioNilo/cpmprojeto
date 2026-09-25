"""
Fase B (passo 1) - Extracao do `bancoFad` (CPM Romulo Galvao) para JSON.

Somente leitura. Gera prisma/import/.data/romulo-galvao.json com:
  - colegio (fixo)
  - anoLetivo (2026)
  - alunos: cadastro do ano corrente
  - ocorrencias: registros disciplinares reais de 2026 (tabela FICHA)

O JSON contem PII e fica fora do versionamento (.gitignore).

Uso:
    python prisma/import/02-extract.py
"""

import json
import os
import re
from datetime import date, datetime

import pyodbc  # type: ignore

HERE = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
DB = os.path.join(WORKSPACE, "bancoFad.accdb")
OUT = os.path.join(HERE, ".data", "romulo-galvao.json")

ANO = 2026
ROSTER_TABLE = "Cópia de INFORMAÇÃO ALUNO1 03 03 26"

NIVEL_ABBR = {"MÉDIO": "MED", "MEDIO": "MED", "FUNDAMENTAL": "FUN"}
MARCADORES = ("INICIO", "INÍCIO")


def clean(v):
    if v is None:
        return None
    if isinstance(v, str):
        v = v.strip()
        return v or None
    return v


def as_int(v):
    try:
        return int(round(float(v)))
    except (TypeError, ValueError):
        return None


def nivel_de(nivel_raw, curso):
    n = clean(nivel_raw)
    if n:
        return n.upper()
    if curso is None:
        return None
    return "FUNDAMENTAL" if curso >= 6 else "MÉDIO"


def turno_de(turno_raw, nivel):
    t = clean(turno_raw)
    if t:
        return t.upper()
    if nivel == "FUNDAMENTAL":
        return "VESPERTINO"
    if nivel == "MÉDIO":
        return "MATUTINO"
    return None


def turma_nome(curso, nivel, letra):
    abbr = NIVEL_ABBR.get((nivel or "").upper(), "")
    prefixo = f"{curso}º" if curso is not None else "?"
    return f"{prefixo} {abbr} {letra}".replace("  ", " ").strip()


DATE_RE = re.compile(r"em\s+(\d{2})[/.-](\d{2})[/.-](\d{2,4})")


def data_do_ocor(texto, fallback):
    if texto:
        m = DATE_RE.search(texto)
        if m:
            d, mo, y = m.groups()
            y = int(y)
            if y < 100:
                y += 2000
            try:
                return datetime(y, int(mo), int(d)).isoformat()
            except ValueError:
                pass
    if isinstance(fallback, (datetime, date)):
        return fallback.isoformat()
    return None


def main():
    conn = pyodbc.connect(
        f"Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};Dbq={DB};Mode=Read;",
        readonly=True,
    )
    cur = conn.cursor()

    # ---- Alunos ----------------------------------------------------------
    cur.execute(
        f"SELECT [AL_MATRIC],[AL_NOME],[AL_CURSO],[AL_TURMA],"
        f"[FUNDAMENTAL/MÉDIO],[TURNO],[SEXO],[TRANSFERIDO] "
        f"FROM [{ROSTER_TABLE}] WHERE [ANO ATUAL] = {ANO}"
    )
    alunos = {}
    for r in cur.fetchall():
        matric = clean(r[0])
        nome = clean(r[1])
        if matric is None or not nome:
            continue
        matric = str(as_int(matric) or matric)
        curso = as_int(r[2])
        letra = (clean(r[3]) or "").upper() or None
        nivel = nivel_de(r[4], curso)
        turno = turno_de(r[5], nivel)
        alunos[matric] = {
            "matricula": matric,
            "nome": nome,
            "sexo": clean(r[6]),
            "transferido": (clean(r[7]) or "").upper() == "SIM",
            "turma": {
                "nome": turma_nome(curso, nivel, letra) if letra else None,
                "curso": curso,
                "nivel": nivel,
                "turno": turno,
                "letra": letra,
            },
        }

    # ---- Ocorrencias (FICHA 2026) --------------------------------------
    cur.execute(
        "SELECT [DATABICA],[AL_MATRIC],[CODOCOR],[OCOR],[OCOR ELOGIO],"
        "[ELOGIOS],[ASS P/ RESP],[NUMBIO],[NUM COMUNICAÇÃO],[NUM NOTIFICAÇÃO],"
        "[DATA DA NOTIFICAÇÃO],[DATA DE COMPARECIMENTO] "
        "FROM [FICHA] "
        "WHERE [DATABICA] >= #2026-01-01# AND [DATABICA] < #2027-01-01# "
        "AND ([FLAG_EXCL] IS NULL)"
    )
    ocorrencias = []
    for r in cur.fetchall():
        codocor = clean(r[2])
        ocor = clean(r[3])
        matric = clean(r[1])
        if matric is None:
            continue
        matric = str(as_int(matric) or matric)
        # pula marcadores de inicio de ano e linhas totalmente vazias
        if codocor and codocor.upper().startswith(MARCADORES):
            continue
        if ocor and ocor.lower().startswith("inicio"):
            continue
        if not codocor and not ocor:
            continue
        ocorrencias.append(
            {
                "matricula": matric,
                "disposicao": codocor,
                "texto": ocor,
                "elogio": clean(r[4]),
                "elogios": clean(r[5]),
                "cienciaResp": (clean(r[6]) or "").upper() == "SIM",
                "numeroBic": clean(r[7]),
                "numeroComunicacao": clean(r[8]),
                "numeroNotificacao": clean(r[9]),
                "dataOcorrencia": data_do_ocor(ocor, r[0]),
                "dataNotificacao": r[10].isoformat() if isinstance(r[10], (datetime, date)) else None,
                "dataComparecimento": r[11].isoformat() if isinstance(r[11], (datetime, date)) else None,
            }
        )

    payload = {
        "geradoEm": datetime.now().isoformat(),
        "colegio": {"codigo": "CPM-BA-RG", "nome": "Colegio da Policia Militar - Romulo Galvao"},
        "anoLetivo": ANO,
        "alunos": list(alunos.values()),
        "ocorrencias": ocorrencias,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)

    turmas = sorted({a["turma"]["nome"] for a in alunos.values() if a["turma"]["nome"]})
    disp = {}
    for o in ocorrencias:
        disp[o["disposicao"]] = disp.get(o["disposicao"], 0) + 1

    print(f"alunos 2026: {len(alunos)}")
    print(f"turmas distintas: {len(turmas)}")
    print(f"  {turmas}")
    print(f"ocorrencias FICHA 2026: {len(ocorrencias)}")
    print(f"  por disposicao: {json.dumps(disp, ensure_ascii=False)}")
    print(f"com data do fato parseada: {sum(1 for o in ocorrencias if o['dataOcorrencia'])}")
    print(f"\nJSON: {OUT}")
    conn.close()


if __name__ == "__main__":
    main()
