// ===============================================================
// === SCRIPT FUTSAL DA AZZURASHIN HC - v3.0 (INTEGRADO COM HAXHOST) ===
// ===============================================================
// ---------------------------------------------------------------
// DEPENDÊNCIAS - RODE ESTE COMANDO ANTES DE INICIAR:
// npm install haxball.js node-fetch@2 express form-data buffer
// ---------------------------------------------------------------

const HaxballJS = require("haxball.js");
const fetch = require("node-fetch");
const express = require("express");
const fs = require("fs");
const FormData = require("form-data");
const { Buffer } = require("buffer");
const path = require("path");

// ===============================================================
// CONFIGURAÇÃO GERAL
// ===============================================================
const roomName = "🔵⚫ FUTSAL DA AZZURASHIN HC 🔵⚫";
const maxPlayers = 30;
const roomPublic = true;
const geo = { code: "BR", lat: -23.51634162, lon: -46.6460824 };
const token = "thr1.AAAAAGkBboUlRFJSS8UAzA.ao6am0qC5s4";
const WEBHOOK_PORT = 3000;
const STATS_FILE_PATH = "./futsal_stats.json";

// ===============================================================
// ⚠️ CONFIGURAÇÃO HAXHOST - IMPORTANTE! ⚠️
// ===============================================================
// Quando for aplicar na EC2, altere esta URL para o endereço do seu site:
// Exemplos:
// const HAXHOST_API_URL = "https://haxhost.com.br";  // Produção
// const HAXHOST_API_URL = "http://IP_DA_EC2_NEXTJS:3000";  // Desenvolvimento

const HAXHOST_API_URL = "http://localhost:3000"; // ← ALTERE AQUI!

// Esta chave DEVE ser EXATAMENTE igual à variável HAXBALL_WEBHOOK_SECRET no .env.local
const HAXHOST_WEBHOOK_SECRET = "haxhost-secret-2024"; // ← ALTERE SE NECESSÁRIO!

// Nome do processo no PM2 (DEVE corresponder ao pm2ProcessName no banco de dados)
const PM2_PROCESS_NAME = "haxball-server"; // ← ALTERE SE NECESSÁRIO!

// ===============================================================

// Arquivo de status para monitoramento (usado pelo worker.js)
const STATUS_MONITOR_FILE_PATH = path.join(
  __dirname,
  `status_${PM2_PROCESS_NAME}.json`
);

const ADMIN_SECRET_KEY = "8962926258";

// =================== AVATARES DOS WEBHOOKS DO DISCORD ===================
const AVATAR_URL_CHAT =
  "https://media.discordapp.net/attachments/1374313154099810355/1400601050377097267/1000055589-removebg-preview.png?ex=688d3ae0&is=688be960&hm=5377590134455bd9be60dcae67d680fe0fd80a465677b01b33c0a7445e2ea8f9&=&format=webp&quality=lossless";
const AVATAR_URL_LOGS =
  "https://media.discordapp.net/attachments/1374313154099810355/1400601050377097267/1000055589-removebg-preview.png?ex=688d3ae0&is=688be960&hm=5377590134455bd9be60dcae67d680fe0fd80a465677b01b33c0a7445e2ea8f9&=&format=webp&quality=lossless";
const AVATAR_URL_REPLAY =
  "https://media.discordapp.net/attachments/1374313154099810355/1400601050377097267/1000055589-removebg-preview.png?ex=688d3ae0&is=688be960&hm=5377590134455bd9be60dcae67d680fe0fd80a465677b01b33c0a7445e2ea8f9&=&format=webp&quality=lossless";

// WEBHOOKS DO DISCORD
const denunciaWebhookURL =
  "https://discord.com/api/webhooks/1400982738068045935/5nXz0KKLb0V5ySLt_Az_wDh5i1qK6P1FnjnpirKzpG5BqZv2Q0HzwM4J-G31iM4l-Od_";
const logWebhookURL =
  "https://discord.com/api/webhooks/1354964971984781441/qEVuD-VIi6t5CjXwW3M27VQdqMVdBMni8ncU-ch9PM3izDnwGfaA10rguuMZvu-FYrmt";
const joinWebhookURL =
  "https://discord.com/api/webhooks/1354919498788110449/z8op1r_NHfN2zmkou8MDW2TFADGBgUuZqcH24Wy0KqszeEuUbAnqMst8wOoJ416xd-D8";
const replayWebhookURL =
  "https://discord.com/api/webhooks/1354996357756092557/Fb9W0n1KMo-_n4KrHKBGSQHDg2xdsgZA085kDRODSsOAz99V7HFwjKha1Yq41wHizBxb";
const chatWebhookURL =
  "https://discord.com/api/webhooks/1365152273184985169/Wo_ETJCgNDWxXZrCG-eLnVB0nHVrgn2qeuh14r80iRpgxd425Z3zHlykYHr2h45UHJmb";
