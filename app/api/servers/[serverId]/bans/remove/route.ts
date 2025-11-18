import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * POST /api/servers/[serverId]/bans/remove
 * 
 * Remove um ban específico (desbane um jogador)
 * 
 * Body: { banId: "uuid" }
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

    // 4. Valida o body
    const body = await request.json();
    const { banId } = body;

    if (!banId) {
      return NextResponse.json(
        { error: "banId é obrigatório" },
        { status: 400 }
      );
    }

    // 5. Busca o ban
    const ban = await prisma.ban.findUnique({
      where: { id: banId },
    });

    if (!ban) {
      return NextResponse.json({ error: "Ban não encontrado" }, { status: 404 });
    }

    if (ban.serverId !== serverId) {
      return NextResponse.json(
        { error: "Este ban não pertence a este servidor" },
        { status: 403 }
      );
    }

    // 6. Marca o ban como inativo
    await prisma.ban.update({
      where: { id: banId },
      data: { isActive: false },
    });

    // 7. Registra a ação no log
    await prisma.adminLog.create({
      data: {
        id: crypto.randomUUID(),
        serverId: server.id,
        action: "UNBAN_PLAYER",
        adminName: session.user.name || session.user.email || "Admin",
        reason: `Desbanido: ${ban.playerName}`,
      },
    });

    console.log(
      `[BANS] ${session.user.name} desbaniu ${ban.playerName} do servidor ${server.name}`
    );

    return NextResponse.json({
      success: true,
      message: `Jogador ${ban.playerName} desbanido com sucesso`,
      ban: {
        id: ban.id,
        playerName: ban.playerName,
      },
    });
  } catch (error: any) {
    console.error("[BANS] Erro ao remover ban:", error);
    return NextResponse.json(
      {
        error: "Erro ao remover ban",
        reason: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

