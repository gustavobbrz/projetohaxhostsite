import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// GET /api/servers/[serverId]/bans - Busca banimentos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verifica se o servidor pertence ao usuário
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        userId: session.user.id,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    // Busca os bans ativos
    const bans = await prisma.ban.findMany({
      where: {
        serverId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      bans,
    });
  } catch (error) {
    console.error("Erro ao buscar bans:", error);
    return NextResponse.json(
      { error: "Erro ao buscar bans" },
      { status: 500 }
    );
  }
}

// DELETE /api/servers/[serverId]/bans - Remove um ban
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { banId } = body;

    if (!banId) {
      return NextResponse.json(
        { error: "ID do ban é obrigatório" },
        { status: 400 }
      );
    }

    // Verifica se o servidor pertence ao usuário
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        userId: session.user.id,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    // Marca o ban como inativo
    const ban = await prisma.ban.update({
      where: {
        id: banId,
        serverId,
      },
      data: {
        isActive: false,
      },
    });

    // TODO: Remover ban do jogo via Discord bot
    // await removeBanFromGame(server, ban);

    return NextResponse.json({
      success: true,
      ban,
    });
  } catch (error) {
    console.error("Erro ao remover ban:", error);
    return NextResponse.json(
      { error: "Erro ao remover ban" },
      { status: 500 }
    );
  }
}

// POST /api/servers/[serverId]/bans - Adiciona um ban
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { playerName, playerAuth, playerIp, reason } = body;

    if (!playerName) {
      return NextResponse.json(
        { error: "Nome do jogador é obrigatório" },
        { status: 400 }
      );
    }

    // Verifica se o servidor pertence ao usuário
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        userId: session.user.id,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    // Cria o ban
    const ban = await prisma.ban.create({
      data: {
        id: crypto.randomUUID(),
        serverId,
        playerName,
        playerAuth: playerAuth || null,
        playerIp: playerIp || null,
        reason: reason || null,
        bannedBy: session.user.name || "Admin",
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // TODO: Aplicar ban no jogo via Discord bot
    // await applyBanInGame(server, ban);

    return NextResponse.json({
      success: true,
      ban,
    });
  } catch (error) {
    console.error("Erro ao criar ban:", error);
    return NextResponse.json(
      { error: "Erro ao criar ban" },
      { status: 500 }
    );
  }
}

