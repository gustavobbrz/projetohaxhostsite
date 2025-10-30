import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HaxHost - Hospedagem Haxball",
  description: "Hospedagem profissional de salas Haxball com PM2",
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