const banLogWebhookURL =
  "https://discord.com/api/webhooks/1402107179531632700/6Pt-W74VdIXdvCyI9l5x1ULaCLzg6rNNpHLQABpeURZ7P3KbYZMawK-3tftEPwC77kyS";

const ADMIN_ROLE_ID = "1354583450941784154";
const DONO_ROLE_ID = "1354613511208308776";

// ===============================================================
// 🚀 FUNÇÃO PRINCIPAL: ENVIAR EVENTO PARA HAXHOST
// ===============================================================
/**
 * Envia eventos de jogo para a API do HaxHost
 * Esta função é o coração da integração - ela envia todos os eventos
 * para o site, permitindo que o dashboard mostre dados em tempo real
 */
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
      console.log(`[HAXHOST] ✅ Evento ${eventType} enviado com sucesso!`);
    }
  } catch (error) {
    console.error(
      `[HAXHOST] ❌ Erro fatal ao enviar evento ${eventType}:`,
      error.message
    );
    // Não interrompe a execução - Discord webhooks continuam funcionando
  }
}

// ===============================================================
// FUNÇÕES DE ESTATÍSTICAS
// ===============================================================
const SsEnumForSave = { WI: 1, LS: 2, DR: 3, GL: 5, AS: 6, CS: 8 };
var stats;

function saveStats() {
  if (!stats) return;
  try {
    const statsObject = {};
    for (let [key, value] of stats.entries()) {
      statsObject[key] = {
        wins: value[SsEnumForSave.WI] || 0,
        losses: value[SsEnumForSave.LS] || 0,
        draws: value[SsEnumForSave.DR] || 0,
        goals: value[SsEnumForSave.GL] || 0,
        assists: value[SsEnumForSave.AS] || 0,
        cleanSheets: value[SsEnumForSave.CS] || 0,
        games:
          (value[SsEnumForSave.WI] || 0) +
          (value[SsEnumForSave.LS] || 0) +
          (value[SsEnumForSave.DR] || 0),
      };
    }
    fs.writeFileSync(
      STATS_FILE_PATH,
      JSON.stringify(statsObject, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("[STATS] Erro ao salvar estatísticas:", error);
  }
}

function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE_PATH)) {
      const data = fs.readFileSync(STATS_FILE_PATH, "utf8");
      const statsObject = JSON.parse(data);
      const tempMap = new Map();
      for (let playerName in statsObject) {
        const pStats = statsObject[playerName];
        const statsArray = Array(Object.keys(SsEnumForSave).length + 5).fill(0);
        statsArray[SsEnumForSave.WI] = pStats.wins || 0;
        statsArray[SsEnumForSave.LS] = pStats.losses || 0;
        statsArray[SsEnumForSave.DR] = pStats.draws || 0;
        statsArray[SsEnumForSave.GL] = pStats.goals || 0;
        statsArray[SsEnumForSave.AS] = pStats.assists || 0;
        statsArray[SsEnumForSave.CS] = pStats.cleanSheets || 0;
        tempMap.set(playerName, statsArray);
      }
      stats = tempMap;
      console.log(`[STATS] Estatísticas carregadas com sucesso.`);
    } else {
      console.log("[STATS] Arquivo de estatísticas não encontrado.");
    }
  } catch (error) {
    console.error("[STATS] Erro ao carregar estatísticas:", error);
  }
}

