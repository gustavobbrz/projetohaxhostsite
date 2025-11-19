# 🚀 FASE 6 + 7: PROVISIONAMENTO AUTOMÁTICO - IMPLEMENTAÇÃO COMPLETA

**Branch:** `feature/provisioning-and-dash-controls`  
**Status:** 🔴 EM IMPLEMENTAÇÃO  
**Data:** 13 de Novembro de 2025

---

## ✅ JÁ IMPLEMENTADO

### 1. Schema Prisma Atualizado
- ✅ Model `ServerAdmin` criado
- ✅ Campos adicionados ao `Server`:
  - `map`, `token`, `tokenEncrypted`
  - `playerCount`, `lastStatusUpdate`
  - `needsProvision` (boolean)
  - `pm2ProcessName` com `@unique`

### 2. Bibliotecas e Utilitários
- ✅ `lib/crypto/encryption.ts` - Criptografia AES-256-GCM
- ✅ `lib/ssh/client.ts` - Cliente SSH completo com node-ssh
- ✅ `lib/provisioning/server-provisioner.ts` - Lógica de provisionamento

### 3. Templates
- ✅ `templates/ecosystem.config.template.js` - Template PM2
- ✅ `templates/haxball-server.template.js` - Script Haxball simplificado

---

## 🔧 PRÓXIMOS PASSOS (A IMPLEMENTAR)

### PASSO 3: Criar Endpoints de API

Preciso criar os seguintes endpoints. Vou fornecer o código completo de cada um:

---

## 📁 ARQUIVO: `app/api/servers/[serverId]/provision/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { provisionServer } from "@/lib/provisioning/server-provisioner";

const prisma = new PrismaClient();

