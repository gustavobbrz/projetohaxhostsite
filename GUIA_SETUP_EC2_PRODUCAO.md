# 🚀 GUIA COMPLETO: SETUP EC2s PARA PRODUÇÃO

**Data:** 2025-01-18  
**EC2s:** HAXHOST EC2-1 e EC2-2  
**Capacidade:** 2 salas por EC2 (4 total)

---

## 📋 SUAS EC2s

### HAXHOST EC2-1
```
IP Público: 54.233.34.155
IP Privado: 172.31.0.57
Max Salas: 2
```

### HAXHOST EC2-2
```
IP Público: 56.125.172.250
IP Privado: 172.31.0.195
Max Salas: 2
```

**✅ Já configurado em:** `config/hosts.json`

---

## 🎯 FLUXO COMPLETO

```
1. Preparar EC2s (uma vez só)
   ↓
2. Criar servidor via Dashboard
   ↓
3. Sistema escolhe EC2 automaticamente (load balancing)
   ↓
4. Provisionar (envia script + inicia PM2)
   ↓
5. Sala fica online e conectada ao webhook
   ↓
6. Gerenciar via Dashboard (start/stop/restart)
```

---

## 🔧 PASSO 1: PREPARAR AS EC2s (FAZER UMA VEZ)

### 1.1. Conectar na EC2-1

```bash
ssh -i ~/.ssh/haxhost.pem ubuntu@54.233.34.155
```

### 1.2. Instalar Node.js (se não tiver)

```bash
# Verificar se já tem
node -v

# Se não tiver, instalar:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node -v  # deve mostrar v20.x
npm -v   # deve mostrar 10.x
```

### 1.3. Instalar PM2 Globalmente

```bash
sudo npm install -g pm2

# Verificar instalação
pm2 -v  # deve mostrar versão do PM2

# Configurar PM2 para iniciar no boot
pm2 startup
# (copiar e executar o comando que aparecer)

# Salvar configuração
pm2 save
```

### 1.4. Criar Estrutura de Pastas

```bash
# Criar pasta para os servidores Haxball
mkdir -p /home/ubuntu/meu-servidor-haxball
cd /home/ubuntu/meu-servidor-haxball

# Criar pasta para logs
mkdir -p logs

# Verificar
pwd
# Deve mostrar: /home/ubuntu/meu-servidor-haxball
```

### 1.5. Instalar Dependências do Haxball (na pasta)

```bash
cd /home/ubuntu/meu-servidor-haxball

# Inicializar package.json
npm init -y

# Instalar dependências necessárias
npm install haxball.js node-fetch@2 express form-data buffer

# Verificar instalação
ls node_modules/ | grep -E "haxball|node-fetch|express"
```

### 1.6. Testar Permissões

```bash
# Testar se consegue criar arquivos
touch /home/ubuntu/meu-servidor-haxball/test.txt
rm /home/ubuntu/meu-servidor-haxball/test.txt

# OK! Pronto para receber scripts do HaxHost
```

### 1.7. Repetir para EC2-2

```bash
# Sair da EC2-1
exit

# Conectar na EC2-2
ssh -i ~/.ssh/haxhost.pem ubuntu@56.125.172.250

# Repetir passos 1.2 a 1.6
```

---

## 📱 PASSO 2: CRIAR SERVIDOR VIA DASHBOARD

### 2.1. Acessar Dashboard

```
http://localhost:3000/dashboard
```

(Ou seu domínio em produção)

### 2.2. Fazer Login

Use seu usuário (ex: `azzurashin@haxhost.com`)

### 2.3. Criar Novo Servidor

**Campos do formulário:**

```
Nome da Sala: 🔵⚫ FUTSAL DA AZZURASHIN HC 🔵⚫
Mapa: bazinga (futsal)
Máx. Jogadores: 30
Senha: (deixar vazio ou definir)
Sala Privada: não
Token: thr1.AAAAAGkBboUlRFJSS8UAzA.ao6am0qC5s4
```

**Admins (opcional):**
```
Admin 1 - Label: Admin Principal
Admin 1 - Hash: sua_senha_hash_aqui
```

### 2.4. Clicar em "Salvar"

**O que acontece:**
1. ✅ Sistema cria registro no banco
2. ✅ Sistema consulta EC2s disponíveis
3. ✅ Sistema escolhe EC2 com menos salas
4. ✅ Sistema atribui `hostName` (ec2-test-1 ou ec2-test-2)
5. ✅ Sistema gera `pm2ProcessName` (ex: haxball-server-abc123)