// ===============================================================
// INICIALIZAÇÃO DO SCRIPT
// ===============================================================
HaxballJS()
  .then((HBInit) => {
    const room = HBInit({
      roomName,
      maxPlayers,
      public: roomPublic,
      geo,
      token,
      noPlayer: true,
    });

    const app = express();
    app.use(express.json());

    // Endpoint para receber mensagens do Discord
    app.post("/discord-chat", (req, res) => {
      try {
        const { author, message } = req.body;
        console.log(`[Discord Chat] Recebido de ${author}: ${message}`);
        if (!author || !message) {
          return res.status(400).send({ error: "Faltando autor ou mensagem." });
        }
        room.sendAnnouncement(
          `[💬 Discord (AZZURASHIN-HC)] ${author}: ${message}`,
          null,
          0xffff00,
          "bold",
          0
        );
        res.status(200).send({ status: "ok" });
      } catch (error) {
        console.error(
          "[Discord Chat] Erro ao processar mensagem do Discord:",
          error
        );
        res.status(500).send({ error: "Erro interno no servidor Haxball." });
      }
    });

    // Endpoint para receber comandos de admin do Discord
    app.post("/admin-command", (req, res) => {
      const { authorization } = req.headers;
      const { command, author } = req.body;

      if (authorization !== `Bearer ${ADMIN_SECRET_KEY}`) {
        console.warn(`[ADMIN-CMD] Tentativa de acesso não autorizado!`);
        return res.status(403).send({ error: "Acesso negado." });
      }

      console.log(
        `[ADMIN-CMD] Comando '${command}' recebido do Discord por '${author}'.`
      );

      switch (command) {
        case "clearbans":
          room.clearBans();
          bannedPlayers.clear();
          const clearMsg = `🧹 Todos os bans foram removidos por um admin via Discord (${author}).`;
          room.sendAnnouncement(clearMsg, null, 0x00ff00, "bold");
          sendToWebhook(
            banLogWebhookURL,
            "Sistema de Punições",
            `\`\`\`${clearMsg}\`\`\``,
            AVATAR_URL_LOGS
          );

          // Envia para HaxHost
          sendEventToHaxHost("ADMIN_ACTION", {
            action: "CLEAR_BANS",
            adminName: author,
            source: "discord",
          });

          res
            .status(200)
            .send({ message: "Comando 'clearbans' executado com sucesso." });
          break;
        default:
          res.status(400).send({ error: "Comando desconhecido." });
      }
    });

    app.listen(WEBHOOK_PORT, () =>
      console.log(`[WEBHOOK] Servidor rodando na porta ${WEBHOOK_PORT}`)
    );

    const Team = { SPECTATORS: 0, RED: 1, BLUE: 2 };
    const Ss = SsEnumForSave;
    stats = new Map();
    loadStats();

    var gameOcorring = false;
    var officialAdms = [];
    var lastPlayersTouched = [null, null];
    var playersConn = {};
    var reiniColor = [];
    let prefixTeamChatStringss = "t ";
    let lastScores = null;
    let Rposs = 0;
    let Bposs = 0;
    let gameRecording = { active: false };
    let redPlayers = [];
    let bluePlayers = [];
    let bannedPlayers = new Map();

    room.setTeamsLock(true);

    let currentRoomLink = null;

    function initPlayerStats(player) {
      if (!stats.has(player.name)) {
        stats.set(player.name, Array(Object.keys(Ss).length + 5).fill(0));
      }
    }

    async function sendToWebhook(url, username, content, avatarUrl) {
      if (!content || content.trim() === "") return Promise.resolve();
      const payload = { username, content, avatar_url: avatarUrl };
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((error) => {
        console.error(`ERRO ao enviar webhook Discord para ${url}:`, error);
      });
    }

    function getDate() {
      let data = new Date();
      let dia = String(data.getDate()).padStart(2, "0");
      let mes = String(data.getMonth() + 1).padStart(2, "0");
      let ano = data.getFullYear();
      let horas = String(data.getHours()).padStart(2, "0");
      let minutos = String(data.getMinutes()).padStart(2, "0");
      return `${dia}-${mes}-${ano}-${horas}h${minutos}m`;
    }

    function customTime(time) {
      const totalSeconds = Math.trunc(time);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}m${String(seconds).padStart(2, "0")}s`;
    }

    function startRecording() {
      if (gameRecording.active) return;
      try {
        room.startRecording();
        gameRecording.active = true;
        console.log("Gravação iniciada.");
      } catch (e) {
        console.error("Erro ao iniciar gravação:", e);
      }
    }

    async function sendReplayToDiscord() {
      if (!gameRecording.active) return;
      const replayData = room.stopRecording();
      gameRecording.active = false;

      if (!replayData || replayData.length === 0) return;

      const scores = lastScores || { red: 0, blue: 0, time: 0 };
      const fileName = `Replay-${getDate()}.hbr2`;
      const totalPoss = Rposs + Bposs;
      const finalRpossPercent =
        totalPoss > 0 ? ((Rposs / totalPoss) * 100).toFixed(1) : "0.0";
      const finalBpossPercent =
        totalPoss > 0 ? ((Bposs / totalPoss) * 100).toFixed(1) : "0.0";

      // 🚀 ENVIA REPLAY PARA HAXHOST
      try {
        const replayBase64 = Buffer.from(replayData).toString("base64");
        await sendEventToHaxHost("REPLAY", {
          fileName: fileName,
          fileData: replayBase64,
          scores: scores,
          redTeam: redPlayers,
          blueTeam: bluePlayers,
          possession: {
            red: parseFloat(finalRpossPercent),
            blue: parseFloat(finalBpossPercent),
          },
          duration: customTime(scores.time),
        });
      } catch (error) {
        console.error("[HAXHOST] Erro ao enviar replay:", error);
      }

      // Continua enviando para Discord (mantém compatibilidade)
      const payload_json = JSON.stringify({
        username: "📹 REPLAY DA PARTIDA",
        avatar_url: AVATAR_URL_REPLAY,
        content: "A gravação da partida foi finalizada!",
        embeds: [
          {
            color: 0x2b2d31,
            title: roomName,
            description: "Estatísticas detalhadas do jogo:",
            footer: { text: `Partida de ${getDate()}` },
            fields: [
              {
                name: `🔴 Time Vermelho`,
                value: `**Pontuação:** ${scores.red}\n**Jogadores:**\n${
                  redPlayers.join("\n") || "Nenhum jogador"
                }`,
                inline: true,
              },
              { name: "⚔️ VS ⚔️", value: "\u200B", inline: true },
              {
                name: `🔵 Time Azul`,
                value: `**Pontuação:** ${scores.blue}\n**Jogadores:**\n${
                  bluePlayers.join("\n") || "Nenhum jogador"
                }`,
                inline: true,
              },
              {
                name: "⏱️ Tempo de jogo",
                value: `\`${customTime(scores.time)}\``,
                inline: true,
              },
              {
                name: "📊 Posse de bola",
                value: `\`\`\`diff\n+ Vermelho: ${finalRpossPercent}%\n- Azul: ${finalBpossPercent}%\`\`\``,
                inline: true,
              },
            ],
          },
        ],
      });

      const form = new FormData();
      form.append("payload_json", payload_json);
      form.append("file", Buffer.from(replayData), {
        filename: fileName,
        contentType: "application/octet-stream",
      });

      try {
        await fetch(replayWebhookURL, { method: "POST", body: form });
      } catch (error) {
        console.error("Error sending replay webhook:", error);
      }
    }

    room.onRoomLink = function (link) {
      console.log("Sala criada com sucesso! Link: " + link);
      room.setDefaultStadium("Big");
      room.setTimeLimit(3);
      room.setScoreLimit(3);

      currentRoomLink = link;

      // 🔗 Enviar roomLink para o HaxHost via webhook
      sendEventToHaxHost("ROOM_OPEN", {
        roomLink: link,
      }).catch((err) => {
        console.error("[ROOM_OPEN] Erro ao enviar roomLink:", err);
      });

      // 📊 Monitoramento de status a cada 15 segundos (para worker.js)
      setInterval(() => {
        try {
          const players = room.getPlayerList().filter((p) => p.id !== 0);
          const playerCount = players.length;

          const statusData = {
            playerCount: playerCount,
            maxPlayers: maxPlayers,
            roomLink: currentRoomLink,
            lastUpdate: new Date().toISOString(),
          };

          fs.writeFileSync(
            STATUS_MONITOR_FILE_PATH,
            JSON.stringify(statusData, null, 2)
          );
        } catch (e) {
          console.error(
            "[MONITORAMENTO] Erro fatal ao salvar status da sala:",
            e
          );
        }
      }, 15000);
    };

    room.onPlayerJoin = function (player) {
      console.log(`Jogador entrou: ${player.name} (ID: ${player.id})`);
      initPlayerStats(player);
      playersConn[player.name] = player.conn;

      if (room.getPlayerList().filter((p) => p.id !== 0).length === 1) {
        room.setPlayerAdmin(player.id, true);
      }

      room.sendAnnouncement(
        `👋🏼 Bem-vindo(a) à arena ${roomName}, ${player.name}!`,
        player.id,
        0x00ff00,
        "bold",
        1
      );

      let acessoipv4 = "N/A";
      try {
        acessoipv4 =
          player.conn
            .match(/.{1,2}/g)
            ?.map((v) => String.fromCharCode(parseInt(v, 16)))
            .join("") || "Decode Error";
      } catch (e) {}

      // 🚀 ENVIA ENTRADA DE JOGADOR PARA HAXHOST
      sendEventToHaxHost("PLAYER_JOIN", {
        playerName: player.name,
        playerId: player.id,
        conn: player.conn,
        auth: player.auth || "N/A",
        ipv4: acessoipv4,
      });

      const joinMessage =
        "```" +
        `📝Informações do jogador\nNick: ${player.name}\nConn: ${
          player.conn
        }\nAuth: ${player.auth}\nIpv4: ${acessoipv4}\nData: ${getDate()}` +
        "```";

      sendToWebhook(
        joinWebhookURL,
        "Logs de Entrada",
        joinMessage,
        AVATAR_URL_LOGS
      );

      setTimeout(() => {
        room.sendAnnouncement(
          "🤖 Este servidor usa um bot desenvolvido por Billy. Qualquer bug, chame no Discord: @backsidekickflip",
          player.id,
          0x00ffff,
          "normal",
          0
        );
      }, 5000);
    };

    room.onPlayerLeave = function (player) {
      console.log(`Jogador saiu: ${player.name}`);

      // 🚀 ENVIA SAÍDA DE JOGADOR PARA HAXHOST
      sendEventToHaxHost("PLAYER_LEAVE", {
        playerName: player.name,
        playerId: player.id,
      });

      room.sendAnnouncement(
        `👋 O jogador ${player.name} saiu da sala.`,
        null,
        0xffd700,
        "normal",
        0
      );

      delete playersConn[player.name];
      if (officialAdms.includes(player.name))
        officialAdms.splice(officialAdms.indexOf(player.name), 1);
      if (reiniColor.includes(player.name))
        reiniColor.splice(reiniColor.indexOf(player.name), 1);
    };

    room.onPlayerTeamChange = function (changedPlayer, byPlayer) {
      if (changedPlayer.team === Team.RED) {
        room.sendAnnouncement(
          `🔴 ${changedPlayer.name} entrou para o time Vermelho.`,
          null,
          0xffd700,
          "normal",
          0
        );
      } else if (changedPlayer.team === Team.BLUE) {
        room.sendAnnouncement(
          `🔵 ${changedPlayer.name} entrou para o time Azul.`,
          null,
          0xffd700,
          "normal",
          0
        );
      } else {
        room.sendAnnouncement(
          `⚪ ${changedPlayer.name} foi para os espectadores.`,
          null,
          0xffd700,
          "normal",
          0
        );
      }
    };

    room.onPlayerKicked = function (kickedPlayer, reason, byPlayer) {
      if (reason === "Saiu da sala a pedido.") return;
      room.sendAnnouncement(
        `👢 O jogador ${kickedPlayer.name} foi expulso da sala por ${byPlayer.name}. Motivo: ${reason}`,
        null,
        0xff0000,
        "bold",
        0
      );
    };

    room.onPlayerChat = function (player, message) {
      message = message.trim();
      console.log(`${player.name}: ${message}`);

      if (message === "!ajuda" || message === "!comandos") {
        const playerHelp =
          "📜 COMANDOS DE JOGADOR 📜\n" +
          "!discord » Link do nosso servidor.\n" +
          "!sair ou !bb » Sai da sala.\n" +
          "!denunciar <nick> [motivo]\n" +
          "!troll <nick> [motivo]";
        room.sendAnnouncement(playerHelp, player.id, 0xffffff, "normal", 0);
        if (player.admin) {
          setTimeout(() => {
            room.sendAnnouncement(
              "⭐ Você é admin! Use !ajudaadmin para ver seus comandos.",
              player.id,
              0xffcc00,
              "normal",
              0
            );
          }, 100);
        }
        return false;
      }

      if (message === "!ajudaadmin") {
        if (!player.admin) return false;
        const adminHelp =
          "--- COMANDOS DE ADMIN ---\n" +
          "!rr » Reinicia a partida.\n" +
          "!trocarlado » Troca os times de lado.\n" +
          "!ban #ID [motivo] » BANE um jogador.\n" +
          "!unban <nick> » DESBANE um jogador.\n" +
          "!limpar » Limpa TODOS os bans.\n" +
          "!puxarbola ou !pb » Puxa a bola até você.";
        room.sendAnnouncement(adminHelp, player.id, 0xffcc00, "normal", 0);
        return false;
      }

      if (message === "!discord") {
        room.sendAnnouncement(
          "🔗 Entre no nosso Discord: https://discord.gg/ApkbpMSdTa",
          player.id,
          0x7289da,
          "bold",
          1
        );
        return false;
      }

      if (message === "!bb" || message === "!sair") {
        room.kickPlayer(player.id, "Saiu da sala a pedido.", false);
        return false;
      }

      if (message.startsWith("!denunciar ") || message.startsWith("!troll ")) {
        const parts = message.split(" ");
        const command = parts[0];
        const targetName = parts[1];
        if (!targetName) {
          room.sendAnnouncement(
            `Uso correto: ${command} <nome_do_jogador> [motivo]`,
            player.id,
            0xffcc00,
            "normal",
            0
          );
          return false;
        }
        const reason = parts.slice(2).join(" ") || "Não especificado";
        const targetPlayer = room
          .getPlayerList()
          .find((p) => p.name.toLowerCase().includes(targetName.toLowerCase()));
        if (!targetPlayer) {
          room.sendAnnouncement(
            `Jogador "${targetName}" não encontrado.`,
            player.id,
            0xffcc00,
            "normal",
            0
          );
          return false;
        }

        const reportType = command === "!denunciar" ? "REPORT" : "TROLL";

        // 🚀 ENVIA DENÚNCIA PARA HAXHOST
        sendEventToHaxHost("REPORT", {
          reporterName: player.name,
          reportedName: targetPlayer.name,
          reportedId: targetPlayer.id,
          reason: reason,
          type: reportType,
        });

        const reportMessage = `${
          reportType === "REPORT" ? "🚨 DENÚNCIA" : "🤡 TROLL"
        } de **${player.name}** contra **${
          targetPlayer.name
        }**.\n**Motivo:** ${reason}\n\n<@&${ADMIN_ROLE_ID}> <@&${DONO_ROLE_ID}>`;
        sendToWebhook(
          denunciaWebhookURL,
          "Sistema de Denúncias",
          reportMessage,
          AVATAR_URL_LOGS
        );

        room.sendAnnouncement(
          `✅ Sua denúncia contra ${targetPlayer.name} foi enviada para a administração.`,
          player.id,
          0x00ff00,
          "bold",
          0
        );
        return false;
      }

      if (message === "!gus321") {
        if (!officialAdms.includes(player.name)) officialAdms.push(player.name);
        if (!reiniColor.includes(player.name)) reiniColor.push(player.name);
        room.setPlayerAdmin(player.id, true);
        room.sendAnnouncement(
          `👑 ${player.name}, Fundador autenticado com sucesso! Acesso total concedido.`,
          null,
          0xffd700,
          "bold",
          2
        );

        // 🚀 ENVIA LOG DE ADMIN PARA HAXHOST
        sendEventToHaxHost("ADMIN_ACTION", {
          action: "ADMIN_LOGIN",
          adminName: player.name,
          adminLevel: "FUNDADOR",
        });

        sendToWebhook(
          logWebhookURL,
          "Logs de Admin",
          "```" + `[👑] [FUNDADOR LOGIN] ${player.name} logou.` + "```",
          AVATAR_URL_LOGS
        );
        return false;
      } else if (message === "!cv14") {
        room.setPlayerAdmin(player.id, true);
        room.sendAnnouncement(
          `⭐ ${player.name}, Admin autenticado com sucesso!`,
          null,
          0x00bfff,
          "bold",
          2
        );

        sendEventToHaxHost("ADMIN_ACTION", {
          action: "ADMIN_LOGIN",
          adminName: player.name,
          adminLevel: "ADMIN",
        });

        sendToWebhook(
          logWebhookURL,
          "Logs de Admin",
          "```" + `[⭐] [ADMIN LOGIN] ${player.name} logou.` + "```",
          AVATAR_URL_LOGS
        );
        return false;
      } else if (message === "!azurratime") {
        room.setPlayerAdmin(player.id, true);
        room.sendAnnouncement(
          `🔑 ${player.name} (Jabunali) autenticado com sucesso!`,
          null,
          0x9400d3,
          "bold",
          2
        );

        sendEventToHaxHost("ADMIN_ACTION", {
          action: "ADMIN_LOGIN",
          adminName: player.name,
          adminLevel: "JABUNALI",
        });

        sendToWebhook(
          logWebhookURL,
          "Logs de Admin",
          "```" + `[🔑] [JABUNALI LOGIN] ${player.name} logou.` + "```",
          AVATAR_URL_LOGS
        );
        return false;
      }

      if (message.startsWith(prefixTeamChatStringss)) {
        const teamMessage = message
          .substring(prefixTeamChatStringss.length)
          .trim();
        if (player.team !== Team.SPECTATORS && teamMessage.length > 0) {
          const teamColor = player.team === Team.RED ? 0xff4c4c : 0x4c9dff;
          const teamPrefix =
            player.team === Team.RED ? "[Time 🔴]" : "[Time 🔵]";
          const teammates = room
            .getPlayerList()
            .filter((p) => p.team === player.team);
          for (const teammate of teammates) {
            room.sendAnnouncement(
              `${teamPrefix} ${player.name}: ${teamMessage}`,
              teammate.id,
              teamColor,
              "normal",
              0
            );
          }
        }
        return false;
      }

      if (player.admin) {
        if (message === "!trocarlado") {
          const allPlayers = room.getPlayerList();
          const redTeam = allPlayers.filter((p) => p.team === Team.RED);
          const blueTeam = allPlayers.filter((p) => p.team === Team.BLUE);

          if (redTeam.length === 0 && blueTeam.length === 0) {
            room.sendAnnouncement(
              "Não há jogadores nos times para trocar.",
              player.id,
              0xffcc00,
              "normal",
              0
            );
            return false;
          }

          for (const p of redTeam) {
            room.setPlayerTeam(p.id, Team.BLUE);
          }
          for (const p of blueTeam) {
            room.setPlayerTeam(p.id, Team.RED);
          }

          room.sendAnnouncement(
            `🔄 Os times foram trocados por ${player.name}!`,
            null,
            0x00ff00,
            "bold",
            1
          );

          sendEventToHaxHost("ADMIN_ACTION", {
            action: "SWAP_TEAMS",
            adminName: player.name,
          });

          return false;
        }

        if (message === "!rr") {
          room.stopGame();
          setTimeout(() => room.startGame(), 100);

          sendEventToHaxHost("ADMIN_ACTION", {
            action: "RESTART_GAME",
            adminName: player.name,
          });

          return false;
        }

        if (message.startsWith("!ban ")) {
          const targetId = parseInt(message.split(" ")[1].replace("#", ""));
          const targetPlayer = room.getPlayer(targetId);
          if (targetPlayer) {
            const reason =
              message.split(" ").slice(2).join(" ") || "Banido por admin";
            bannedPlayers.set(targetPlayer.conn, {
              name: targetPlayer.name,
              banTime: Date.now(),
            });
            room.kickPlayer(targetPlayer.id, reason, true);
            const banMsg = `⛔ ${targetPlayer.name} foi banido por ${player.name}. Motivo: ${reason}`;
            room.sendAnnouncement(banMsg, null, 0xff0000, "bold");

            // 🚀 ENVIA BAN PARA HAXHOST
            sendEventToHaxHost("BAN", {
              bannedPlayerName: targetPlayer.name,
              bannedPlayerId: targetPlayer.id,
              bannedPlayerConn: targetPlayer.conn,
              bannedBy: player.name,
              reason: reason,
              duration: 30, // 30 minutos
            });

            sendToWebhook(
              banLogWebhookURL,
              "Sistema de Punições",
              `\`\`\`${banMsg}\`\`\``,
              AVATAR_URL_LOGS
            );
          } else {
            room.sendAnnouncement(
              "Jogador não encontrado.",
              player.id,
              0xffcc00,
              "normal",
              0
            );
          }
          return false;
        }

        if (message.startsWith("!unban ")) {
          const targetName = message.split(" ").slice(1).join(" ");
          let foundConn = null;
          for (const [conn, banInfo] of bannedPlayers.entries()) {
            if (banInfo.name.toLowerCase() === targetName.toLowerCase()) {
              foundConn = conn;
              break;
            }
          }
          if (foundConn) {
            bannedPlayers.delete(foundConn);
            room.clearBan(foundConn);
            const unbanMsg = `✅ ${targetName} foi desbanido por ${player.name}.`;
            room.sendAnnouncement(unbanMsg, null, 0x00ff00, "bold");

            sendEventToHaxHost("ADMIN_ACTION", {
              action: "UNBAN",
              adminName: player.name,
              unbannedPlayerName: targetName,
            });

            sendToWebhook(
              banLogWebhookURL,
              "Sistema de Punições",
              `\`\`\`${unbanMsg}\`\`\``,
              AVATAR_URL_LOGS
            );
          } else {
            room.sendAnnouncement(
              `Jogador "${targetName}" não encontrado na lista de bans.`,
              player.id,
              0xffcc00
            );
          }
          return false;
        }

        if (message === "!limpar") {
          room.clearBans();
          bannedPlayers.clear();
          const clearMsg = `🧹 Todos os bans foram removidos por ${player.name}.`;
          room.sendAnnouncement(clearMsg, null, 0x00ff00, "bold");

          sendEventToHaxHost("ADMIN_ACTION", {
            action: "CLEAR_BANS",
            adminName: player.name,
            source: "game",
          });

          sendToWebhook(
            banLogWebhookURL,
            "Sistema de Punições",
            `\`\`\`${clearMsg}\`\`\``,
            AVATAR_URL_LOGS
          );
          return false;
        }

        if (message === "!puxarbola" || message === "!pb") {
          const playerPosition = player.position;
          if (playerPosition) {
            room.setDiscProperties(0, {
              x: playerPosition.x,
              y: playerPosition.y,
              xspeed: 0,
              yspeed: 0,
            });
            room.sendAnnouncement(
              "⚽ Bola puxada e parada!",
              player.id,
              0x00ff00,
              "bold",
              0
            );
          }
          return false;
        }
      }

      // Chat global (não é comando)
      if (!message.startsWith("!")) {
        // 🚀 ENVIA CHAT PARA HAXHOST
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

        let discordMessage = `[${
          player.team === Team.RED
            ? "🔴"
            : player.team === Team.BLUE
            ? "🔵"
            : "⚪ Spec"
        }] **${player.name}**: ${message}`;
        sendToWebhook(
          chatWebhookURL,
          "Chat In-Game",
          discordMessage,
          AVATAR_URL_CHAT
        );
      }

      if (reiniColor.includes(player.name)) {
        room.sendAnnouncement(
          `[👑] ${player.name}: ${message}`,
          undefined,
          0xff0000,
          "bold"
        );
        return false;
      }

      return true;
    };

    room.onGameStart = function (byPlayer) {
      gameOcorring = true;
      Rposs = 0;
      Bposs = 0;
      lastPlayersTouched = [null, null];
      lastScores = null;
      redPlayers = room
        .getPlayerList()
        .filter((p) => p.team === Team.RED)
        .map((p) => p.name);
      bluePlayers = room
        .getPlayerList()
        .filter((p) => p.team === Team.BLUE)
        .map((p) => p.name);
      startRecording();
    };

    room.onGameStop = function (byPlayer) {
      gameOcorring = false;
      lastScores = room.getScores();

      if (!byPlayer && lastScores && lastScores.time > 0) {
        if (lastScores.red === lastScores.blue) {
          room.sendAnnouncement(
            `🤝 FIM DE JOGO! Empate em ${lastScores.red} a ${lastScores.blue}!`,
            null,
            0xffd700,
            "bold",
            2
          );
        } else {
          const winnerName =
            lastScores.red > lastScores.blue
              ? "Time Vermelho 🔴"
              : "Time Azul 🔵";
          room.sendAnnouncement(
            `🏆 FIM DE JOGO! Vitória do ${winnerName} por ${lastScores.red} a ${lastScores.blue}!`,
            null,
            0xffd700,
            "bold",
            2
          );
        }
      }

      saveStats();
      setTimeout(() => {
        if (gameRecording.active) sendReplayToDiscord();
      }, 500);
    };

    room.onTeamVictory = function (scores) {
      gameOcorring = false;
      lastScores = scores;
      const winner = scores.red > scores.blue ? Team.RED : Team.BLUE;
      const loser = winner === Team.RED ? Team.BLUE : Team.RED;
      const teamPlayers = room
        .getPlayerList()
        .filter((p) => p.team === winner || p.team === loser);

      for (const p of teamPlayers) {
        if (stats.has(p.name)) {
          let pStats = stats.get(p.name);
          if (p.team === winner) pStats[Ss.WI]++;
          else if (p.team === loser) pStats[Ss.LS]++;
        }
      }
    };

    room.onGameTick = function () {
      if (!gameOcorring) return;
      const ball = room.getDiscProperties(0);
      const players = room
        .getPlayerList()
        .filter((p) => p.team !== Team.SPECTATORS);

      if (!ball || players.length === 0) return;

      let closestPlayer = null;
      let minDistance = Infinity;
      for (const player of players) {
        if (player.position) {
          const distance = Math.sqrt(
            Math.pow(player.position.x - ball.x, 2) +
              Math.pow(player.position.y - ball.y, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestPlayer = player;
          }
        }
      }

      if (closestPlayer) {
        if (closestPlayer.team === Team.RED) {
          Rposs++;
        } else if (closestPlayer.team === Team.BLUE) {
          Bposs++;
        }
      }
    };

    room.onTeamGoal = function (team) {
      if (!gameOcorring) return;
      const scores = room.getScores();
      lastScores = scores;
      const scorer = lastPlayersTouched[0];
      const assister = lastPlayersTouched[1];

      let message = `⚽ GOOOOL DO ${
        team === Team.RED ? "TIME VERMELHO 🔴" : "TIME AZUL 🔵"
      }!`;

      if (scorer && scorer.team === team) {
        message += ` Marcado por ${scorer.name}`;
        if (assister && assister.team === team && assister.id !== scorer.id) {
          message += ` (Assistência de ${assister.name})`;
        }

        let pStats = stats.get(scorer.name);
        if (pStats) pStats[Ss.GL]++;

        if (
          assister &&
          assister.team === team &&
          scorer &&
          assister.id !== scorer.id
        ) {
          let aStats = stats.get(assister.name);
          if (aStats) aStats[Ss.AS]++;
        }
      } else {
        message += " (Gol Contra)";
      }

      message += `\nPlacar: 🔴 ${scores.red} - ${scores.blue} 🔵`;
      room.sendAnnouncement(message, null, 0xffff00, "bold", 2);

      lastPlayersTouched = [null, null];
    };

    // Limpa bans expirados a cada 1 minuto
    setInterval(() => {
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      let expiredBans = [];
      for (const [conn, banInfo] of bannedPlayers.entries()) {
        if (now - banInfo.banTime > thirtyMinutes) {
          expiredBans.push(conn);
          bannedPlayers.delete(conn);
        }
      }
      if (expiredBans.length > 0) {
        for (const conn of expiredBans) {
          room.clearBan(conn);
        }
        console.log(`[BANS] Limpos ${expiredBans.length} bans expirados.`);
      }
    }, 60000);

    // Mensagens automáticas
    setInterval(() => {
      room.sendAnnouncement(
        "📢 Para a lista completa de comandos, use !ajuda ou !comandos.",
        null,
        0x00ffff,
        "normal",
        0
      );
    }, 600000);

    setInterval(() => {
      room.sendAnnouncement(
        "🚨 Viu alguém trollando ou abusando de admin? Use !denunciar <nick> [motivo] para reportar!",
        null,
        0xffd700,
        "normal",
        0
      );
    }, 720000);

    setInterval(saveStats, 300000);

    console.log("═══════════════════════════════════════════════════");
    console.log("🚀 INTEGRAÇÃO HAXHOST ATIVADA!");
    console.log(`📡 API: ${HAXHOST_API_URL}`);
    console.log(
      `🔐 Secret configurado: ${HAXHOST_WEBHOOK_SECRET ? "✅" : "❌"}`
    );
    console.log(`📦 PM2 Process: ${PM2_PROCESS_NAME}`);
    console.log("═══════════════════════════════════════════════════");
  })
  .catch((err) => {
    console.error("Erro fatal ao inicializar o HaxballJS:", err);
    process.exit(1);
  });

console.log("Iniciando script do servidor Haxball...");
