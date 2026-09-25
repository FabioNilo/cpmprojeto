import { z } from "zod";

export const enviarAvisoManualSchema = z.object({
  responsavelId: z.string().uuid(),
  titulo: z.string().trim().min(3).max(120),
  mensagem: z.string().trim().min(3).max(2000),
});
