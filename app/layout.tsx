// Este é o app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers"; // <-- 1. IMPORTAR O NOVO ARQUIVO

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HaxHost",
  description: "Seu projeto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* 2. ENVOLVER O CHILDREN COM O PROVIDERS */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
