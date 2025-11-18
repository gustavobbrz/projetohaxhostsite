import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/servers/[serverId]/reports - Busca denúncias
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

    // Busca as denúncias
    const reports = await prisma.report.findMany({
      where: {
        serverId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Erro ao buscar denúncias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar denúncias" },
      { status: 500 }
    );
  }
}

// PATCH /api/servers/[serverId]/reports - Atualiza status de denúncia
export async function PATCH(
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
    const { reportId, status } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { error: "Dados inválidos" },
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

    // Atualiza o status
    const report = await prisma.report.update({
      where: {
        id: reportId,
        serverId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Erro ao atualizar denúncia:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar denúncia" },
      { status: 500 }
    );
  }
}

