/**
 * Template do Script Haxball para Provisionamento Automático
 * 
 * Este script será gerado dinamicamente pelo backend e enviado para a EC2
 * Baseado em azzurashin-integrado.js mas configurável via ENV
 */

const HaxballJS = require("haxball.js");
const fetch = require("node-fetch");

// ===============================================================
// CONFIGURAÇÃO VIA ENV (injetada pelo PM2 ecosystem.config.js)
// ===============================================================
const TOKEN = process.env.TOKEN || "";
const ROOM_NAME = process.env.ROOM_NAME || "HaxHost Server";
const MAP = process.env.MAP || "Big";
const MAX_PLAYERS = parseInt(process.env.MAX_PLAYERS || "20");
const PASSWORD = process.env.PASSWORD || null;
const IS_PUBLIC = process.env.IS_PUBLIC === "true";
const ADMINS_JSON = process.env.ADMINS_JSON || "[]";
const HAXHOST_API_URL = process.env.HAXHOST_API_URL || "http://localhost:3000";
const HAXHOST_WEBHOOK_SECRET = process.env.HAXHOST_WEBHOOK_SECRET || "";
const PM2_PROCESS_NAME = process.env.PM2_PROCESS_NAME || "haxball-server";
const SERVER_ID = process.env.SERVER_ID || "";

// Parse admins
let ADMIN_HASHES = [];
try {
  ADMIN_HASHES = JSON.parse(ADMINS_JSON);
} catch (e) {
  console.error("[CONFIG] Erro ao parsear ADMINS_JSON:", e);
}

console.log("═══════════════════════════════════════════════════");
console.log("🚀 HAXHOST SERVER STARTING");
console.log(`📡 Server ID: ${SERVER_ID}`);
console.log(`📦 PM2 Process: ${PM2_PROCESS_NAME}`);
console.log(`🏠 Room Name: ${ROOM_NAME}`);
console.log(`🗺️  Map: ${MAP}`);
console.log(`👥 Max Players: ${MAX_PLAYERS}`);
console.log(`🔒 Password: ${PASSWORD ? "***" : "None"}`);
console.log(`🌐 Public: ${IS_PUBLIC}`);
console.log(`👑 Admins configured: ${ADMIN_HASHES.length}`);
console.log(`📡 API: ${HAXHOST_API_URL}`);
console.log("═══════════════════════════════════════════════════");

// ===============================================================
// FUNÇÃO DE ENVIO DE EVENTOS PARA HAXHOST
// ===============================================================
async function sendEventToHaxHost(eventType, data) {
  try {
    const payload = {
      pm2ProcessName: PM2_PROCESS_NAME,
      eventType: eventType,
      data: data,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(`${HAXHOST_API_URL}/api/webhook/game-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": HAXHOST_WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[HAXHOST] ❌ Erro ao enviar evento ${eventType}:`,
        response.status,
        errorText
      );
    } else {
      console.log(`[HAXHOST] ✅ Evento ${eventType} enviado!`);
    }
  } catch (error) {
    console.error(
      `[HAXHOST] ❌ Erro fatal ao enviar evento ${eventType}:`,
      error.message
    );
  }
}

