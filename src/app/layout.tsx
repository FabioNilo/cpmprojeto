import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema Disciplinar CPM",
  description: "Fundação técnica do Sistema Disciplinar dos CPMs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
