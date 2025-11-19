# 🎮 Dashboard HaxHost - Documentação Completa

## 📸 Preview

O Dashboard foi desenvolvido para espelhar a interface do Discord, proporcionando uma experiência familiar e intuitiva para gerenciar seus servidores Haxball.

```
┌─────────────────────────────────────────────────────────────┐
│  [🏠]  │ 🏠 SALA DD      │  💬 chat-global                   │
│        │                 │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [DD]  │ 💬 chat-global  │  [Billy]: Bem-vindo! 🎮          │
│  [AZ]  │ 🎬 replay       │  [Jogador1]: Obrigado!           │
│        │ 🏆 ranking      │  [Admin]: Digite !help            │
│  [+]   │ 🔔 atualizações │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│        │                 │  [Digite sua mensagem...]  [>]    │
│  [U]   │ 👑 adm          │                                    │
│        │ 👋 entrada      │                                    │
│        │ 🚨 denúncias    │                                    │
│        │ ✅ clear-bans   │                                    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Funcionalidades Implementadas

### 1. **Visão Geral (Overview)** 🏠

Painel principal com informações do servidor:
- Status do servidor (Ativo, Pendente, Suspenso)
- Estatísticas: Jogadores máx, Status assinatura, Próximo pagamento
- Link da sala (copiar/abrir)
- Controles: Iniciar, Parar, Reiniciar, Configurações

**Screenshot da funcionalidade:**
- Card com nome do servidor e data de criação
- Grid de 3 cards com estatísticas
- Área para link da sala com botões de copiar e abrir
- Botões de controle coloridos e responsivos

### 2. **Chat Global** 💬

Sistema de mensagens bidirecional (Jogo ↔ Discord):

**Recursos:**
- Visualização de mensagens em tempo real
- Identificação da origem (game/discord)
- Avatar de cada jogador
- Timestamp de cada mensagem
- Auto-atualização a cada 5 segundos
- Scroll automático para novas mensagens

**Exemplo de uso:**
```typescript
// Mensagem do jogo
{
  playerName: "Billy",
  message: "Bem-vindo à sala!",
  source: "game",
  createdAt: "2024-11-01T20:30:00Z"
}

// Mensagem do Discord
{
  playerName: "Admin",
  message: "Digite !help para comandos",
  source: "discord",
  createdAt: "2024-11-01T20:31:00Z"
}
```

### 3. **Replays** 🎬

Sistema automático de gravação de partidas:

**Informações exibidas:**
- Nome do arquivo (.hbr2)
- Placar (Red vs Blue)
- Duração da partida
- Lista de jogadores
- Posse de bola (%)
- Link para download

**Exemplo:**
```
📁 partida_2024_11_01_20_30.hbr2
   ⚽ 5 x 3
   ⏱️ 10:00
   🎯 Posse: Red 55% | Blue 45%
   👥 Billy, Jogador1, Jogador2, Jogador3
   [📥 Baixar Replay]
```

### 4. **Ranking** 🏆

(Em desenvolvimento)
- Estatísticas de jogadores
- Placares e vitórias
- Ranking por pontuação
- Gráficos de desempenho

### 5. **Atualizações** 🔔

(Em desenvolvimento)
- Novidades do servidor
- Mudanças no script
- Avisos importantes
- Changelog

### 6. **Admin Logs** 👑

Registro completo de ações administrativas:

**Eventos capturados:**
- Login de admins
- Kicks aplicados
- Bans aplicados
- Mutes
- Mudanças de configuração

**Informações exibidas:**
- Nome do admin
- Ação executada
- Jogador alvo (se aplicável)
- Motivo
- Timestamp

**Exemplo:**
```
👑 Billy executou ban → HackerPro
   Motivo: Uso de cheats detectado
   20:45 - 01/11/2024
