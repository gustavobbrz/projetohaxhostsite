import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// Rota temporária para criar usuário de teste
export async function GET() {
  try {
    // Verifica se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: "billy@haxhost.com" },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "Usuário de teste já existe!",
        user: {
          email: "billy@haxhost.com",
          password: "senha123",
        },
      });
    }

    // Cria o usuário de teste
    const hashedPassword = await bcrypt.hash("senha123", 10);

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: "billy@haxhost.com",
        name: "Billy",
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Cria um servidor de exemplo
    const server = await prisma.server.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        name: "⚫️🟣 FUTSAL DO DD 24HRS 🟣⚫️",
        status: "active",
        subscriptionStatus: "active",
        planType: "premium",
        maxPlayers: 20,
        isPublic: true,
        roomLink: "https://www.haxball.com/play?c=example",
        pm2ProcessName: "haxball-dd",
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    });

    // Adiciona alguns dados de exemplo
    await prisma.chatMessage.createMany({
      data: [
        {
          serverId: server.id,
          playerName: "Billy",
          message: "Bem-vindo à sala! 🎮",
          source: "game",
        },
        {
          serverId: server.id,
          playerName: "Jogador1",
          message: "Obrigado! Como faço pra jogar?",
          source: "game",
        },
        {
          serverId: server.id,
          playerName: "Admin",
          message: "Digite !help para ver os comandos",
          source: "discord",
        },
      ],
    });

    await prisma.replay.create({
      data: {
        serverId: server.id,
        fileName: "partida_exemplo.hbr2",
        scoreRed: 5,
        scoreBlue: 3,
        duration: 600,
        players: JSON.stringify(["Billy", "Jogador1", "Jogador2", "Jogador3"]),
        possession: JSON.stringify({ red: 55, blue: 45 }),
      },
    });

    await prisma.playerEntry.createMany({
      data: [
        {
          serverId: server.id,
          playerName: "Billy",
          playerAuth: "AUTH123",
          playerConn: "CONN456",
          action: "joined",
        },
        {
          serverId: server.id,
          playerName: "Jogador1",
          playerAuth: "AUTH124",
          playerConn: "CONN457",
          action: "joined",
        },
      ],
    });

    await prisma.adminLog.create({
      data: {
        serverId: server.id,
        adminName: "Billy",
        adminAuth: "AUTH123",
        action: "login",
      },
    });

    await prisma.report.create({
      data: {
        serverId: server.id,
        reporterName: "Jogador1",
        reporterAuth: "AUTH124",
        reportedName: "TrollerXD",
        reportedAuth: "AUTH999",
        reason: "Jogador está trollando",
        status: "pending",
      },
    });

    await prisma.ban.create({
      data: {
        serverId: server.id,
        playerName: "HackerPro",
        playerAuth: "AUTH777",
        playerIp: "192.168.1.100",
        reason: "Uso de cheats",
        bannedBy: "Billy",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Usuário de teste criado com sucesso!",
      user: {
        email: "billy@haxhost.com",
        password: "senha123",
        name: "Billy",
      },
      server: {
        name: server.name,
        status: server.status,
      },
    });
  } catch (error: any) {
    console.error("Erro ao criar usuário de teste:", error);
    return NextResponse.json(
      {
        error: "Erro ao criar usuário de teste",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