**Resposta esperada:**
```json
{
  "success": true,
  "server": {
    "id": "abc-123-xyz",
    "name": "🔵⚫ FUTSAL DA AZZURASHIN HC 🔵⚫",
    "hostName": "ec2-test-1",  ← EC2 escolhida automaticamente
    "pm2ProcessName": "haxball-server-abc123",
    "status": "created"
  }
}
```

---

## 🚀 PASSO 3: PROVISIONAR (ENVIAR E INICIAR NA EC2)

### 3.1. No Dashboard, Clicar em "Provisionar"

Ou:

```
POST /api/servers/{serverId}/provision
Body: { "token": "thr1.AAAA..." } (opcional - se mudou o token)
```

### 3.2. O Que o Sistema Faz

```
1. Gera script do Haxball (haxball-server-abc123.js)
   - Baseado no seu azzurashin-integrado.js
   - Injeta configurações (nome, token, maxPlayers, etc.)
   - Injeta webhook do HaxHost

2. Conecta via SSH na EC2 correta
   - Se hostName = "ec2-test-1" → 54.233.34.155
   - Se hostName = "ec2-test-2" → 56.125.172.250

3. Envia o arquivo .js via SCP
   - Destino: /home/ubuntu/meu-servidor-haxball/haxball-server-abc123.js

4. Cria ecosystem.config.js (PM2 config)
   - Envia via SCP também

5. Inicia o processo via PM2
   - ssh "cd /home/ubuntu/meu-servidor-haxball && pm2 start haxball-server-abc123.js --name haxball-server-abc123"

6. Atualiza status no banco
   - status: "running"
   - lastProvisionedAt: agora
```

### 3.3. Verificar na EC2

```bash
# Conectar na EC2 onde foi provisionado
ssh -i ~/.ssh/haxhost.pem ubuntu@54.233.34.155

# Ver processos PM2
pm2 list

# Deve mostrar:
# ┌────┬────────────────────────┬─────────┬────────┐
# │ id │ name                   │ status  │ cpu    │
# ├────┼────────────────────────┼─────────┼────────┤
# │ 0  │ haxball-server-abc123  │ online  │ 0%     │
# └────┴────────────────────────┴─────────┴────────┘

# Ver logs do servidor
pm2 logs haxball-server-abc123

# Deve mostrar:
# Sala criada com sucesso! Link: https://www.haxball.com/play?c=...
```

---

## 📊 PASSO 4: LOAD BALANCING AUTOMÁTICO

### Como Funciona

```
Servidor 1 criado → Sistema verifica:
  ec2-test-1: 0 salas
  ec2-test-2: 0 salas
  → Escolhe: ec2-test-1 ✅

Servidor 2 criado → Sistema verifica:
  ec2-test-1: 1 sala
  ec2-test-2: 0 salas
  → Escolhe: ec2-test-2 ✅

Servidor 3 criado → Sistema verifica:
  ec2-test-1: 1 sala
  ec2-test-2: 1 sala
  → Escolhe: ec2-test-1 (empate, escolhe primeiro) ✅

Servidor 4 criado → Sistema verifica:
  ec2-test-1: 2 salas
  ec2-test-2: 1 sala
  → Escolhe: ec2-test-2 ✅

Servidor 5 criado → Sistema verifica:
  ec2-test-1: 2 salas (LIMITE)
  ec2-test-2: 2 salas (LIMITE)
  → Retorna 503: "Capacidade total atingida" ❌
```

### Ver Distribuição Atual

No dashboard, haverá um card mostrando:

```
📊 Capacidade dos Servidores

EC2-1: ████░░ 2/2 salas (100%)
EC2-2: ██░░░░ 1/2 salas (50%)
```

(Você pode implementar isso chamando `GET /api/admin/hosts/stats`)

---

## 🎮 PASSO 5: GERENCIAR VIA DASHBOARD

### 5.1. Controles Disponíveis

**No card do servidor:**

```
[Ligar]      → POST /api/servers/:id/control { action: "start" }
[Desligar]   → POST /api/servers/:id/control { action: "stop" }
[Reiniciar]  → POST /api/servers/:id/control { action: "restart" }
```

### 5.2. Como Funciona Internamente

