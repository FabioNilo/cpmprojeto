import type { Metadata, Viewport } from "next";

import { RegistrarAplicativo } from "@/components/layout/registrar-aplicativo";

import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema Disciplinar CPM",
  description: "Acompanhamento disciplinar dos Colégios da Polícia Militar.",
  applicationName: "Disciplina CPM",
  appleWebApp: {
    capable: true,
    title: "Disciplina CPM",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icone-192.png",
    apple: "/icons/icone-apple.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1b31",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <RegistrarAplicativo />
      </body>
    </html>
  );
}
