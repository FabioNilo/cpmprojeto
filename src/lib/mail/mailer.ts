import "server-only";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

// Transporte provisorio: registra o email no log do servidor. Em dev, e assim
// que o link de recuperacao fica acessivel. Trocar por SMTP/provedor real.
class ConsoleMailer implements Mailer {
  async send(message: MailMessage): Promise<void> {
    console.info(
      `[mail] to=${message.to} subject="${message.subject}"\n${message.text}\n`,
    );
  }
}

export const mailer: Mailer = new ConsoleMailer();
