# 🌐 SISTEMA MULTI-HOST - HaxHost

**Data:** 18 de Novembro de 2025  
**Status:** ✅ IMPLEMENTADO

---

## 📋 SUMÁRIO

Este documento descreve a implementação do sistema de **múltiplos hosts EC2** para o HaxHost, permitindo distribuir automaticamente os servidores Haxball entre 3 EC2s.

---

## 🎯 OBJETIVO

Transformar o sistema de single-host (1 EC2) em **multi-host (3 EC2s)**, com:

- **Load balancing automático**: Novos servidores são criados no host com menos carga
- **Gestão centralizada**: Arquivo `config/hosts.json` define todas as EC2s
- **Conexão SSH dinâmica**: Cada operação conecta automaticamente na EC2 correta
- **Rastreamento no banco**: Campo `hostName` no modelo `Server` identifica onde o servidor está

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

### ✅ Arquivos Criados

1. **`config/hosts.json`** - Configuração dos 3 hosts
2. **`lib/hosts.ts`** - Helper para gerenciar hosts (getAllHosts, getAvailableHost, etc.)
3. **`MULTI_HOST_SETUP.md`** - Este documento

### ✅ Arquivos Modificados

1. **`prisma/schema.prisma`** - Adicionado campo `hostName` ao modelo `Server`
2. **`lib/ssh/client.ts`** - Suporte a múltiplos hosts via `hostName`
3. **`lib/provisioning/server-provisioner.ts`** - Usa `hostName` para SSH
4. **`app/api/servers/route.ts`** - POST atribui host automaticamente
5. **`app/api/servers/[serverId]/control/route.ts`** - Executa PM2 via SSH no host correto

---

## 🔧 CONFIGURAÇÃO

### 1. Arquivo `config/hosts.json`

```json
{
  "hosts": [
    {
      "name": "azzura",
      "ip": "18.231.184.163",
      "ssh_user": "ubuntu",
      "ssh_private_key_path": "~/.ssh/billyhax.pem",
      "base_path": "/home/ubuntu/meu-servidor-haxball",
      "ssh_port": 22
    },
    {
      "name": "sv1",
      "ip": "18.230.17.55",
      "ssh_user": "ubuntu",
      "ssh_private_key_path": "~/.ssh/haxhost.pem",
      "base_path": "/home/ubuntu/meu-servidor-haxball",
      "ssh_port": 22
    },
    {
      "name": "sv2",
      "ip": "18.230.122.222",
      "ssh_user": "ubuntu",
      "ssh_private_key_path": "~/.ssh/haxhost.pem",
      "base_path": "/home/ubuntu/meu-servidor-haxball",
      "ssh_port": 22
    }
  ],
  "pm2_process_template_name": "haxball-server",
  "max_rooms_per_host": 2
}
```

**Importante:**

- As chaves SSH (`~/.ssh/billyhax.pem` e `~/.ssh/haxhost.pem`) **devem existir** na máquina que roda o Next.js
- Permissões das chaves: `chmod 400 ~/.ssh/*.pem`
- O caminho `~` é expandido automaticamente para `/home/usuario` pelo helper `expandKeyPath()`

### 2. Banco de Dados (Prisma)

```prisma
model Server {
  // ... outros campos ...
  hostName String? // Nome do host (azzura, sv1, sv2)
}
```

**Sincronização:**

```bash
npx prisma generate
npx prisma db push
```

---

## 🚀 COMO FUNCIONA

### 1️⃣ Criação de Servidor (POST /api/servers)

```typescript
// Fluxo:
// 1. Usuário cria servidor via dashboard
const availableHost = await getAvailableHost();
// 2. Sistema busca host com MENOS servidores ativos
// 3. Atribui automaticamente ao servidor

await prisma.server.create({
  data: {
    hostName: availableHost.name, // "azzura", "sv1" ou "sv2"
    // ... outros campos
  },
});

// Retorna: { server, host: { name: "azzura", ip: "18.231.184.163" } }
```

