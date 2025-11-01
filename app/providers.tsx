"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

// Este é o componente que vai "prover" a sessão para
// todos os hooks useSession() da sua aplicação.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