```

### 7. **Entrada/Saída** 👋

Monitoramento de conexões:

**Informações capturadas:**
- Nome do jogador
- Auth (identificador único)
- Conn (código de conexão)
- IP (opcional)
- Ação (joined/left)
- Horário

**Interface:**
- ➡️ Verde para entradas
- ⬅️ Vermelho para saídas
- Auto-atualização a cada 10 segundos
- Últimas 100 entradas

### 8. **Denúncias** 🚨

Sistema de reports de jogadores:

**Fluxo:**
1. Jogador faz denúncia no jogo
2. Aparece no dashboard com status "Pendente"
3. Admin pode marcar como "Revisado" ou "Resolvido"
4. Histórico completo de denúncias

**Informações:**
- Quem denunciou
- Quem foi denunciado
- Motivo da denúncia
- Status (Pendente, Revisado, Resolvido)
- Data/hora

**Ações disponíveis:**
- Marcar como Revisado
- Resolver denúncia
- Ver histórico

### 9. **Clear Bans** ✅

Gerenciamento completo de banimentos:

**Recursos:**
- Lista de todos os bans (ativos e inativos)
- Informações completas: Nome, Auth, IP, Motivo
- Quem aplicou o ban
- Data do banimento
- Opção de remover ban
- Confirmação antes de remover

**Interface:**
```
🚫 HackerPro
   Auth: AUTH777
   IP: 192.168.1.100
   Motivo: Uso de cheats detectado
   Banido por: Billy
   01/11/2024 20:30
   [🗑️ Remover Ban]
```

## 🎨 Design System

### Cores (Discord Style)

```css
/* Backgrounds */
--bg-primary: #36393f;
--bg-secondary: #2f3136;
--bg-tertiary: #202225;

/* Hover States */
--hover-bg: #42464d;
--hover-light: #3a3d44;

/* Text */
--text-primary: #ffffff;
--text-secondary: #dcddde;
--text-muted: #8e9297;

/* Accents */
--accent-purple: #5865f2; /* Discord Blurple */
--accent-green: #3ba55d;
--accent-red: #ed4245;
--accent-yellow: #faa61a;

/* Borders */
--border-color: rgba(32, 34, 37, 0.6);
```

### Componentes Reutilizáveis

#### Card Base
```tsx
<div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
  {/* Conteúdo */}
</div>
```

#### Botão Primário
```tsx
<button className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 py-3 rounded-lg font-semibold transition-colors">
  Texto
</button>
```

#### Badge de Status
```tsx
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
  Online
</span>
```

## 📡 APIs - Referência Completa

### Autenticação
Todas as APIs requerem autenticação via NextAuth session.

### Endpoints Disponíveis

#### 1. Servidores

**GET /api/servers**
```typescript
Response: {
  success: boolean;
  servers: Server[];
}
```

**POST /api/servers**
```typescript
Request: {
  name: string;
  maxPlayers?: number;
  password?: string;
  isPublic?: boolean;
}

Response: {
  success: boolean;
  server: Server;
}
```

#### 2. Chat Global

**GET /api/servers/[serverId]/chat**
```typescript
Response: {
  success: boolean;
  messages: ChatMessage[]; // Últimas 100 mensagens
}
```

**POST /api/servers/[serverId]/chat**
```typescript
Request: {
  message: string;
}

Response: {
  success: boolean;
  message: ChatMessage;
}
```

#### 3. Replays

**GET /api/servers/[serverId]/replays**
```typescript
Response: {
  success: boolean;
  replays: Replay[]; // Últimos 50 replays
}
```

#### 4. Admin Logs

**GET /api/servers/[serverId]/admin-logs**
```typescript
Response: {
  success: boolean;
  logs: AdminLog[]; // Últimos 100 logs
}
```

#### 5. Entradas

**GET /api/servers/[serverId]/entries**
```typescript
Response: {
  success: boolean;
  entries: PlayerEntry[]; // Últimas 100 entradas
}
```

#### 6. Denúncias

**GET /api/servers/[serverId]/reports**
```typescript
Response: {
  success: boolean;
  reports: Report[];
}
```

**PATCH /api/servers/[serverId]/reports**
```typescript
Request: {
  reportId: string;
  status: "pending" | "reviewed" | "resolved";
}

Response: {
  success: boolean;
  report: Report;
}
```

#### 7. Bans

**GET /api/servers/[serverId]/bans**
```typescript
Response: {
  success: boolean;
  bans: Ban[];
}
```

**POST /api/servers/[serverId]/bans**
```typescript
Request: {
  playerName: string;
  playerAuth?: string;
  playerIp?: string;
  reason?: string;
}

Response: {
  success: boolean;
  ban: Ban;
}
```

**DELETE /api/servers/[serverId]/bans**
```typescript
Request: {
  banId: string;
}