```
Usuário clica "Reiniciar"
  ↓
Dashboard → POST /api/servers/abc-123/control
  Body: { action: "restart" }
  ↓
API busca servidor no banco
  hostName: "ec2-test-1"
  pm2ProcessName: "haxball-server-abc123"
  ↓
API carrega config da EC2-1 (54.233.34.155)
  ↓
API conecta via SSH
  ssh -i ~/.ssh/haxhost.pem ubuntu@54.233.34.155
  ↓
API executa comando PM2
  pm2 restart haxball-server-abc123
  ↓
Sala reinicia, webhook envia novo roomLink
  ↓
Dashboard atualiza automaticamente
```

### 5.3. Ver Logs em Tempo Real

**Opção 1: Via Dashboard** (se implementado)
```
Aba "Logs" → mostra últimos 100 logs via API
```

**Opção 2: Via SSH**
```bash
ssh -i ~/.ssh/haxhost.pem ubuntu@54.233.34.155
pm2 logs haxball-server-abc123 --lines 50
```

---

## 🔍 PASSO 6: MONITORAR E DEBUGAR

### 6.1. Ver Todos os Processos PM2

```bash
# Na EC2-1
ssh -i ~/.ssh/haxhost.pem ubuntu@54.233.34.155
pm2 list

# Na EC2-2
ssh -i ~/.ssh/haxhost.pem ubuntu@56.125.172.250
pm2 list
```

### 6.2. Ver Uso de CPU e Memória

```bash
pm2 monit
```

### 6.3. Limpar Logs Antigos

```bash
pm2 flush  # limpa todos os logs
```

### 6.4. Salvar Estado do PM2

```bash
pm2 save  # salva lista de processos para reiniciar após reboot
```

---

## ⚙️ CONFIGURAÇÕES AVANÇADAS

### Aumentar Limite de Salas por EC2

Editar `config/hosts.json`:

```json
{
  "hosts": [...],
  "pm2_process_template_name": "haxball-server",
  "max_rooms_per_host": 3  ← mudar de 2 para 3
}
```

### Adicionar Mais EC2s

Editar `config/hosts.json`:

```json
{
  "hosts": [
    {
      "name": "ec2-test-1",
      "ip": "54.233.34.155",
      ...
    },
    {
      "name": "ec2-test-2",
      "ip": "56.125.172.250",
      ...
    },
    {
      "name": "ec2-test-3",  ← NOVA EC2
      "ip": "XX.XXX.XXX.XXX",
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

### Configurar Auto-Restart do PM2

```bash
# Na EC2, editar crontab
crontab -e

# Adicionar linha:
@reboot /usr/bin/pm2 resurrect
```

---

## 🐛 TROUBLESHOOTING

### Problema: "Nenhum host disponível" ao criar servidor

**Causa:** Todas as EC2s têm 2/2 salas ativas.

**Solução:**
1. Deletar salas antigas via dashboard
2. Ou aumentar `max_rooms_per_host` em `config/hosts.json`
3. Ou adicionar mais EC2s

### Problema: Sala não inicia após provisionar

**Debug:**

```bash
# 1. Conectar na EC2
ssh -i ~/.ssh/haxhost.pem ubuntu@54.233.34.155

# 2. Ver processos
pm2 list

# 3. Ver logs de erro
pm2 logs haxball-server-abc123 --err --lines 50

# 4. Verificar se arquivo existe
ls -la /home/ubuntu/meu-servidor-haxball/haxball-server-*.js

# 5. Testar execução manual
cd /home/ubuntu/meu-servidor-haxball
node haxball-server-abc123.js
```

**Causas comuns:**
- Token do Haxball inválido
- Dependências não instaladas (`npm install`)
- Porta já em uso
- Permissões incorretas

### Problema: SSH timeout ao provisionar

**Causa:** Chave SSH incorreta ou EC2 inacessível.

**Solução:**

```bash
# Testar SSH manualmente
ssh -i ~/.ssh/haxhost.pem ubuntu@54.233.34.155

# Se falhar, verificar:
# 1. Security Group permite SSH (porta 22)
# 2. EC2 está rodando (AWS Console)
# 3. Chave está correta e permissões são 400
chmod 400 ~/.ssh/haxhost.pem
```

### Problema: Webhook não funciona (sala não aparece no dashboard)

**Debug:**

```bash
# 1. Ver logs do servidor Haxball
pm2 logs haxball-server-abc123 | grep WEBHOOK

