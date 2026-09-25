import { FormSection } from "@/components/forms/form-section";
import { AdminPage } from "@/components/layout/admin-page";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import { ChangePasswordForm } from "./change-password-form";

export const dynamic = "force-dynamic";

export default async function ContaPage() {
  await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);

  return (
    <AdminPage
      description="Configurações da sua conta."
      eyebrow="Conta"
      title="Minha conta"
    >
      <FormSection
        description="Ao alterar a senha, as suas outras sessões ativas são encerradas."
        title="Alterar senha"
      >
        <ChangePasswordForm />
      </FormSection>
    </AdminPage>
  );
}
