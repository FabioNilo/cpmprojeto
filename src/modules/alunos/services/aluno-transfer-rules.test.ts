import { describe, expect, it } from "vitest";

import {
  canColegioConsultarHistoricoAluno,
  canTransferAlunoFromColegio,
  isAlunoAtivoNoColegio,
  shouldDeactivateResponsavelOriginAccess,
} from "./aluno-transfer-rules";

describe("aluno transfer rules", () => {
  const vinculos = [
    { colegioId: "cpm-origem", status: "TRANSFERIDO" as const },
    { colegioId: "cpm-destino", status: "ATIVO" as const },
  ];

  it("keeps a single student identity across CPM transfers", () => {
    expect(isAlunoAtivoNoColegio(vinculos, "cpm-origem")).toBe(false);
    expect(isAlunoAtivoNoColegio(vinculos, "cpm-destino")).toBe(true);
  });

  it("allows history lookup only to CPMs with a formal student link", () => {
    expect(canColegioConsultarHistoricoAluno(vinculos, "cpm-origem")).toBe(
      true,
    );
    expect(canColegioConsultarHistoricoAluno(vinculos, "cpm-destino")).toBe(
      true,
    );
    expect(canColegioConsultarHistoricoAluno(vinculos, "cpm-sem-vinculo")).toBe(
      false,
    );
  });

  it("allows transfer only from the CPM where the student is active", () => {
    expect(canTransferAlunoFromColegio(vinculos, "cpm-origem")).toBe(false);
    expect(canTransferAlunoFromColegio(vinculos, "cpm-destino")).toBe(true);
  });

  it("deactivates guardian origin access only when no other active student remains there", () => {
    expect(
      shouldDeactivateResponsavelOriginAccess({
        transferredAlunoId: "aluno-1",
        activeAlunoIdsInOrigin: ["aluno-1"],
      }),
    ).toBe(true);

    expect(
      shouldDeactivateResponsavelOriginAccess({
        transferredAlunoId: "aluno-1",
        activeAlunoIdsInOrigin: ["aluno-1", "aluno-2"],
      }),
    ).toBe(false);
  });
});