**Estratégia de Load Balancing:**

- Conta quantos servidores `active` ou `pending` cada host tem
- Retorna o host com **menor contagem**
- Se todos atingirem `max_rooms_per_host` (2), retorna `503 Service Unavailable`

### 2️⃣ Provisionamento (lib/provisioning/server-provisioner.ts)

```typescript
// Fluxo:
// 1. Busca o hostName do servidor no banco
const host = await getHostForServer(serverId);

// 2. Conecta via SSH no host correto
const sshClient = await createSSHClient(undefined, host.name);

// 3. Envia arquivos (ecosystem.config.js, index.js, package.json)
await sshClient.provisionServer(serverId, files, pm2ProcessName);

// 4. Inicia PM2 na EC2
await sshClient.pm2StartEcosystem(ecosystemPath, processName);
```

### 3️⃣ Controle (POST /api/servers/[id]/control)

```typescript
// Fluxo:
// 1. Busca host do servidor
const host = await getHostForServer(serverId);

// 2. Conecta via SSH
const sshClient = await createSSHClient(undefined, host.name);

// 3. Executa comando PM2
await sshClient.pm2Restart(pm2ProcessName);

// 4. Desconecta SSH
sshClient.disconnect();
```

---

## 📊 HELPERS (`lib/hosts.ts`)

### `getAllHosts(): HostConfig[]`

Retorna todos os hosts configurados em `config/hosts.json`.

### `getHostByName(name: string): HostConfig | null`

Busca um host específico pelo nome (ex: `"azzura"`).

### `getAvailableHost(): Promise<HostConfig | null>`

**Load balancing:** Retorna o host com **menos servidores ativos**.

- Conta servidores com `status = "active" | "pending"`
- Retorna host com menor contagem
- Se todos atingirem `max_rooms_per_host`, retorna `null`

### `getHostForServer(serverId: string): Promise<HostConfig | null>`

Busca no banco o `hostName` do servidor e retorna o `HostConfig` correspondente.

### `readSSHKey(host: HostConfig): string`

Lê o conteúdo da chave privada SSH do host.

- Expande `~` para home dir
- Valida se arquivo existe
- Retorna conteúdo da chave

### `validateHosts(): { valid: boolean; errors: string[] }`

Valida se **todas as chaves SSH existem e são legíveis**.

**Uso:**

```typescript
const validation = validateHosts();
if (!validation.valid) {
  console.error("Erros:", validation.errors);
}
```

### `getHostsStats(): Promise<Array<...>>`

Retorna estatísticas de uso de todos os hosts:

```typescript
[
  {
    name: "azzura",
    ip: "18.231.184.163",
    activeServers: 1,
    maxServers: 2,
    usage: 50,
  },
  // ... sv1, sv2
];
```

---

## 🧪 TESTES LOCAIS

### 1. Validar Hosts

```bash
node -e "const { validateHosts } = require('./lib/hosts.ts'); console.log(validateHosts());"
```

### 2. Criar Servidor

```bash
curl -X POST http://localhost:3000/api/servers \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN" \
  -d '{"name":"Teste Multi-Host","maxPlayers":20,"isPublic":true}'
```

**Resposta esperada:**

```json
{
  "success": true,
  "server": {
    "id": "...",
    "hostName": "azzura",
    ...
  },
  "host": {
    "name": "azzura",
    "ip": "18.231.184.163"
  }
}
```

### 3. Controlar Servidor

```bash
curl -X POST http://localhost:3000/api/servers/{serverId}/control \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN" \
  -d '{"action":"restart"}'
```

**Resposta esperada:**

```json
{
  "success": true,
  "message": "Servidor reiniciado com sucesso",
  "action": "restart",
  "host": "azzura",
  "timestamp": "2025-11-18T..."
}
```

---

## 🔒 SEGURANÇA

### Chaves SSH

