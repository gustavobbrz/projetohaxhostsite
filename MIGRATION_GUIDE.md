# Guia de Migração do Dashboard

## 📋 O que foi implementado

### 1. **Schema do Prisma Expandido** ✅
- Adicionados modelos completos para todas as funcionalidades
- Models: `DiscordChannel`, `ChatMessage`, `Replay`, `PlayerEntry`, `AdminLog`, `Report`, `Ban`
- Campos adicionais no modelo `Server` para configurações e assinatura

### 2. **Dashboard Completo** ✅
- Interface estilo Discord com navegação lateral
- Lista de servidores na sidebar esquerda
- Canais organizados por categoria
- 9 seções implementadas:
  - 🏠 Visão Geral (Overview)
  - 💬 Chat Global
  - 🎬 Replay
  - 🏆 Ranking (placeholder)
  - 🔔 Atualizações (placeholder)
  - 👑 Admin Logs
  - 👋 Entrada/Saída
  - 🚨 Denúncias
  - ✅ Clear Bans

### 3. **APIs REST Completas** ✅
Todas as rotas necessárias foram criadas:

#### Servidores
- `GET /api/servers` - Lista servidores do usuário
- `POST /api/servers` - Cria novo servidor

#### Chat Global
- `GET /api/servers/[serverId]/chat` - Busca mensagens
- `POST /api/servers/[serverId]/chat` - Envia mensagem

#### Replays
- `GET /api/servers/[serverId]/replays` - Lista replays

#### Admin Logs
- `GET /api/servers/[serverId]/admin-logs` - Logs de administração

#### Entradas
- `GET /api/servers/[serverId]/entries` - Registro de entrada/saída

#### Denúncias
- `GET /api/servers/[serverId]/reports` - Lista denúncias
- `PATCH /api/servers/[serverId]/reports` - Atualiza status

#### Bans
- `GET /api/servers/[serverId]/bans` - Lista bans
- `POST /api/servers/[serverId]/bans` - Adiciona ban
- `DELETE /api/servers/[serverId]/bans` - Remove ban

## 🚀 Como Executar a Migração

### Passo 1: Gerar e aplicar migration do Prisma

```bash
# Gerar migration
npx prisma migrate dev --name add_dashboard_features

# OU se já estiver em produção
npx prisma migrate deploy
```

### Passo 2: Gerar client do Prisma

```bash
npx prisma generate
```

### Passo 3: (Opcional) Popular com dados de exemplo

Crie um arquivo `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Crie um usuário de teste
  const user = await prisma.user.upsert({
    where: { email: "teste@haxhost.com" },
    update: {},
    create: {
      email: "teste@haxhost.com",
      name: "Usuário Teste",
      password: "$2a$10$...", // hash bcrypt
    },
  });

  // Crie um servidor de teste
  const server = await prisma.server.create({
    data: {
      userId: user.id,
      name: "Sala de Teste",
      status: "active",
      subscriptionStatus: "active",
      roomLink: "https://www.haxball.com/play?c=teste",
    },
  });

  // Adicione algumas mensagens de exemplo
  await prisma.chatMessage.createMany({
    data: [
      {
        serverId: server.id,
        playerName: "Billy",
        message: "Bem-vindo à sala!",
        source: "game",
      },
      {
        serverId: server.id,
        playerName: "Admin",
        message: "Boa sorte!",
        source: "discord",
      },
    ],
  });

  console.log("✅ Seed completo!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Execute o seed:
```bash
npx prisma db seed
```

### Passo 4: Executar o projeto

```bash
npm run dev
```

Acesse: `http://localhost:3000/dashboard`

## 🔧 Configurações Necessárias

### Variáveis de Ambiente (`.env.local`)

```env
# Database
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta"

# Discord OAuth (opcional)
DISCORD_CLIENT_ID="..."
DISCORD_CLIENT_SECRET="..."

# API Worker
API_SECRET_KEY="sua-chave-secreta-super-segura"
```

## 📝 Próximos Passos (Fase 2)

### Integrações Pendentes

1. **Discord Bot Integration**
   - Criar bot Discord para cada servidor
   - Webhook para enviar/receber mensagens
   - Comandos para clear-bans via Discord

2. **Worker Script Atualizado**
   - Modificar `worker.js` para enviar dados para as novas tabelas
   - Capturar eventos: chat, replays, entradas, admin actions

3. **Sistema de Pagamento**
   - Integração Stripe/Mercado Pago
   - Webhooks para ativar/desativar servidores
   - Página de checkout

4. **Provisionamento Automático**
   - API para criar servidor automaticamente
   - Script de deploy do Haxball
   - Configuração PM2 via API

5. **Controles de Servidor**
   - Botões funcionais: Start/Stop/Restart
   - API para comunicar com PM2 na EC2
   - Logs em tempo real

## 🎨 Personalização

### Cores do Tema

O dashboard usa as cores do Discord:
- Background: `#36393f`
- Sidebar: `#2f3136`
- Hover: `#42464d`
- Accent: `#5865f2` (Discord Blurple)

Para personalizar, edite as classes Tailwind em:
- `app/dashboard/page.tsx`

### Adicionar Novos Canais

1. Adicione o canal no array `channels` (linha ~118)
2. Crie um componente de seção
3. Adicione o case no `renderChannelContent`
4. Crie a API correspondente

## 🐛 Troubleshooting

### Erro: "authOptions is not exported"
✅ Já corrigido em `lib/auth.ts`

### Erro: "Cannot find module @prisma/client"
```bash
npm install @prisma/client
npx prisma generate
```

### Erro: "Table does not exist"
```bash
npx prisma migrate deploy
```

### Dashboard vazio
- Certifique-se de estar logado
- Verifique se há servidores criados para o usuário
- Confira o console do navegador (F12)

## 📞 Suporte

Para dúvidas ou problemas, entre em contato pelo Discord da HaxHost.