// ===============================================================
// INICIALIZAÇÃO DO HAXBALL
// ===============================================================
HaxballJS()
  .then((HBInit) => {
    const room = HBInit({
      roomName: ROOM_NAME,
      maxPlayers: MAX_PLAYERS,
      public: IS_PUBLIC,
      password: PASSWORD,
      geo: { code: "BR", lat: -23.5505, lon: -46.6333 },
      token: TOKEN,
      noPlayer: true,
    });

    const Team = { SPECTATORS: 0, RED: 1, BLUE: 2 };

    let currentRoomLink = null;
    let playerStats = new Map();
    let gameActive = false;

    // ===============================================================
    // HANDLERS DO HAXBALL
    // ===============================================================

    room.onRoomLink = function (link) {
      console.log(`✅ Sala criada com sucesso! Link: ${link}`);
      currentRoomLink = link;
      room.setDefaultStadium(MAP);
      room.setTimeLimit(3);
      room.setScoreLimit(3);
    };

    room.onPlayerJoin = function (player) {
      console.log(`➡️  ${player.name} entrou (ID: ${player.id})`);

      // Primeiro jogador vira admin
      if (room.getPlayerList().filter((p) => p.id !== 0).length === 1) {
        room.setPlayerAdmin(player.id, true);
      }

      room.sendAnnouncement(
        `👋 Bem-vindo(a) ${player.name}!`,
        player.id,
        0x00ff00,
        "bold",
        1
      );

      // Enviar evento para HaxHost
      sendEventToHaxHost("PLAYER_JOIN", {
        playerName: player.name,
        playerId: player.id,
        conn: player.conn,
        auth: player.auth || "N/A",
      });
    };

    room.onPlayerLeave = function (player) {
      console.log(`⬅️  ${player.name} saiu`);

      sendEventToHaxHost("PLAYER_LEAVE", {
        playerName: player.name,
        playerId: player.id,
      });
    };

    room.onPlayerChat = function (player, message) {
      message = message.trim();
      console.log(`💬 ${player.name}: ${message}`);

      // Comandos
      if (message === "!help" || message === "!ajuda") {
        room.sendAnnouncement(
          "📜 Comandos: !help, !bb (sair), !admin <senha>",
          player.id,
          0xffffff,
          "normal",
          0
        );
        return false;
      }

      if (message === "!bb") {
        room.kickPlayer(player.id, "Saiu a pedido", false);
        return false;
      }

      // Admin login
      if (message.startsWith("!admin ")) {
        const password = message.substring(7).trim();
        
        // Verificar senha (comparar hash)
        // Aqui você pode implementar verificação via API ou bcrypt local
        const adminData = ADMIN_HASHES.find((a) => a.password === password);
        
        if (adminData) {
          room.setPlayerAdmin(player.id, true);
          room.sendAnnouncement(
            `👑 ${player.name} agora é admin!`,
            null,
            0xffd700,
            "bold",
            2
          );

          sendEventToHaxHost("ADMIN_ACTION", {
            action: "ADMIN_LOGIN",
            adminName: player.name,
            adminLevel: adminData.label || "ADMIN",
          });
        } else {
          room.sendAnnouncement(
            "❌ Senha de admin incorreta",
            player.id,
            0xff0000,
            "normal",
            0
          );
        }
        
        return false;
      }

      // Enviar chat para HaxHost (se não for comando)
      if (!message.startsWith("!")) {
        sendEventToHaxHost("CHAT", {
          playerName: player.name,
          playerId: player.id,
          message: message,
          team:
            player.team === Team.RED
              ? "RED"
              : player.team === Team.BLUE
              ? "BLUE"
              : "SPEC",
        });
      }

      return true;
    };

    room.onGameStart = function (byPlayer) {
      console.log("🎮 Jogo iniciado");
      gameActive = true;
      room.startRecording();
    };

    room.onGameStop = function (byPlayer) {
      console.log("🏁 Jogo finalizado");
      gameActive = false;
      
      const scores = room.getScores();
      
      if (scores && scores.time > 0) {
        console.log(`📊 Placar: 🔴 ${scores.red} - ${scores.blue} 🔵`);
        
        // Enviar replay
        try {
          const replayData = room.stopRecording();
          
          if (replayData && replayData.length > 0) {
            const fileName = `Replay-${Date.now()}.hbr2`;
            const replayBase64 = Buffer.from(replayData).toString("base64");
            
            sendEventToHaxHost("REPLAY", {
              fileName: fileName,
              fileData: replayBase64,
              scores: scores,
              redTeam: room.getPlayerList().filter((p) => p.team === Team.RED).map((p) => p.name),
              blueTeam: room.getPlayerList().filter((p) => p.team === Team.BLUE).map((p) => p.name),
              possession: { red: 50, blue: 50 }, // Simplificado
              duration: `${Math.floor(scores.time / 60)}m${(scores.time % 60).toString().padStart(2, "0")}s`,
            });
          }
        } catch (e) {
          console.error("❌ Erro ao enviar replay:", e);
        }
      }
    };

    room.onTeamGoal = function (team) {
      const scores = room.getScores();
      const teamName = team === Team.RED ? "Time Vermelho 🔴" : "Time Azul 🔵";
      
      room.sendAnnouncement(
        `⚽ GOOOOL DO ${teamName}! Placar: 🔴 ${scores.red} - ${scores.blue} 🔵`,
        null,
        0xffff00,
        "bold",
        2
      );
    };

    // Heartbeat: atualizar status a cada 30s
    setInterval(() => {
      const players = room.getPlayerList().filter((p) => p.id !== 0);
      console.log(`💓 Heartbeat: ${players.length}/${MAX_PLAYERS} jogadores`);
    }, 30000);

    console.log("✅ Servidor Haxball inicializado com sucesso!");
  })
  .catch((err) => {
    console.error("❌ Erro fatal ao inicializar HaxballJS:", err);
    process.exit(1);
  });

