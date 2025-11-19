# 🚀 HaxHost - Provisionamento Automático

## 📖 Guia Completo de Setup

Este documento detalha como configurar o provisionamento automático de servidores Haxball na EC2.

---

## 🎯 VISÃO GERAL

O sistema de provisionamento permite que clientes:
- Criem servidores Haxball pela dashboard
- Configurem nome (com emoji), mapa, max players, senha
- Gerenciem senhas de admin
- Controlem o servidor (start/stop/restart) remotamente
- Atualizem token Haxball sem acesso SSH

### Arquitetura

```
[Cliente no Dashboard]
         ↓
   [Next.js API]
         ↓
   [SSH via node-ssh]
         ↓
   [EC2 Ubuntu + PM2]
         ↓
   [Haxball Server]
```

---

## ⚙️ PRÉ-REQUISITOS

### 1. EC2 Setup

Sua EC2 precisa ter:

- ✅ Ubuntu 20.04 LTS ou superior
- ✅ Node.js 18+ instalado
- ✅ PM2 instalado globalmente
- ✅ SSH habilitado na porta 22
- ✅ Security Group permitindo SSH do IP do Next.js

### 2. Next.js Server

- ✅ Node.js 18+
- ✅ Pacotes: `node-ssh`, `bcrypt`
- ✅ Chave SSH privada da EC2

---

## 🔧 INSTALAÇÃO

### Passo 1: Instalar Dependências

```bash
cd /home/loy-operacao/WebstormProjects/projetohaxhostsite

# Instalar node-ssh e bcrypt
npm install node-ssh bcrypt

# Instalar tipos TypeScript
npm install --save-dev @types/bcrypt
```

### Passo 2: Configurar EC2

**SSH na EC2:**

```bash
ssh -i /path/to/key.pem ubuntu@seu-ip-ec2
```

**Instalar Node.js (se não tiver):**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # Verificar versão
```

**Instalar PM2:**

```bash
sudo npm install -g pm2
pm2 -v  # Verificar versão
```

**Configurar PM2 Startup:**

```bash
pm2 startup
# Copiar e executar o comando gerado
```

**Criar pasta de servidores:**

```bash
mkdir -p /home/ubuntu/haxball-servers
chmod 755 /home/ubuntu/haxball-servers
```

### Passo 3: Obter Chave SSH

**Se já tem a chave (.pem):**

```bash
cat /path/to/key.pem
```

**Se precisa gerar nova chave (na EC2):**

```bash
# Na EC2
ssh-keygen -t rsa -b 4096 -f ~/.ssh/haxhost_key
cat ~/.ssh/haxhost_key  # Chave privada
cat ~/.ssh/haxhost_key.pub  # Chave pública

# Adicionar chave pública ao authorized_keys
cat ~/.ssh/haxhost_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Passo 4: Configurar .env.local

Criar/editar `.env.local` no projeto Next.js:

```env
# ============================================
# SSH Configuration
# ============================================

# IP ou hostname da EC2
SSH_HOST=ip-172-31-11-176.ec2.internal
# OU usar IP público:
# SSH_HOST=54.123.45.67

# Porta SSH (padrão 22)
SSH_PORT=22

# Usuário SSH (geralmente ubuntu)
SSH_USER=ubuntu

# Chave privada SSH (TODA a chave, incluindo BEGIN/END)
SSH_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAxxxxxxxxxxxxxxxxxxxxx...
...cole a chave completa aqui...
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END RSA PRIVATE KEY-----"

# ============================================
# Encryption
# ============================================

# Chave de criptografia (gere com: openssl rand -base64 32)
TOKEN_ENCRYPT_KEY="$(openssl rand -base64 32)"
# Ou defina manualmente (mínimo 32 caracteres):
# TOKEN_ENCRYPT_KEY="minha-chave-super-secreta-de-32-chars-ou-mais"

# ============================================
# HaxHost API
# ============================================

# URL da API (use HTTPS em produção!)
HAXHOST_API_URL=http://localhost:3000
# Produção:
# HAXHOST_API_URL=https://haxhost.com.br

# Webhook secret (mesmo do script Haxball)
HAXBALL_WEBHOOK_SECRET=haxhost-secret-2024

# ============================================
# PostgreSQL (Vercel Postgres)
# ============================================
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# ============================================
# NextAuth
# ============================================
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Passo 5: Aplicar Migration Prisma

```bash
# Gerar migration
npx prisma migrate dev --name add_provisioning_fields

