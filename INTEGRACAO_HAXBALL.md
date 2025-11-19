# 🎮 Integração Haxball → Site HaxHost

## 📋 **Resumo**

Este guia mostra como enviar eventos do seu script Haxball para o site, para que apareçam no dashboard em tempo real.

---

## 🔗 **Endpoint do Webhook**

```
POST https://seu-site.vercel.app/api/webhook/game-event
```

**Headers:**

```
Authorization: Bearer haxhost-secret-2024
Content-Type: application/json
```

---

## 📝 **Eventos Suportados**

### 1. **Mensagem de Chat**

```javascript
// No seu script Haxball, quando alguém fala no chat:
room.onPlayerChat = function (player, message) {
  // Enviar para o site
  sendToWebsite({
    eventType: "chat_message",
    serverId: "srv-azzurashin-xxxxx", // ID do servidor no site
    data: {
      playerName: player.name,
      playerAuth: player.auth,
      message: message,
      source: "game",
    },
  });
};
```

### 2. **Jogador Entrou**

```javascript
room.onPlayerJoin = function (player) {
  sendToWebsite({
    eventType: "player_joined",
    serverId: "srv-azzurashin-xxxxx",
    data: {
      playerName: player.name,
      playerAuth: player.auth,
      playerConn: player.conn,
      playerIp: null, // Opcional, por privacidade
    },
  });
};
```

### 3. **Jogador Saiu**

```javascript
room.onPlayerLeave = function (player) {
  sendToWebsite({
    eventType: "player_left",
    serverId: "srv-azzurashin-xxxxx",
    data: {
      playerName: player.name,
      playerAuth: player.auth,
      playerConn: player.conn,
    },
  });
};
```

### 4. **Ação de Admin**

```javascript
// Quando um admin faz kick, ban, etc
function logAdminAction(admin, action, targetPlayer, reason) {
  sendToWebsite({
    eventType: "admin_action",
    serverId: "srv-azzurashin-xxxxx",
    data: {
      adminName: admin.name,
      adminAuth: admin.auth,
      action: action, // "kick", "ban", "mute", etc
      targetPlayer: targetPlayer ? targetPlayer.name : null,
      reason: reason,
    },
  });
}
```

### 5. **Denúncia**

```javascript
// Quando alguém usa !denunciar
function handleReport(reporter, reported, reason) {
  sendToWebsite({
    eventType: "report",
    serverId: "srv-azzurashin-xxxxx",
    data: {
      reporterName: reporter.name,
      reporterAuth: reporter.auth,
      reportedName: reported.name,
      reportedAuth: reported.auth,
      reason: reason,
    },
  });
}
```

### 6. **Ban**

```javascript
function banPlayer(player, reason, bannedBy, durationInSeconds) {
  sendToWebsite({
    eventType: "ban",
    serverId: "srv-azzurashin-xxxxx",
    data: {
      playerName: player.name,
      playerAuth: player.auth,
      playerIp: null,
      reason: reason,
      bannedBy: bannedBy.name,
      duration: durationInSeconds, // null = permanente
    },
  });
}
```

### 7. **Replay (Fim de Partida)**

```javascript
room.onGameEnd = function (scores) {
  const gameRec = room.stopRecording();

  sendToWebsite({
    eventType: "replay",
    serverId: "srv-azzurashin-xxxxx",
    data: {
      fileName: `partida_${Date.now()}.hbr2`,
      fileUrl: null, // Ou URL se você fazer upload
      scoreRed: scores.red,
      scoreBlue: scores.blue,
      duration: Math.floor(room.getScores().time / 60), // segundos
      players: room.getPlayerList().map((p) => p.name),
      possession: {
        red: calculatePossession("red"), // Você calcula
        blue: calculatePossession("blue"),
      },
    },
  });
};
```

---

## 🔧 **Função Helper para Enviar**

Adicione esta função no seu script Haxball:

```javascript
const HAXHOST_WEBHOOK_URL =
  "https://seu-site.vercel.app/api/webhook/game-event";
const HAXHOST_SECRET = "haxhost-secret-2024";

function sendToWebsite(payload) {
  // No Node.js (se estiver rodando com PM2)
  const https = require("https");
  const data = JSON.stringify(payload);

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HAXHOST_SECRET}`,
      "Content-Length": data.length,
    },
  };

  const req = https.request(HAXHOST_WEBHOOK_URL, options, (res) => {
    // Sucesso
  });

  req.on("error", (error) => {
    console.error("Erro ao enviar para HaxHost:", error);
  });

  req.write(data);
  req.end();
}
```

---

## 🎯 **ID do Servidor**

Para encontrar o ID do seu servidor:

1. Faça login no site: https://haxhost.com/dashboard
2. O ID aparece na URL ou nas configurações
3. Para a Azzurashin, use: `srv-azzurashin-xxxxx`

Você pode buscar o ID programaticamente:

```javascript
// Buscar ID do servidor pelo nome PM2
const serverName = "haxball-server"; // Nome do processo PM2

fetch(
  `https://seu-site.vercel.app/api/servers/find-by-pm2?name=${serverName}`,
  {
    headers: {
      Authorization: `Bearer ${HAXHOST_SECRET}`,
    },
  }
)
  .then((res) => res.json())
  .then((data) => {
    const serverId = data.serverId;
    // Usar este ID nos webhooks
  });
```

---

## 📊 **Teste Rápido**

Você pode testar o webhook com curl:

```bash
curl -X POST https://seu-site.vercel.app/api/webhook/game-event \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer haxhost-secret-2024" \
  -d '{
    "eventType": "chat_message",
    "serverId": "srv-azzurashin-xxxxx",
    "data": {
      "playerName": "Billy",
      "message": "Teste do webhook!",
      "source": "game"
    }
  }'
```

---

## 🔄 **Integração com Discord Bot**

Seu Discord bot já envia mensagens para o Haxball. Agora, faça ele TAMBÉM enviar para o site:

```javascript
// No seu discord_bot.js
async function sendToHaxball(message) {
  const content = message.content.trim();

  // 1. Enviar para o Haxball (já existe)
  await fetch(CONFIG.HAXBALL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      author: message.author.username,
      message: content,
    }),
  });

  // 2. NOVO: Enviar para o site também
  await fetch("https://seu-site.vercel.app/api/webhook/game-event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer haxhost-secret-2024",
    },
    body: JSON.stringify({
      eventType: "chat_message",
      serverId: "srv-azzurashin-xxxxx",
      data: {
        playerName: message.author.username,
        message: content,
        source: "discord",
      },
    }),
  });
}
```

---

## ✅ **Checklist de Implementação**

- [ ] Adicionar função `sendToWebsite()` no script Haxball
- [ ] Configurar `serverId` correto
- [ ] Testar evento de chat
- [ ] Testar entrada/saída de jogadores
- [ ] Integrar replays
- [ ] Conectar denúncias
- [ ] Sincronizar bans
- [ ] Atualizar Discord bot para enviar pro site também

---

## 🆘 **Troubleshooting**

### Erro 401 (Não autorizado)

- Verifique se o header Authorization está correto
- Confirme que o secret key é `haxhost-secret-2024`

### Erro 404 (Servidor não encontrado)

- Verifique se o `serverId` está correto
- Confirme que o servidor existe no banco de dados

### Eventos não aparecem no dashboard

- Verifique os logs do servidor Next.js
- Confirme que o banco de dados está sendo atualizado
- Recarregue a página do dashboard

---

## 📞 **Suporte**

Dúvidas? Entre no Discord da HaxHost ou contate Billy.
