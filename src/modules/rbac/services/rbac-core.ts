export type RbacContext = {
  colegioId: string;
  permissoes: string[];
};

export function hasPermission(
  context: Pick<RbacContext, "permissoes">,
  permission: string,
): boolean {
  return context.permissoes.includes(permission);
}

export function canAccessTenant(
  context: Pick<RbacContext, "colegioId">,
  requestedColegioId: string,
): boolean {
  return context.colegioId === requestedColegioId;
}