# Gerar Prisma Client
npx prisma generate
```

### Passo 6: Testar Conexão SSH

```bash
# Testar conexão manualmente
ssh -i /path/to/key.pem ubuntu@SEU_HOST "pm2 list"

# Deve retornar a lista de processos PM2
```

---

## 🧪 TESTES

### Teste Rápido (curl)

```bash
# 1. Criar servidor
curl -X POST http://localhost:3000/api/servers \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "⚽ Test Server",
    "map": "Big",
    "maxPlayers": 16
  }'

# Anotar o SERVER_ID retornado

# 2. Provisionar
curl -X POST http://localhost:3000/api/servers/SERVER_ID/provision \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "thr1.TESTTOKEN.123456"}'

# 3. Verificar na EC2
ssh ubuntu@SEU_HOST "pm2 list"
```

### Smoke Test Completo

```bash
# Configurar token
export TEST_AUTH_TOKEN="seu-token-jwt-aqui"

# Executar
./scripts/smoke-test.sh
```

---

## 📁 ESTRUTURA DE ARQUIVOS NA EC2

Após provisionamento, a estrutura na EC2 será:

```
/home/ubuntu/haxball-servers/
├── server-abc123/
│   ├── ecosystem.config.js   # Config PM2
│   ├── index.js               # Script Haxball
│   ├── package.json           # Dependencies
│   ├── node_modules/          # Installed packages
│   └── logs/
│       ├── error.log
│       └── out.log
├── server-def456/
│   └── ...
```

---

## 🎮 USO DA DASHBOARD

### Criar Servidor

1. Login na dashboard
2. Clicar em "Criar Novo Servidor"
3. Preencher:
   - Nome (com emoji se quiser)
   - Mapa (Big, Bazinga, etc.)
   - Max Players (2-50)
   - Senha (opcional)
   - Público (checkbox)

### Provisionar

1. Após criar, clicar em "Provisionar"
2. (Opcional) Informar token Haxball
3. Aguardar 10-30 segundos
4. Status mudará para "Online"

### Gerenciar Admins

1. Aba "Configuração"
2. Seção "Gerenciar Admins"
3. Adicionar: informar label e senha
4. Remover: clicar no 🗑️

### Atualizar Configuração

1. Alterar campos desejados
2. **Salvar (sem reiniciar):** Apenas atualiza DB
3. **Salvar e Reiniciar:** Aplica mudanças no servidor rodando

### Controles

- **▶️ Iniciar:** `pm2 start`
- **⏹️ Parar:** `pm2 stop`
- **🔄 Reiniciar:** `pm2 restart`
- **🔄 + Token:** Reinicia com novo token

---

## 🔒 SEGURANÇA

### Tokens

- ✅ Tokens são criptografados com AES-256-GCM
- ✅ Senhas de admin usam bcrypt (salt rounds: 10)
- ✅ Chave SSH nunca é exposta no frontend
- ✅ Webhook usa autenticação via secret

### SSH

- ✅ Usa chave privada (não senha)
- ✅ Conexões são fechadas após cada operação
- ✅ Comandos são sanitizados (node-ssh faz escape automático)

### Rate Limiting (TODO)

Implementar rate limiting em:
- `/api/servers/[id]/provision` - 1 req / 10s
- `/api/servers/[id]/control` - 1 req / 5s
- `/api/servers/[id]/config` - 1 req / 10s

---

## 🐛 TROUBLESHOOTING

### Erro: "SSH Connection Failed"

**Sintomas:** Provisionamento falha com erro de conexão SSH.

**Soluções:**

1. **Verificar host:**
   ```bash
   ping SEU_HOST
   ssh ubuntu@SEU_HOST "echo test"
   ```

2. **Verificar Security Group:**
   - AWS Console → EC2 → Security Groups
   - Permitir SSH (porta 22) do IP do Next.js

3. **Verificar chave:**
   ```bash
   # Testar chave manualmente
   ssh -i /path/to/key.pem ubuntu@SEU_HOST
   ```

4. **Verificar .env.local:**
   - `SSH_HOST` correto?
   - `SSH_PRIVATE_KEY` completa (com BEGIN/END)?
   - `SSH_USER` correto (geralmente `ubuntu`)?

### Erro: "PM2 process not found"

**Sintomas:** Controles retornam "processo não encontrado".

**Soluções:**

1. **Verificar PM2:**
   ```bash
   ssh ubuntu@SEU_HOST "pm2 list"
   ```

2. **Verificar pm2ProcessName no DB:**
   - Abrir Prisma Studio: `npx prisma studio`
   - Verificar campo `pm2ProcessName` do servidor

3. **Reprovisionar:**
   - Clicar em "Provisionar" novamente na dashboard

### Erro: "Token Encryption Failed"

**Sintomas:** Erro ao salvar token.

**Soluções:**

1. **Verificar TOKEN_ENCRYPT_KEY:**
   ```bash
   cat .env.local | grep TOKEN_ENCRYPT_KEY
   ```

2. **Gerar nova chave:**
   ```bash
   openssl rand -base64 32
   ```

3. **Adicionar ao .env.local:**
   ```env
   TOKEN_ENCRYPT_KEY="<chave-gerada>"
   ```

4. **Reiniciar Next.js:**
   ```bash
   npm run dev
   ```

### Erro: "Server needs provision"

**Sintomas:** Controles não funcionam, diz "precisa provisionar".

**Soluções:**

1. **Clicar em "Provisionar"** na dashboard

2. **Verificar campo needsProvision:**
   - Prisma Studio → Servers
   - Se `needsProvision = true`, clicar provisionar

3. **Verificar PM2 na EC2:**
   ```bash
   ssh ubuntu@SEU_HOST "pm2 show haxball-server-<ID>"
   ```

### Script Haxball não inicia

**Sintomas:** PM2 mostra "errored" ou "stopped".

**Soluções:**

1. **Ver logs:**
   ```bash
   ssh ubuntu@SEU_HOST "pm2 logs haxball-server-<ID> --lines 50"
   ```

2. **Verificar dependências:**
   ```bash
   ssh ubuntu@SEU_HOST "cd /home/ubuntu/haxball-servers/<ID> && npm install"
   ```

3. **Verificar token:**
   - Token Haxball válido?
   - Formato: `thr1.XXXXXXXXX.YYYYYYYYY`

4. **Testar manualmente:**
   ```bash
   ssh ubuntu@SEU_HOST
   cd /home/ubuntu/haxball-servers/<ID>
   node index.js
   # Ver erros no console
   ```

---

## 📊 MONITORAMENTO

### Ver Status de Todos Servidores

```bash
ssh ubuntu@SEU_HOST "pm2 list"
```

### Ver Logs de Um Servidor

```bash
ssh ubuntu@SEU_HOST "pm2 logs haxball-server-<ID>"
```

### Ver Uso de Recursos

```bash
ssh ubuntu@SEU_HOST "pm2 monit"
```

### Reiniciar Todos Servidores

```bash
ssh ubuntu@SEU_HOST "pm2 restart all"
```

### Backup de Configuração PM2

```bash
ssh ubuntu@SEU_HOST "pm2 save"
```

---

## 🚀 PRODUÇÃO

### Checklist Antes de Deploy

- [ ] `TOKEN_ENCRYPT_KEY` configurada e em backup
- [ ] SSH_PRIVATE_KEY em secret manager (não em .env.local)
- [ ] `HAXHOST_API_URL` apontando para domínio de produção (HTTPS)
- [ ] Security Group da EC2 restrito ao IP do servidor Next.js
- [ ] Rate limiting implementado
- [ ] Logs configurados (Datadog, CloudWatch, etc.)
- [ ] Backup automático de `/home/ubuntu/haxball-servers`
- [ ] Monitoramento de PM2 (Keymetrics ou similar)
- [ ] SSL/TLS configurado (Let's Encrypt)

### Recomendações

1. **Use Secret Manager:**
   - AWS Secrets Manager
   - Vercel Environment Variables (encrypted)

2. **Configure Logs Centralizados:**
   - Enviar logs PM2 para CloudWatch
   - Alertas de erro via SNS

3. **Backup Automático:**
   - Cron job diário de rsync
   - S3 para replays

4. **Escalonamento:**
   - Múltiplas EC2s com load balancer
   - PM2 ecosystem com cluster mode

---

## 🤝 CONTRIBUINDO

Encontrou um bug ou tem sugestão? Abra uma issue!

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- **Implementação Completa:** `FASE_6_7_IMPLEMENTACAO.md`
- **PR Template:** `PR_TEMPLATE.md`
- **Schema Prisma:** `prisma/schema.prisma`
- **Smoke Test:** `scripts/smoke-test.sh`

---

**Desenvolvido por:** Cursor AI + Claude Sonnet 4.5  
**Data:** 13 de Novembro de 2025  
**Versão:** 2.0.0

