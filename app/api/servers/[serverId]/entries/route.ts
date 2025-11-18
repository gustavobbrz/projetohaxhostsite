import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/servers/[serverId]/entries - Busca entradas/saídas
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

    // Busca as últimas 100 entradas
    const entries = await prisma.playerEntry.findMany({
      where: {
        serverId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      entries,
    });
  } catch (error) {
    console.error("Erro ao buscar entradas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar entradas" },
      { status: 500 }
    );
  }
}

