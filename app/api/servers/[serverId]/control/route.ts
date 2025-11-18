import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { createSSHClient } from "@/lib/ssh/client";
import { getHostForServer } from "@/lib/hosts";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * POST /api/servers/[serverId]/control
 * 
 * Controla o servidor Haxball (start, stop, restart) via PM2 remoto (SSH)
 * 
 * Body: { action: "start" | "stop" | "restart" }
 * 
 * ATUALIZADO: Agora usa SSH para conectar na EC2 correta automaticamente
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

    // 2. Busca o servidor no banco
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { User: true },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    // 3. Verifica se o usuário é dono do servidor
    if (server.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para controlar este servidor" },
        { status: 403 }
      );
    }

    // 4. Valida a ação
    const body = await request.json();
    const { action, dryRun } = body;

    if (!action || !["start", "stop", "restart"].includes(action)) {
      return NextResponse.json(
        {
          error:
            'Ação inválida. Use: "start", "stop" ou "restart"',
        },
        { status: 400 }
      );
    }

    // Modo DRY_RUN: apenas retorna o comando sem executar
    const isDryRun = dryRun === true || process.env.NODE_ENV === "test";

    // 5. Buscar host do servidor
    if (!server.hostName) {
      return NextResponse.json(
        { error: "Servidor não tem host atribuído" },
        { status: 500 }
      );
    }

    const host = await getHostForServer(server.id);

    if (!host) {
      return NextResponse.json(
        { error: `Host "${server.hostName}" não encontrado` },
        { status: 500 }
      );
    }

    // 6. Validar PM2 process name
    const pm2ProcessName = server.pm2ProcessName;

    if (!pm2ProcessName) {
      return NextResponse.json(
        { error: "Servidor não tem processo PM2 configurado" },
        { status: 500 }
      );
    }

    // 7. Modo DRY_RUN: Retorna comando sem executar
    if (isDryRun) {
      let dryRunCommand: string;
      
      switch (action) {
        case "start":
          dryRunCommand = `ssh -i ~/.ssh/key.pem ${host.ssh_user}@${host.ip} "cd ${host.base_path} && pm2 start index.js --name ${pm2ProcessName}"`;
          break;
        case "stop":
          dryRunCommand = `ssh -i ~/.ssh/key.pem ${host.ssh_user}@${host.ip} "pm2 stop ${pm2ProcessName}"`;
          break;
        case "restart":
          dryRunCommand = `ssh -i ~/.ssh/key.pem ${host.ssh_user}@${host.ip} "pm2 restart ${pm2ProcessName} --update-env"`;
          break;
        default:
          dryRunCommand = "Ação inválida";
      }

      return NextResponse.json({
        success: true,
        dryRun: true,
        message: `[DRY RUN] Comando que seria executado:`,
        command: dryRunCommand,
        host: host.name,
        pm2ProcessName,
      });
    }

    // 8. Conectar via SSH (modo real)
    console.log(`[CONTROL] Conectando em ${host.name} (${host.ip})`);
    const sshClient = await createSSHClient(undefined, host.name);

    try {
      let message: string;
      let stdout: string;

      // Executar comando PM2 via SSH
      switch (action) {
        case "start":
          stdout = await sshClient.pm2Start(pm2ProcessName, "index.js");
          message = `Servidor ${server.name} iniciado com sucesso`;
          break;
        case "stop":
          stdout = await sshClient.pm2Stop(pm2ProcessName);
          message = `Servidor ${server.name} parado com sucesso`;
          break;
        case "restart":
          stdout = await sshClient.pm2Restart(pm2ProcessName, true);
          message = `Servidor ${server.name} reiniciado com sucesso`;
          break;
        default:
          throw new Error("Ação inválida");
      }

      console.log(`[CONTROL] Saída do PM2:\n${stdout}`);

      // 6. Registra a ação no banco (AdminLog)
      await prisma.adminLog.create({
        data: {
        id: crypto.randomUUID(),
          serverId: server.id,
          action: `SERVER_${action.toUpperCase()}`,
          adminName: session.user.name || session.user.email || "Admin",
          reason: `Controle via dashboard: ${action}`,
        },
      });

      // 7. Atualiza o timestamp do servidor
      await prisma.server.update({
        where: { id: server.id },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: message,
        action: action,
        host: host.name,
        timestamp: new Date().toISOString(),
      });
    } catch (pm2Error: any) {
      console.error(`[CONTROL] Erro ao executar PM2:`, pm2Error);

      // Trata erros específicos do PM2
      if (pm2Error.message.includes("process name not found")) {
        return NextResponse.json(
          {
            error: `Processo PM2 "${pm2ProcessName}" não encontrado`,
            reason:
              "Verifique se o nome do processo está correto no banco de dados",
          },
          { status: 404 }
        );
      }

      if (pm2Error.message.includes("already running")) {
        return NextResponse.json(
          {
            error: "O servidor já está rodando",
            reason: "Use 'restart' para reiniciar o servidor",
          },
          { status: 409 }
        );
      }

      if (pm2Error.message.includes("not running")) {
        return NextResponse.json(
          {
            error: "O servidor não está rodando",
            reason: "Use 'start' para iniciar o servidor",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: "Erro ao controlar o servidor",
          reason: pm2Error.message,
        },
        { status: 500 }
      );
    } finally {
      // Desconectar SSH
      sshClient.disconnect();
    }
  } catch (error: any) {
    console.error("[CONTROL] Erro fatal:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        reason: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

