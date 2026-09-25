import { z } from "zod";

export const switchTenantSchema = z.object({
  colegioId: z.string().uuid(),
});