# 2. Verificar se sala gerou roomLink
pm2 logs haxball-server-abc123 | grep "Sala criada"

# 3. Testar webhook manualmente
curl -X POST "https://seu-dominio.com/api/webhook/game-event" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: haxhost-secret-2024" \
  -d '{
    "pm2ProcessName": "haxball-server-abc123",
    "eventType": "ROOM_OPEN",
    "data": {
      "roomLink": "https://www.haxball.com/play?c=TEST"
    }
  }'
```

**Causa comum:** `HAXHOST_WEBHOOK_SECRET` diferente entre:
- `.env.local` do Next.js
- Script do Haxball (azzurashin-integrado.js)

---

## ✅ CHECKLIST FINAL

### Setup Inicial (Fazer Uma Vez)

- [ ] EC2-1: Node.js instalado
- [ ] EC2-1: PM2 instalado globalmente
- [ ] EC2-1: Pasta `/home/ubuntu/meu-servidor-haxball` criada
- [ ] EC2-1: Dependências instaladas (haxball.js, etc.)
- [ ] EC2-2: Node.js instalado
- [ ] EC2-2: PM2 instalado globalmente
- [ ] EC2-2: Pasta `/home/ubuntu/meu-servidor-haxball` criada
- [ ] EC2-2: Dependências instaladas
- [ ] Chave SSH `~/.ssh/haxhost.pem` com permissões 400
- [ ] `config/hosts.json` atualizado (IPs corretos)

### Por Servidor Criado

- [ ] Criar via dashboard (preencher formulário)
- [ ] Verificar que `hostName` foi atribuído
- [ ] Clicar em "Provisionar"
- [ ] Aguardar provisionamento (30-60 segundos)
- [ ] Verificar status "running" no dashboard
- [ ] Ver `roomLink` no dashboard
- [ ] Testar acesso à sala via link

---

## 🎯 RESUMO DO FLUXO

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO (Dashboard)                  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ 1. Criar Servidor
                           ↓
┌─────────────────────────────────────────────────────────┐
│              API HaxHost (Next.js)                      │
│  • Gera pm2ProcessName                                  │
│  • Escolhe EC2 automaticamente (load balancing)        │
│  • Salva no banco (hostName: ec2-test-1)               │
└─────────────────────────────────────────────────────────┘
                           │
                           │ 2. Provisionar
                           ↓
┌─────────────────────────────────────────────────────────┐
│              lib/provisioning/                          │
│  • Gera script Haxball personalizado                   │
│  • Conecta SSH na EC2 correta (54.233.34.155)         │
│  • Envia .js via SCP                                   │
│  • Inicia PM2                                          │
└─────────────────────────────────────────────────────────┘
                           │
                           │ 3. PM2 Start
                           ↓
┌─────────────────────────────────────────────────────────┐
│              EC2 (54.233.34.155 ou .250)                │
│  • PM2 executa haxball-server-abc123.js                │
│  • Sala abre no Haxball                                │
│  • Webhook envia roomLink para API                     │
└─────────────────────────────────────────────────────────┘
                           │
                           │ 4. Webhook (ROOM_OPEN)
                           ↓
┌─────────────────────────────────────────────────────────┐
│          /api/webhook/game-event                        │
│  • Salva roomLink no banco                             │
│  • Atualiza status: "running"                          │
└─────────────────────────────────────────────────────────┘
                           │
                           │ 5. Dashboard Atualiza
                           ↓
┌─────────────────────────────────────────────────────────┐
│                USUÁRIO (Dashboard)                      │
│  • Vê sala online                                      │
│  • Vê roomLink                                         │
│  • Pode clicar para acessar sala                       │
│  • Pode start/stop/restart via botões                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Preparar EC2s** (seguir Passo 1)
2. **Testar criar 1 servidor** via dashboard
3. **Verificar que funciona** (sala abre, webhook chega)
4. **Criar 2º servidor** (deve ir para EC2-2)
5. **Criar 3º e 4º servidores** (deve distribuir)
6. **Tentar criar 5º** (deve retornar erro: capacidade atingida)

---

**✅ Sistema pronto para produção!**

**Dúvidas?** Consulte:
- `RESUMO_FINAL_PARA_USUARIO.md` - Instruções gerais
- `COMO_TESTAR_MULTI_HOST.md` - Testes e validações
- `MULTI_HOST_SETUP.md` - Documentação técnica completa

