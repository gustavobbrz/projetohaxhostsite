import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route"; // Importa suas opções

// 1. A página agora é um Server Component (sem "use client")
export default async function DashboardPage() {
  // 2. Buscamos a sessão DIRETAMENTE NO SERVIDOR.
  //    Isso é muito mais rápido e confiável que o useSession.
  const session = await getServerSession(authOptions);

  // 3. Se não houver sessão, o servidor redireciona
  //    antes de mandar a página para o cliente.
  if (!session) {
    redirect("/");
  }

  // 4. Se chegamos aqui, o usuário ESTÁ logado.
  //    Não precisamos mais de "status === 'loading'".
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6">
          Painel de Controle
        </h1>

        <div className="bg-gray-800/50 rounded-xl p-6 border border-purple-500/20">
          <p className="text-xl text-gray-300">
            Olá,{" "}
            <span className="text-purple-400 font-semibold">
              {session?.user?.name}
            </span>
            ! Esta é sua área de cliente.
          </p>
        </div>
      </div>
    </div>
  );
}
