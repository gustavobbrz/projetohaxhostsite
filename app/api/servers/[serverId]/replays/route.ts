import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/servers/[serverId]/replays - Busca replays
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

    // Busca os replays
    const replays = await prisma.replay.findMany({
      where: {
        serverId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      replays,
    });
  } catch (error) {
    console.error("Erro ao buscar replays:", error);
    return NextResponse.json(
      { error: "Erro ao buscar replays" },
      { status: 500 }
    );
  }
}

