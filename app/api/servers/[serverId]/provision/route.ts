import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { provisionServer } from "@/lib/provisioning/server-provisioner";

const prisma = new PrismaClient();

/**
 * POST /api/servers/[serverId]/provision
 * 
 * Provisiona um servidor Haxball em uma EC2
 * - Gera script personalizado
 * - Conecta via SSH na EC2 correta
 * - Envia script via SCP
 * - Inicia via PM2
 */
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

    // Buscar servidor
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

    // Verificar se tem hostName atribuído
    if (!server.hostName) {
      return NextResponse.json(
        { error: "Servidor não tem EC2 atribuída. Salve as configurações primeiro." },
        { status: 400 }
      );
    }

    // Verificar se tem pm2ProcessName
    if (!server.pm2ProcessName) {
      return NextResponse.json(
        { error: "Servidor não tem pm2ProcessName. Salve as configurações primeiro." },
        { status: 400 }
      );
    }

    console.log(`[PROVISION] Iniciando provisionamento do servidor ${server.name} (${serverId})`);
    console.log(`[PROVISION] Host: ${server.hostName}`);
    console.log(`[PROVISION] PM2 Process: ${server.pm2ProcessName}`);

    // Token opcional do body (se o usuário mudou)
    const body = await request.json().catch(() => ({}));
    const newToken = body.token;

    // Provisionar (essa função está em lib/provisioning/server-provisioner.ts)
    const result = await provisionServer({
      serverId: serverId,
      token: newToken,
      forceRestart: false,
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: "Erro ao provisionar servidor",
          details: result.error,
        },
        { status: 500 }
      );
    }

    // Atualizar status no banco
    await prisma.server.update({
      where: { id: serverId },
      data: {
        status: "running",
        lastProvisionedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`[PROVISION] ✅ Servidor ${server.name} provisionado com sucesso!`);

    return NextResponse.json({
      success: true,
      message: "Servidor provisionado com sucesso",
      server: {
        id: server.id,
        name: server.name,
        hostName: server.hostName,
        pm2ProcessName: server.pm2ProcessName,
        status: "running",
      },
      details: result.details,
    });

  } catch (error: any) {
    console.error("[PROVISION] Erro:", error);
    
    // Tentar atualizar status para error
    try {
      await prisma.server.update({
        where: { id: serverId },
        data: {
          status: "error",
          updatedAt: new Date(),
        },
      });
    } catch (updateError) {
      console.error("[PROVISION] Erro ao atualizar status:", updateError);
    }

    return NextResponse.json(
      { 
        error: "Erro ao provisionar servidor",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

