import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Cria usuário de teste
  const hashedPassword = await bcrypt.hash("senha123", 10);
  
  const user = await prisma.user.upsert({
    where: { email: "billy@haxhost.com" },
    update: {},
    create: {
      email: "billy@haxhost.com",
      name: "Billy",
      password: hashedPassword,
    },
  });

  console.log("✅ Usuário criado:", user.email);

  // Cria servidor de exemplo
  const server = await prisma.server.upsert({
    where: { id: "test-server-1" },
    update: {},
    create: {
      id: "test-server-1",
      userId: user.id,
      name: "⚫️🟣 FUTSAL DO DD 24HRS 🟣⚫️",
      status: "active",
      subscriptionStatus: "active",
      planType: "premium",
      maxPlayers: 20,
      isPublic: true,
      roomLink: "https://www.haxball.com/play?c=abcdef123",
      pm2ProcessName: "haxball-dd",
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
    },
  });

  console.log("✅ Servidor criado:", server.name);

  // Cria canais Discord
  const channels = [
    { channelType: "chat-global", channelId: "1234567890" },
    { channelType: "replay", channelId: "1234567891" },
    { channelType: "ranking", channelId: "1234567892" },
    { channelType: "atualizacoes", channelId: "1234567893" },
    { channelType: "adm", channelId: "1234567894" },
    { channelType: "entrada", channelId: "1234567895" },
    { channelType: "denuncias", channelId: "1234567896" },
    { channelType: "clear-bans", channelId: "1234567897" },
  ];

  for (const channel of channels) {
    await prisma.discordChannel.upsert({
      where: {
        serverId_channelType: {
          serverId: server.id,
          channelType: channel.channelType,
        },
      },
      update: {},
      create: {
        serverId: server.id,
        channelType: channel.channelType,
        channelId: channel.channelId,
        isActive: true,
      },
    });
  }

  console.log("✅ Canais Discord criados");

  // Adiciona mensagens de chat
  const messages = [
    { playerName: "Billy", message: "Bem-vindo à sala! 🎮", source: "game" },
    { playerName: "Jogador1", message: "Obrigado! Como faço pra jogar?", source: "game" },
    { playerName: "Admin", message: "Digite !help para ver os comandos", source: "discord" },
    { playerName: "Jogador2", message: "Alguém quer jogar 2v2?", source: "game" },
    { playerName: "Jogador3", message: "Bora! 🔥", source: "game" },
  ];

  for (const msg of messages) {
    await prisma.chatMessage.create({
      data: {
        serverId: server.id,
        playerName: msg.playerName,
        message: msg.message,
        source: msg.source,
      },
    });
  }

  console.log("✅ Mensagens de chat criadas");

  // Adiciona replays
  const replays = [
    {
      fileName: "partida_2024_11_01_20_30.hbr2",
      scoreRed: 3,
      scoreBlue: 2,
      duration: 480, // 8 minutos
      players: JSON.stringify(["Billy", "Jogador1", "Jogador2", "Jogador3"]),
      possession: JSON.stringify({ red: 55, blue: 45 }),
      fileUrl: "/replays/partida_2024_11_01_20_30.hbr2",
    },
    {
      fileName: "partida_2024_11_01_21_00.hbr2",
      scoreRed: 5,
      scoreBlue: 4,
      duration: 600, // 10 minutos
      players: JSON.stringify(["Billy", "Admin", "Jogador4", "Jogador5"]),
      possession: JSON.stringify({ red: 52, blue: 48 }),
      fileUrl: "/replays/partida_2024_11_01_21_00.hbr2",
    },
  ];

  for (const replay of replays) {
    await prisma.replay.create({
      data: {
        serverId: server.id,
        ...replay,
      },
    });
  }

  console.log("✅ Replays criados");

  // Adiciona entradas de jogadores
  const entries = [
    { playerName: "Billy", playerAuth: "AUTH123", playerConn: "CONN456", playerIp: "192.168.1.1", action: "joined" },
    { playerName: "Jogador1", playerAuth: "AUTH124", playerConn: "CONN457", playerIp: "192.168.1.2", action: "joined" },
    { playerName: "Jogador2", playerAuth: "AUTH125", playerConn: "CONN458", playerIp: "192.168.1.3", action: "joined" },
    { playerName: "Jogador1", playerAuth: "AUTH124", playerConn: "CONN457", playerIp: "192.168.1.2", action: "left" },
  ];

  for (const entry of entries) {
    await prisma.playerEntry.create({
      data: {
        serverId: server.id,
        ...entry,
      },
    });
  }

  console.log("✅ Entradas de jogadores criadas");

  // Adiciona logs de admin
  const adminLogs = [
    {
      adminName: "Billy",
      adminAuth: "AUTH123",
      action: "login",
      targetPlayer: null,
      reason: null,
    },
    {
      adminName: "Billy",
      adminAuth: "AUTH123",
      action: "kick",
      targetPlayer: "TrollerXD",
      reason: "Comportamento inadequado",
    },
    {
      adminName: "Billy",
      adminAuth: "AUTH123",
      action: "ban",
      targetPlayer: "HackerPro",
      reason: "Uso de cheats",
    },
  ];

  for (const log of adminLogs) {
    await prisma.adminLog.create({
      data: {
        serverId: server.id,
        ...log,
      },
    });
  }

  console.log("✅ Logs de admin criados");

  // Adiciona denúncias
  const reports = [
    {
      reporterName: "Jogador1",
      reporterAuth: "AUTH124",
      reportedName: "TrollerXD",
      reportedAuth: "AUTH999",
      reason: "Jogador está trollando e atrapalhando o time propositalmente",
      status: "pending",
    },
    {
      reporterName: "Jogador2",
      reporterAuth: "AUTH125",
      reportedName: "SpammerBot",
      reportedAuth: "AUTH888",
      reason: "Spam no chat",
      status: "resolved",
    },
  ];

  for (const report of reports) {
    await prisma.report.create({
      data: {
        serverId: server.id,
        ...report,
      },
    });
  }

  console.log("✅ Denúncias criadas");

  // Adiciona bans
  const bans = [
    {
      playerName: "HackerPro",
      playerAuth: "AUTH777",
      playerIp: "192.168.1.100",
      reason: "Uso de cheats detectado",
      bannedBy: "Billy",
      isActive: true,
      expiresAt: null, // Ban permanente
    },
    {
      playerName: "RageQuit",
      playerAuth: "AUTH666",
      playerIp: "192.168.1.101",
      reason: "Abandonou 3 partidas seguidas",
      bannedBy: "Admin",
      isActive: false, // Já foi removido
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expirou ontem
    },
  ];

  for (const ban of bans) {
    await prisma.ban.create({
      data: {
        serverId: server.id,
        ...ban,
      },
    });
  }

  console.log("✅ Bans criados");

  console.log("\n🎉 Seed completo! Você pode fazer login com:");
  console.log("   Email: billy@haxhost.com");
  console.log("   Senha: senha123");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

