import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Webhook para receber eventos do jogo Haxball
export async function POST(request: NextRequest) {
  try {
    // Verificar secret key
    const authHeader = request.headers.get("authorization");
    const secretKey =
      process.env.HAXBALL_WEBHOOK_SECRET || "haxhost-secret-2024";

    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, serverId, pm2ProcessName, data } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: "eventType é obrigatório" },
        { status: 400 }
      );
    }

    // Para ROOM_OPEN, serverId é opcional (pode usar pm2ProcessName)
    let server = null;
    let finalServerId = serverId;

    if (serverId) {
      server = await prisma.server.findUnique({
        where: { id: serverId },
      });
    } else if (pm2ProcessName) {
      server = await prisma.server.findFirst({
        where: { pm2ProcessName },
      });
      if (server) {
        finalServerId = server.id;
      }
    }

    // Para eventos que não sejam ROOM_OPEN, servidor é obrigatório
    if (eventType !== "ROOM_OPEN" && !server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    // Usar serverId do servidor encontrado
    const targetServerId = finalServerId || serverId;

    // Processar evento baseado no tipo
    switch (eventType) {
      case "ROOM_OPEN":
        await handleRoomOpen(targetServerId, pm2ProcessName, data);
        break;

      case "chat_message":
        await handleChatMessage(targetServerId, data);
        break;

      case "player_joined":
        await handlePlayerEntry(targetServerId, data, "joined");
        break;

      case "player_left":
        await handlePlayerEntry(targetServerId, data, "left");
        break;

      case "admin_action":
        await handleAdminAction(targetServerId, data);
        break;

      case "report":
        await handleReport(targetServerId, data);
        break;

      case "ban":
        await handleBan(targetServerId, data);
        break;

      case "replay":
        await handleReplay(targetServerId, data);
        break;

      default:
        return NextResponse.json(
          { error: `Tipo de evento desconhecido: ${eventType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Evento processado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao processar evento:", error);
    return NextResponse.json(
      { error: "Erro ao processar evento", details: error.message },
      { status: 500 }
    );
  }
}

// Handlers para cada tipo de evento

async function handleRoomOpen(
  serverId: string | null,
  pm2ProcessName: string | undefined,
  data: any
) {
  const { roomLink } = data;

  if (!roomLink) {
    console.warn("[ROOM_OPEN] roomLink não fornecido");
    return;
  }

  console.log(`[ROOM_OPEN] Atualizando roomLink: ${roomLink}`);

  // Atualizar por serverId (preferencial)
  if (serverId) {
    await prisma.server.update({
      where: { id: serverId },
      data: {
        roomLink,
        status: "active",
        updatedAt: new Date(),
      },
    });
    console.log(`[ROOM_OPEN] Server ${serverId} atualizado com roomLink`);
  }
  // Fallback: atualizar por pm2ProcessName
  else if (pm2ProcessName) {
    const updated = await prisma.server.updateMany({
      where: { pm2ProcessName },
      data: {
        roomLink,
        status: "active",
        updatedAt: new Date(),
      },
    });
    console.log(
      `[ROOM_OPEN] ${updated.count} servidor(es) atualizado(s) via pm2ProcessName: ${pm2ProcessName}`
    );
  }
}

async function handleChatMessage(serverId: string, data: any) {
  const { playerName, playerAuth, message, source = "game" } = data;

  await prisma.chatMessage.create({
    data: {
      id: crypto.randomUUID(),
      serverId,
      playerName,
      playerAuth,
      message,
      source,
    },
  });

  // Limpar mensagens antigas (manter apenas últimas 1000)
  const oldMessages = await prisma.chatMessage.findMany({
    where: { serverId },
    orderBy: { createdAt: "desc" },
    skip: 1000,
    select: { id: true },
  });

  if (oldMessages.length > 0) {
    await prisma.chatMessage.deleteMany({
      where: {
        id: { in: oldMessages.map((m) => m.id) },
      },
    });
  }
}

async function handlePlayerEntry(serverId: string, data: any, action: string) {
  const { playerName, playerAuth, playerConn, playerIp } = data;

  await prisma.playerEntry.create({
    data: {
      id: crypto.randomUUID(),
      serverId,
      playerName,
      playerAuth,
      playerConn,
      playerIp,
      action,
    },
  });

  // Limpar entradas antigas (manter apenas últimas 500)
  const oldEntries = await prisma.playerEntry.findMany({
    where: { serverId },
    orderBy: { createdAt: "desc" },
    skip: 500,
    select: { id: true },
  });

  if (oldEntries.length > 0) {
    await prisma.playerEntry.deleteMany({
      where: {
        id: { in: oldEntries.map((e) => e.id) },
      },
    });
  }
}

async function handleAdminAction(serverId: string, data: any) {
  const { adminName, adminAuth, action, targetPlayer, reason } = data;

  await prisma.adminLog.create({
    data: {
      id: crypto.randomUUID(),
      serverId,
      adminName,
      adminAuth,
      action,
      targetPlayer,
      reason,
    },
  });
}

async function handleReport(serverId: string, data: any) {
  const { reporterName, reporterAuth, reportedName, reportedAuth, reason } =
    data;

  await prisma.report.create({
    data: {
      id: crypto.randomUUID(),
      serverId,
      reporterName,
      reporterAuth,
      reportedName,
      reportedAuth,
      reason,
      status: "pending",
    },
  });
}

async function handleBan(serverId: string, data: any) {
  const { playerName, playerAuth, playerIp, reason, bannedBy, duration } = data;

  const expiresAt = duration ? new Date(Date.now() + duration * 1000) : null;

  await prisma.ban.create({
    data: {
      id: crypto.randomUUID(),
      serverId,
      playerName,
      playerAuth,
      playerIp,
      reason,
      bannedBy,
      isActive: true,
      expiresAt,
    },
  });
}

async function handleReplay(serverId: string, data: any) {
  const {
    fileName,
    fileUrl,
    scoreRed,
    scoreBlue,
    duration,
    players,
    possession,
  } = data;

  await prisma.replay.create({
    data: {
      id: crypto.randomUUID(),
      serverId,
      fileName,
      fileUrl,
      scoreRed: scoreRed || 0,
      scoreBlue: scoreBlue || 0,
      duration: duration || 0,
      players: JSON.stringify(players || []),
      possession: possession ? JSON.stringify(possession) : null,
    },
  });

  // Limitar a 100 replays por servidor
  const oldReplays = await prisma.replay.findMany({
    where: { serverId },
    orderBy: { createdAt: "desc" },
    skip: 100,
    select: { id: true },
  });

  if (oldReplays.length > 0) {
    await prisma.replay.deleteMany({
      where: {
        id: { in: oldReplays.map((r) => r.id) },
      },
    });
  }
}
