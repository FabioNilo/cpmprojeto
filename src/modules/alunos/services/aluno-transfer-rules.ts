type AlunoVinculo = {
  colegioId: string;
  status: "ATIVO" | "TRANSFERIDO" | "ENCERRADO";
};

export function isAlunoAtivoNoColegio(
  vinculos: AlunoVinculo[],
  colegioId: string,
): boolean {
  return vinculos.some(
    (vinculo) => vinculo.colegioId === colegioId && vinculo.status === "ATIVO",
  );
}

export function canColegioConsultarHistoricoAluno(
  vinculos: AlunoVinculo[],
  colegioId: string,
): boolean {
  return vinculos.some((vinculo) => vinculo.colegioId === colegioId);
}

export function canTransferAlunoFromColegio(
  vinculos: AlunoVinculo[],
  origemColegioId: string,
): boolean {
  return isAlunoAtivoNoColegio(vinculos, origemColegioId);
}

export function shouldDeactivateResponsavelOriginAccess(input: {
  transferredAlunoId: string;
  activeAlunoIdsInOrigin: string[];
}): boolean {
  return !input.activeAlunoIdsInOrigin.some(
    (alunoId) => alunoId !== input.transferredAlunoId,
  );
}