Response: {
  success: boolean;
  ban: Ban;
}
```

## 🔄 Auto-atualização (Polling)

Implementado sistema de polling para atualização em tempo real:

| Seção | Intervalo | Método |
|-------|-----------|--------|
| Chat Global | 5 segundos | `setInterval` |
| Entradas | 10 segundos | `setInterval` |
| Replays | Manual | Botão Atualizar |
| Admin Logs | Manual | Botão Atualizar |
| Denúncias | Manual | Botão Atualizar |
| Bans | Manual | Botão Atualizar |

**Exemplo de implementação:**
```typescript
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval);
}, [serverId]);
```

## 🚀 Como Usar

### Para Usuários Finais

1. **Fazer Login**
   - Acesse `/login`
   - Use suas credenciais ou Discord OAuth

2. **Acessar Dashboard**
   - Click em "Meu Painel" no header
   - Ou acesse diretamente `/dashboard`

3. **Selecionar Servidor**
   - Click no ícone do servidor na sidebar esquerda
   - Servidor ativo fica em destaque

4. **Navegar pelos Canais**
   - Click no canal desejado na sidebar central
   - Conteúdo atualiza automaticamente

### Para Desenvolvedores

#### Adicionar Novo Canal

1. **Adicione no array de canais:**
```typescript
const channels = [
  // ... canais existentes
  { id: "novo-canal", name: "novo-canal", category: "categoria" },
];
```

2. **Crie o componente:**
```typescript
function NovoCanalSection({ serverId }: { serverId: string }) {
  // Sua implementação
  return <div>Conteúdo do canal</div>;
}
```

3. **Adicione no renderChannelContent:**
```typescript
case "novo-canal":
  return <NovoCanalSection serverId={server.id} />;
```

4. **Crie a API (se necessário):**
```typescript
// app/api/servers/[serverId]/novo-canal/route.ts
export async function GET(request, { params }) {
  // Implementação
}
```

#### Adicionar Ícone Customizado

```typescript
const channelIcons: Record<string, string> = {
  // ... ícones existentes
  "novo-canal": "🆕",
};
```

## 🔒 Segurança

### Verificações Implementadas

1. **Autenticação Obrigatória**
   - Todas as páginas verificam sessão
   - Redirect automático para login

2. **Autorização por Servidor**
   - Usuário só vê seus próprios servidores
   - APIs verificam ownership

3. **Validação de Dados**
   - Inputs sanitizados
   - Verificação de tipos
   - Tratamento de erros

### Exemplo de Verificação:
```typescript
const server = await prisma.server.findFirst({
  where: {
    id: serverId,
    userId: session.user.id, // ✅ Verifica ownership
  },
});

if (!server) {
  return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
}
```

## 📱 Responsividade

O dashboard é totalmente responsivo:

- **Desktop (>1024px)**: Layout completo com 3 colunas
- **Tablet (768-1024px)**: Sidebar colapsável
- **Mobile (<768px)**: Menu hamburger (a implementar)

## 🐛 Troubleshooting

### Problema: Dados não carregam

**Solução:**
1. Verifique console do navegador (F12)
2. Confirme que está logado
3. Verifique se o servidor existe e pertence a você
4. Teste a API diretamente no Postman

### Problema: Erro 401 (Não autenticado)

**Solução:**
1. Faça logout e login novamente
2. Limpe cookies do navegador
3. Verifique variáveis de ambiente do NextAuth

### Problema: Servidor não aparece

**Solução:**
1. Verifique se o servidor foi criado corretamente
2. Execute `npm run db:studio` para ver o banco
3. Confirme que o `userId` corresponde ao seu usuário

## 🎯 Próximos Passos

### Fase 2: Integrações
- [ ] Discord Bot para comunicação real
- [ ] WebSocket para updates instantâneos
- [ ] Upload de replays para storage
- [ ] Sistema de notificações push

### Fase 3: Features Avançadas
- [ ] Gráficos e estatísticas avançadas
- [ ] Sistema de ranking completo
- [ ] Gerenciamento de times
- [ ] Agendamento de partidas

### Fase 4: Pagamento
- [ ] Integração Stripe/Mercado Pago
- [ ] Checkout de planos
- [ ] Gerenciamento de assinaturas
- [ ] Histórico de pagamentos

## 📞 Suporte

Encontrou algum problema ou tem sugestões?
- Discord: [HaxHost Community](https://discord.gg/tVWmwXjjWx)
- Email: suporte@haxhost.com

---

**Desenvolvido com ❤️ por Billy - HaxHost © 2024**

