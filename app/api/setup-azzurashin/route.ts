import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// Rota para criar usuário Azzurashin
export async function GET() {
  try {
    // Verifica se o usuário já existe
    let user = await prisma.user.findUnique({
      where: { email: "azzurashin@haxhost.com" },
    });

    if (!user) {
      // Cria o usuário
      const hashedPassword = await bcrypt.hash("azzurashin123", 10);

      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: "azzurashin@haxhost.com",
          name: "Azzurashin HC",
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
    }

    // Verifica se o servidor já existe
    const existingServer = await prisma.server.findFirst({
      where: {
        userId: user.id,
        name: "🔵⚫ FUTSAL DA AZZURASHIN HC 🔵⚫",
      },
    });

    if (existingServer) {
      // Atualiza o servidor existente
      const server = await prisma.server.update({
        where: { id: existingServer.id },
        data: {
          status: "active",
          subscriptionStatus: "active",
          planType: "premium",
          roomLink: "https://www.haxball.com/play?c=azzurashin",
          maxPlayers: 20,
          isPublic: true,
          pm2ProcessName: "haxball-server", // Nome do processo PM2 na sua EC2
          discordServerId: "1342815750641156140", // ID do servidor Discord da Azzurashin
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
        },
      });

      return NextResponse.json({
        success: true,
        message: "Usuário Azzurashin atualizado com sucesso!",
        user: {
          email: "azzurashin@haxhost.com",
          password: "azzurashin123",
          name: "Azzurashin HC",
        },
        server: {
          id: server.id,
          name: server.name,
          status: server.status,
          subscriptionStatus: server.subscriptionStatus,
        },
      });
    }

    // Cria o servidor
    const server = await prisma.server.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        name: "🔵⚫ FUTSAL DA AZZURASHIN HC 🔵⚫",
        status: "active", // ATIVO
        subscriptionStatus: "active", // PLANO ATIVO
        planType: "premium",
        maxPlayers: 20,
        isPublic: true,
        roomLink: "https://www.haxball.com/play?c=azzurashin", // Link da sala (você pode atualizar depois)
        pm2ProcessName: "haxball-server", // Nome do processo PM2 na sua EC2
        discordServerId: "1342815750641156140", // ID do servidor Discord da Azzurashin
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
        updatedAt: new Date(),
      },
    });

    // Cria os canais Discord
    const discordChannels = [
      { channelType: "chat-global", channelId: "1342815751035891722" },
      { channelType: "replay", channelId: "1342815751035891723" },
      { channelType: "ranking", channelId: "1342815751035891724" },
      { channelType: "atualizacoes", channelId: "1342815751509909578" },
      { channelType: "adm", channelId: "1342815751987875910" },
      { channelType: "entrada", channelId: "1342815751987875911" },
      { channelType: "denuncias", channelId: "1342815751987875912" },
      { channelType: "clear-bans", channelId: "1342815751987875913" },
    ];

    for (const channel of discordChannels) {
      await prisma.discordChannel.create({
        data: {
          serverId: server.id,
          channelType: channel.channelType,
          channelId: channel.channelId,
          isActive: true,
        },
      });
    }

    // Adiciona dados de exemplo para demonstração
    await prisma.chatMessage.createMany({
      data: [
        {
          serverId: server.id,
          playerName: "Billy",
          message: "Bem-vindo à sala da Azzurashin HC! 🔵⚫",
          source: "discord",
        },
        {
          serverId: server.id,
          playerName: "Jogador",
          message: "Obrigado! Sala top demais! 🔥",
          source: "game",
        },
        {
          serverId: server.id,
          playerName: "Admin",
          message: "Digite !help para ver os comandos disponíveis",
          source: "discord",
        },
      ],
    });

    await prisma.playerEntry.createMany({
      data: [
        {
          serverId: server.id,
          playerName: "Jogador1",
          playerAuth: "AUTH001",
          playerConn: "CONN001",
          action: "joined",
        },
        {
          serverId: server.id,
          playerName: "Jogador2",
          playerAuth: "AUTH002",
          playerConn: "CONN002",
          action: "joined",
        },
        {
          serverId: server.id,
          playerName: "Jogador3",
          playerAuth: "AUTH003",
          playerConn: "CONN003",
          action: "joined",
        },
      ],
    });

    await prisma.replay.create({
      data: {
        serverId: server.id,
        fileName: "azzurashin_partida_01.hbr2",
        scoreRed: 4,
        scoreBlue: 3,
        duration: 540, // 9 minutos
        players: JSON.stringify([
          "Jogador1",
          "Jogador2",
          "Jogador3",
          "Jogador4",
        ]),
        possession: JSON.stringify({ red: 58, blue: 42 }),
      },
    });

    await prisma.adminLog.create({
      data: {
        serverId: server.id,
        adminName: "Billy",
        adminAuth: "AUTH_BILLY",
        action: "login",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Usuário Azzurashin criado com sucesso!",
      user: {
        email: "azzurashin@haxhost.com",
        password: "azzurashin123",
        name: "Azzurashin HC",
      },
      server: {
        id: server.id,
        name: server.name,
        status: server.status,
        subscriptionStatus: server.subscriptionStatus,
        roomLink: server.roomLink,
      },
      info: {
        discordServerId: "1342815750641156140",
        pm2ProcessName: "haxball-server",
        canaisDiscordCriados: discordChannels.length,
      },
    });
  } catch (error: any) {
    console.error("Erro ao criar usuário Azzurashin:", error);
    return NextResponse.json(
      {
        error: "Erro ao criar usuário",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