/**
 * POST /api/servers/[serverId]/provision
 * 
 * Provisiona um servidor Haxball na EC2
 * 
 * Body (opcional): { token?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    // 1. Autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Verificar permissão
    const server = await prisma.server.findUnique({
      where: { id: params.serverId },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sem permissão para provisionar este servidor" },
        { status: 403 }
      );
    }

    // 3. Verificar plano ativo
    if (server.subscriptionStatus !== "active") {
      return NextResponse.json(
        {
          error: "Plano inativo",
          message: "Seu plano precisa estar ativo para provisionar servidores",
        },
        { status: 402 }
      );
    }

    // 4. Parse body
    const body = await request.json().catch(() => ({}));
    const token = body.token;

    // 5. Provisionar
    const result = await provisionServer({
      serverId: params.serverId,
      token: token,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Erro no provisionamento",
          message: result.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      processName: result.processName,
      roomLink: result.roomLink,
    });
  } catch (error: any) {
    console.error("[API] Erro no provisionamento:", error);
    return NextResponse.json(
      {
        error: "Erro interno",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## 📁 ARQUIVO: `app/api/servers/[serverId]/admins/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/crypto/encryption";

const prisma = new PrismaClient();

/**
 * GET /api/servers/[serverId]/admins
 * Lista admins do servidor (retorna sem hashes por segurança)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const server = await prisma.server.findUnique({
      where: { id: params.serverId },
    });

    if (!server || server.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const admins = await prisma.serverAdmin.findMany({
      where: { serverId: params.serverId },
      select: {
        id: true,
        label: true,
        isActive: true,
        createdAt: true,
        // NÃO retornar adminHash
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ admins });
  } catch (error: any) {
    console.error("[API] Erro ao listar admins:", error);
    return NextResponse.json(
      { error: "Erro interno", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/servers/[serverId]/admins
 * Adiciona um admin
 * 
 * Body: { password: string, label?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const server = await prisma.server.findUnique({
      where: { id: params.serverId },
    });

    if (!server || server.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { password, label } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    // Hash da senha
    const adminHash = await hashPassword(password);

    // Criar admin
    const admin = await prisma.serverAdmin.create({
      data: {
        serverId: params.serverId,
        label: label || "Admin",
        adminHash: adminHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin adicionado com sucesso",
      admin: {
        id: admin.id,
        label: admin.label,
        createdAt: admin.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[API] Erro ao adicionar admin:", error);
    return NextResponse.json(
      { error: "Erro interno", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## 📁 ARQUIVO: `app/api/servers/[serverId]/admins/[adminId]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * DELETE /api/servers/[serverId]/admins/[adminId]
 * Remove um admin
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { serverId: string; adminId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const server = await prisma.server.findUnique({
      where: { id: params.serverId },
    });

    if (!server || server.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const admin = await prisma.serverAdmin.findUnique({
      where: { id: params.adminId },
    });

    if (!admin || admin.serverId !== params.serverId) {
      return NextResponse.json({ error: "Admin não encontrado" }, { status: 404 });
    }

    await prisma.serverAdmin.delete({
      where: { id: params.adminId },
    });

    return NextResponse.json({
      success: true,
      message: "Admin removido com sucesso",
    });
  } catch (error: any) {
    console.error("[API] Erro ao remover admin:", error);
    return NextResponse.json(
      { error: "Erro interno", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PATCH /api/servers/[serverId]/admins/[adminId]
 * Atualiza label ou ativa/desativa admin
 * 
 * Body: { label?: string, isActive?: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { serverId: string; adminId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const server = await prisma.server.findUnique({
      where: { id: params.serverId },
    });

    if (!server || server.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { label, isActive } = body;

    const admin = await prisma.serverAdmin.update({
      where: { id: params.adminId },
      data: {
        ...(label !== undefined && { label }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin atualizado",
      admin: {
        id: admin.id,
        label: admin.label,
        isActive: admin.isActive,
      },
    });
  } catch (error: any) {
    console.error("[API] Erro ao atualizar admin:", error);
    return NextResponse.json(
      { error: "Erro interno", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## 📁 ATUALIZAR: `app/api/servers/[serverId]/control/route.ts`

Substituir TODO o conteúdo por:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { createSSHClient } from "@/lib/ssh/client";
import { restartServerWithConfig } from "@/lib/provisioning/server-provisioner";

const prisma = new PrismaClient();

/**
 * POST /api/servers/[serverId]/control
 * 
 * Controla servidor: start, stop, restart
 * 
 * Body: { 
 *   action: "start" | "stop" | "restart",
 *   token?: string (para restart com novo token)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { serverId: string } }
) {
  let sshClient = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const server = await prisma.server.findUnique({
      where: { id: params.serverId },
    });

    if (!server || server.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { action, token } = body;

    if (!["start", "stop", "restart"].includes(action)) {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    // Se não tem PM2 ou precisa provision, redirecionar
    if (!server.pm2ProcessName || server.needsProvision) {
      return NextResponse.json(
        {
          error: "Servidor precisa ser provisionado primeiro",
          needsProvision: true,
        },
        { status: 400 }
      );
    }

    // Se restart com novo token, usar provisionamento inteligente
    if (action === "restart" && token) {
      const result = await restartServerWithConfig(params.serverId, { token });
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error, message: result.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        action: "restart_with_token",
      });
    }

    // Controle PM2 padrão
    sshClient = await createSSHClient();

    let output = "";
    
    switch (action) {
      case "start":
        output = await sshClient.pm2Start(
          server.pm2ProcessName,
          `/home/ubuntu/haxball-servers/${server.id}/index.js`,
          `/home/ubuntu/haxball-servers/${server.id}`
        );
        break;
      
      case "stop":
        output = await sshClient.pm2Stop(server.pm2ProcessName);
        break;
      
      case "restart":
        output = await sshClient.pm2Restart(server.pm2ProcessName, false);
        break;
    }

    // Verificar status após ação
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const processInfo = await sshClient.pm2Show(server.pm2ProcessName);

    // Atualizar DB
    await prisma.server.update({
      where: { id: server.id },
      data: {
        status: processInfo?.status === "online" ? "active" : "inactive",
        lastStatusUpdate: new Date(),
      },
    });

    // Log
    await prisma.adminLog.create({
      data: {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        serverId: server.id,
        action: `SERVER_${action.toUpperCase()}`,
        adminName: session.user.name || session.user.email || "User",
        reason: `Controle via dashboard`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Servidor ${action} executado com sucesso`,
      action,
      status: processInfo?.status,
      pm2Output: output,
    });
  } catch (error: any) {
    console.error("[API] Erro no controle:", error);
    return NextResponse.json(
      { error: "Erro ao executar ação", details: error.message },
      { status: 500 }
    );
  } finally {
    if (sshClient) {
      sshClient.disconnect();
    }
    await prisma.$disconnect();
  }
}
```

---

## 📁 CRIAR: `app/api/servers/[serverId]/config/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { restartServerWithConfig } from "@/lib/provisioning/server-provisioner";

const prisma = new PrismaClient();

/**
 * PATCH /api/servers/[serverId]/config
 * 
 * Atualiza configuração do servidor
 * 
 * Body: {
 *   name?: string,
 *   map?: string,
 *   maxPlayers?: number,
 *   password?: string,
 *   isPublic?: boolean,
 *   restart?: boolean (se true, reinicia com novas configs)
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const server = await prisma.server.findUnique({
      where: { id: params.serverId },
    });

    if (!server || server.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { restart, ...updates } = body;

    // Validações
    if (updates.name && (updates.name.length < 1 || updates.name.length > 64)) {
      return NextResponse.json(
        { error: "Nome deve ter entre 1 e 64 caracteres" },
        { status: 400 }
      );
    }

    if (updates.maxPlayers && (updates.maxPlayers < 2 || updates.maxPlayers > 50)) {
      return NextResponse.json(
        { error: "Max players deve estar entre 2 e 50" },
        { status: 400 }
      );
    }

    // Se restart = true, usar provisionamento inteligente
    if (restart && server.pm2ProcessName) {
      const result = await restartServerWithConfig(params.serverId, updates);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error, message: result.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Configuração atualizada e servidor reiniciado",
        restarted: true,
      });
    }

    // Apenas salvar no DB (sem restart)
    const updatedServer = await prisma.server.update({
      where: { id: params.serverId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configuração atualizada (reinicie o servidor para aplicar)",
      server: {
        id: updatedServer.id,
        name: updatedServer.name,
        map: updatedServer.map,
        maxPlayers: updatedServer.maxPlayers,
        isPublic: updatedServer.isPublic,
      },
    });
  } catch (error: any) {
    console.error("[API] Erro ao atualizar config:", error);
    return NextResponse.json(
      { error: "Erro interno", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## 📁 CRIAR: `app/api/servers/[serverId]/replays/[replayId]/download/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { createSSHClient } from "@/lib/ssh/client";

const prisma = new PrismaClient();

/**
 * GET /api/servers/[serverId]/replays/[replayId]/download
 * 
 * Baixa um replay (streaming)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { serverId: string; replayId: string } }
) {
  let sshClient = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const server = await prisma.server.findUnique({
      where: { id: params.serverId },
    });

    if (!server || server.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const replay = await prisma.replay.findUnique({
      where: { id: params.replayId },
    });

    if (!replay || replay.serverId !== params.serverId) {
      return NextResponse.json({ error: "Replay não encontrado" }, { status: 404 });
    }

    // Se tem fileUrl, redirecionar
    if (replay.fileUrl) {
      return NextResponse.redirect(replay.fileUrl);
    }

    // TODO: Se tem fileData no DB (Bytes), retornar como stream
    // Por ora, retornar erro solicitando S3

    return NextResponse.json(
      {
        error: "Download não disponível",
        message: "Este replay precisa ser migrado para S3/CloudFlare R2",
        todo: "Implementar signed URLs",
      },
      { status: 501 }
    );
  } catch (error: any) {
    console.error("[API] Erro no download:", error);
    return NextResponse.json(
      { error: "Erro interno", details: error.message },
      { status: 500 }
    );
  } finally {
    if (sshClient) {
      sshClient.disconnect();
    }
    await prisma.$disconnect();
  }
}
```

---

## 🧪 SMOKE TEST SCRIPT

Criar `scripts/smoke-test.sh`:

```bash
#!/bin/bash

# Smoke Test para Provisionamento Automático
# Testa os endpoints principais

set -e

BASE_URL="${HAXHOST_URL:-http://localhost:3000}"
AUTH_TOKEN="${TEST_AUTH_TOKEN:-}"

echo "🧪 SMOKE TEST - Provisionamento Automático"
echo "URL: $BASE_URL"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Função de teste
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  
  echo -n "Testing $method $endpoint... "
  
  response=$(curl -s -w "\n%{http_code}" \
    -X "$method" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "$data" \
    "$BASE_URL$endpoint")
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$status_code" == "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
    echo "Response: $body"
    return 1
  fi
}

# 1. Criar servidor
echo "📝 1. Criando servidor de teste..."
SERVER_ID=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"name":"⚽ Teste Smoke","map":"Big","maxPlayers":16}' \
  "$BASE_URL/api/servers" | jq -r '.server.id')

if [ "$SERVER_ID" == "null" ] || [ -z "$SERVER_ID" ]; then
  echo -e "${RED}✗ Falha ao criar servidor${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Servidor criado: $SERVER_ID${NC}"
echo ""

# 2. Adicionar admin
echo "👑 2. Adicionando admin..."
test_endpoint POST "/api/servers/$SERVER_ID/admins" \
  '{"password":"testadmin123","label":"Test Admin"}' \
  200

# 3. Provisionar
echo "🚀 3. Provisionando servidor..."
test_endpoint POST "/api/servers/$SERVER_ID/provision" \
  '{"token":"thr1.TEST123456789ABCDEF.1234567890ABCDEF"}' \
  200

# 4. Aguardar 5s
echo "⏳ Aguardando 5s para PM2 iniciar..."
sleep 5

# 5. Verificar status
echo "📊 4. Verificando status..."
test_endpoint GET "/api/servers/$SERVER_ID" "" 200

# 6. Atualizar config
echo "⚙️ 5. Atualizando configuração..."
test_endpoint PATCH "/api/servers/$SERVER_ID/config" \
  '{"name":"⚽ Teste Atualizado","maxPlayers":20,"restart":false}' \
  200

# 7. Restart
echo "🔄 6. Testando restart..."
test_endpoint POST "/api/servers/$SERVER_ID/control" \
  '{"action":"restart"}' \
  200

# 8. Listar admins
echo "👥 7. Listando admins..."
test_endpoint GET "/api/servers/$SERVER_ID/admins" "" 200

# 9. Listar replays
echo "🎬 8. Listando replays..."
test_endpoint GET "/api/servers/$SERVER_ID/replays" "" 200

# Cleanup
echo ""
echo "🧹 Limpeza (opcional - descomente para deletar)..."
# test_endpoint DELETE "/api/servers/$SERVER_ID" "" 200

echo ""
echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
```

Tornar executável:
```bash
chmod +x scripts/smoke-test.sh
```

---

## 📦 DEPENDÊNCIAS A INSTALAR

Adicionar ao `package.json`:

```bash
npm install node-ssh bcrypt
npm install --save-dev @types/bcrypt
```

---

## 🔐 VARIÁVEIS DE AMBIENTE

Adicionar ao `.env.local`:

```env
# SSH Configuration
SSH_HOST=ip-172-31-11-176.ec2.internal
SSH_PORT=22
SSH_USER=ubuntu
SSH_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...sua chave aqui...
-----END RSA PRIVATE KEY-----"

# Encryption
TOKEN_ENCRYPT_KEY="your-32-character-minimum-secret-key-here"

# HaxHost API URL (production)
HAXHOST_API_URL=http://localhost:3000

# Rate Limiting (opcional)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Backend
- [x] Schema Prisma atualizado
- [x] Lib crypto/encryption
- [x] Lib ssh/client
- [x] Lib provisioning/server-provisioner
- [x] Templates criados
- [ ] Endpoint provision
- [ ] Endpoint admins CRUD
- [ ] Endpoint control atualizado
- [ ] Endpoint config
- [ ] Endpoint download replay

### Frontend
- [ ] Formulário de criação/edição no dashboard
- [ ] Gerenciador de admins (adicionar/remover)
- [ ] Botão "Provisionar"
- [ ] Botão "Salvar e Reiniciar"
- [ ] Input de token com visibility toggle
- [ ] Dropdown de mapas
- [ ] Campo de nome com suporte a emoji

### Scripts
- [x] smoke-test.sh criado
- [ ] Postman collection
- [ ] README atualizado

### Documentação
- [ ] .env.example atualizado
- [ ] README com setup EC2
- [ ] Guia de troubleshooting

---

## 🚀 PRÓXIMOS ARQUIVOS A CRIAR

1. Criar pastas dos endpoints
2. Implementar cada endpoint listado acima
3. Atualizar dashboard com formulários
4. Criar migration Prisma
5. Testar localmente

Continuar implementação? Devo criar os endpoints agora?

