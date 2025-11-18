import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * POST /api/servers/[serverId]/bans/clear
 * 
 * Limpa todos os bans do servidor (equivalente ao comando !limpar)
 * 
 * Este endpoint apenas marca os bans como inativos no banco de dados.
 * O comando real de clear bans deve ser executado no script Haxball.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  try {
    // 1. Verifica autenticação
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Busca o servidor
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    // 3. Verifica permissão
    if (server.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para moderar este servidor" },
        { status: 403 }
      );
    }

    // 4. Marca todos os bans como inativos
    const result = await prisma.ban.updateMany({
      where: {
        serverId: serverId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // 5. Registra a ação no log
    await prisma.adminLog.create({
      data: {
        id: crypto.randomUUID(),
        serverId: server.id,
        action: "CLEAR_ALL_BANS",
        adminName: session.user.name || session.user.email || "Admin",
        reason: `Todos os bans foram removidos (${result.count} bans)`,
      },
    });

    console.log(
      `[BANS] ${session.user.name} limpou ${result.count} bans do servidor ${server.name}`
    );

    return NextResponse.json({
      success: true,
      message: `${result.count} ban(s) removido(s) com sucesso`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("[BANS] Erro ao limpar bans:", error);
    return NextResponse.json(
      {
        error: "Erro ao limpar bans",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

