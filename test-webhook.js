/**
 * Script de Teste do Webhook
 *
 * Este script envia eventos de teste para o webhook do site,
 * simulando o que o script Haxball vai enviar.
 *
 * Uso: node test-webhook.js
 */

const fetch = require("node-fetch");

const WEBHOOK_URL = "http://localhost:3000/api/webhook/game-event";
const SECRET_KEY = "haxhost-secret-2024";

// Buscar o ID do servidor primeiro
async function getServerId() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/servers/find-by-pm2?name=haxball-server",
      {
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar servidor: ${response.status}`);
    }

    const data = await response.json();
    return data.serverId;
  } catch (error) {
    console.error("❌ Erro ao buscar ID do servidor:", error.message);
    console.log("⚠️  Usando ID de fallback...");
    return "srv-azzurashin-" + Date.now(); // Fallback
  }
}

async function sendEvent(eventType, data, serverId) {
  try {
    console.log(`\n📤 Enviando evento: ${eventType}`);

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify({
        eventType,
        serverId,
        data,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ ${eventType} enviado com sucesso!`);
    } else {
      console.log(`❌ Erro: ${result.error}`);
    }

    return response.ok;
  } catch (error) {
    console.error(`❌ Erro ao enviar ${eventType}:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log("🧪 Iniciando testes do webhook...\n");
  console.log("🔗 URL:", WEBHOOK_URL);
  console.log("🔑 Secret:", SECRET_KEY);

  // 1. Buscar ID do servidor
  console.log("\n📍 Buscando ID do servidor...");
  const serverId = await getServerId();
  console.log(`✅ Server ID: ${serverId}`);

  // Aguardar 1 segundo entre cada teste
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 2. Teste: Mensagem de Chat
  await sendEvent(
    "chat_message",
    {
      playerName: "Billy",
      playerAuth: "AUTH123",
      message: "Teste de mensagem do webhook! 🎮",
      source: "game",
    },
    serverId
  );
  await wait(1000);

  // 3. Teste: Mensagem do Discord
  await sendEvent(
    "chat_message",
    {
      playerName: "Admin (Discord)",
      message: "Mensagem vinda do Discord!",
      source: "discord",
    },
    serverId
  );
  await wait(1000);

  // 4. Teste: Jogador Entrou
  await sendEvent(
    "player_joined",
    {
      playerName: "Jogador Teste",
      playerAuth: "AUTH456",
      playerConn: "CONN789",
      playerIp: "192.168.1.100",
    },
    serverId
  );
  await wait(1000);

  // 5. Teste: Ação de Admin
  await sendEvent(
    "admin_action",
    {
      adminName: "Billy",
      adminAuth: "AUTH123",
      action: "kick",
      targetPlayer: "Troller",
      reason: "Comportamento inadequado",
    },
    serverId
  );
  await wait(1000);

  // 6. Teste: Denúncia
  await sendEvent(
    "report",
    {
      reporterName: "Jogador Bom",
      reporterAuth: "AUTH111",
      reportedName: "Jogador Ruim",
      reportedAuth: "AUTH222",
      reason: "Está trollando e atrapalhando o time",
    },
    serverId
  );
  await wait(1000);

  // 7. Teste: Ban
  await sendEvent(
    "ban",
    {
      playerName: "Hacker",
      playerAuth: "AUTH999",
      playerIp: "192.168.1.200",
      reason: "Uso de cheats",
      bannedBy: "Billy",
      duration: null, // Permanente
    },
    serverId
  );
  await wait(1000);

  // 8. Teste: Replay
  await sendEvent(
    "replay",
    {
      fileName: "azzurashin_teste_replay.hbr2",
      fileUrl: null,
      scoreRed: 5,
      scoreBlue: 3,
      duration: 600, // 10 minutos
      players: ["Billy", "Jogador1", "Jogador2", "Jogador3"],
      possession: { red: 58, blue: 42 },
    },
    serverId
  );
  await wait(1000);

  // 9. Teste: Jogador Saiu
  await sendEvent(
    "player_left",
    {
      playerName: "Jogador Teste",
      playerAuth: "AUTH456",
      playerConn: "CONN789",
    },
    serverId
  );

  console.log("\n✅ Todos os testes concluídos!");
  console.log("\n👉 Acesse o dashboard para ver os resultados:");
  console.log("   http://localhost:3000/dashboard");
  console.log("\n📊 Verifique as abas:");
  console.log("   - 💬 Chat: Deve ter 2 mensagens");
  console.log("   - 👥 Jogadores: Deve ter entrada e saída");
  console.log("   - 🎬 Replays: Deve ter 1 replay");
  console.log("   - 🚨 Denúncias: Deve ter 1 denúncia");
}

// Executar testes
runTests().catch(console.error);