- **Nunca commitar** as chaves no Git
- Permissões corretas: `chmod 400 ~/.ssh/*.pem`
- As chaves ficam **fora do projeto** (em `~/.ssh/`)

### Config Hosts

- `config/hosts.json` contém apenas **metadados**
- Não contém senhas ou chaves privadas
- IPs públicos são OK (já estão expostos na AWS)

### Validação

- `getAvailableHost()` respeita `max_rooms_per_host`
- `getHostForServer()` valida existência do host
- Todos os endpoints validam `session.user.id`

---

## 📈 ESCALABILIDADE

### Adicionar Novo Host

1. **Adicionar em `config/hosts.json`:**

```json
{
  "name": "sv3",
  "ip": "18.230.XXX.XXX",
  "ssh_user": "ubuntu",
  "ssh_private_key_path": "~/.ssh/haxhost.pem",
  "base_path": "/home/ubuntu/meu-servidor-haxball",
  "ssh_port": 22
}
```

2. **Reiniciar Next.js:**

```bash
npm run dev
```

3. **Validar:**

```bash
node -e "const { getAllHosts } = require('./lib/hosts'); console.log(getAllHosts().length);"
# Deve retornar 4
```

### Aumentar Limite por Host

Editar `config/hosts.json`:

```json
{
  "max_rooms_per_host": 5 // Era 2, agora 5
}
```

### Migrar Servidor entre Hosts

**Manualmente (banco):**

```sql
UPDATE "Server"
SET "hostName" = 'sv2'
WHERE id = 'server-id-aqui';
```

**Depois:**

- Parar processo PM2 no host antigo
- Provisionar novamente (`POST /api/servers/:id/provision`)

---

## 🐛 TROUBLESHOOTING

### Erro: "Host 'azzura' não encontrado"

**Causa:** `config/hosts.json` não existe ou host não está configurado.

**Solução:**

1. Verificar se arquivo existe: `ls -la config/hosts.json`
2. Validar JSON: `cat config/hosts.json | jq .`
3. Verificar nome do host no banco: `SELECT "hostName" FROM "Server";`

### Erro: "Chave SSH não encontrada"

**Causa:** Caminho da chave inválido ou arquivo não existe.

**Solução:**

1. Verificar chaves: `ls -la ~/.ssh/*.pem`
2. Verificar permissões: `chmod 400 ~/.ssh/*.pem`
3. Testar conexão manual:

```bash
ssh -i ~/.ssh/billyhax.pem ubuntu@18.231.184.163
```

### Erro: "Todos os hosts no limite"

**Causa:** Todos os hosts atingiram `max_rooms_per_host`.

**Solução:**

1. Aumentar `max_rooms_per_host` em `hosts.json`
2. Adicionar novo host
3. Deletar servidores inativos

### Erro: "Servidor não tem host atribuído"

**Causa:** Servidor criado antes da implementação multi-host.

**Solução:**

```sql
UPDATE "Server"
SET "hostName" = 'azzura'
WHERE "hostName" IS NULL;
```

---

## 📝 CHANGELOG

### v1.0.0 - 18/11/2025

- ✅ Implementação inicial multi-host
- ✅ Load balancing automático
- ✅ SSH dinâmico por host
- ✅ Helpers de gerenciamento
- ✅ Migração de schema Prisma
- ✅ Atualização de APIs

---

## 🚧 PRÓXIMOS PASSOS (Opcional)

- [ ] Dashboard para visualizar distribuição de servidores por host
- [ ] Endpoint para forçar host específico (`POST /api/servers { "hostName": "sv2" }`)
- [ ] Health check automático dos hosts (ping/SSH)
- [ ] Migração automática de servidores entre hosts
- [ ] Logs centralizados de SSH/PM2
- [ ] Metrics de uso (CPU, RAM, uptime) via worker.js

---

**Desenvolvido por:** Cursor AI + Claude Sonnet 4.5  
**Data:** 18 de Novembro de 2025  
**Versão:** 1.0.0
