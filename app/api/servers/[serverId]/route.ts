import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { getAvailableHost } from "@/lib/hosts";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * GET /api/servers/[serverId]
 * 
 * Busca um servidor específico
 */
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

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    // Verificar ownership
    if (server.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      server,
    });
  } catch (error: any) {
    console.error("[SERVER GET] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar servidor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/servers/[serverId]
 * 
 * Atualiza configurações do servidor
 */
export async function PUT(
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
    const { name, map, maxPlayers, password, isPublic, discordBotToken } = body;

    // Verificar se servidor existe e pertence ao usuário
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { userId: true, hostName: true, pm2ProcessName: true },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    // Se não tem host atribuído, atribuir agora
    let hostName = server.hostName;
    let pm2ProcessName = server.pm2ProcessName;

    if (!hostName) {
      const availableHost = await getAvailableHost();
      if (!availableHost) {
        return NextResponse.json(
          { error: "Nenhuma EC2 disponível. Todas estão no limite de capacidade." },
          { status: 503 }
        );
      }
      hostName = availableHost.name;
      console.log(`[SERVER PUT] Atribuindo host: ${hostName} ao servidor ${serverId}`);
    }

    // Se não tem pm2ProcessName, gerar agora
    if (!pm2ProcessName) {
      const shortId = serverId.substring(0, 8);
      pm2ProcessName = `haxball-server-${shortId}`;
      console.log(`[SERVER PUT] Gerando pm2ProcessName: ${pm2ProcessName}`);
    }

    // Atualizar servidor
    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: {
        name: name || undefined,
        map: map || undefined,
        maxPlayers: maxPlayers || undefined,
        password: password || undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
        discordBotToken: discordBotToken || undefined,
        hostName: hostName,
        pm2ProcessName: pm2ProcessName,
        updatedAt: new Date(),
      },
    });

    console.log(`[SERVER PUT] Servidor ${serverId} atualizado por ${session.user.email}`);

    return NextResponse.json({
      success: true,
      server: updatedServer,
      message: "Servidor atualizado com sucesso",
    });
  } catch (error: any) {
    console.error("[SERVER PUT] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar servidor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/servers/[serverId]
 * 
 * Deleta um servidor
 */
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

    // Verificar se servidor existe e pertence ao usuário
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { userId: true, name: true },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    // Deletar servidor
    await prisma.server.delete({
      where: { id: serverId },
    });

    console.log(`[SERVER DELETE] Servidor ${server.name} deletado por ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "Servidor deletado com sucesso",
    });
  } catch (error: any) {
    console.error("[SERVER DELETE] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao deletar servidor" },
      { status: 500 }
    );
  }
}

