# 🧪 COMO TESTAR O SISTEMA MULTI-HOST

## 🚀 SETUP RÁPIDO (1 minuto)

### Opção 1: Script Automático (Recomendado)

```bash
# No diretório raiz do projeto:
bash setup-and-test-multi-host.sh
```

Esse script faz automaticamente:
- ✅ Backup do `config/hosts.json` atual
- ✅ Cria novo `config/hosts.json` com 3 EC2s
- ✅ Valida chaves SSH
- ✅ Ajusta permissões (chmod 400)
- ✅ Limpa porta 3000
- ✅ Roda testes simulados
- ✅ Mostra instruções de próximos passos

---

## 📋 OPÇÃO 2: PASSO A PASSO MANUAL

### 1️⃣ Criar/Atualizar `config/hosts.json`

```bash
cat > config/hosts.json <<'JSON'
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
JSON
```

### 2️⃣ Validar Chaves SSH

```bash
# Verificar se existem
ls -la ~/.ssh/billyhax.pem
ls -la ~/.ssh/haxhost.pem

# Ajustar permissões
chmod 400 ~/.ssh/billyhax.pem
chmod 400 ~/.ssh/haxhost.pem
```

### 3️⃣ Rodar Testes Simulados

```bash
# Testes de lógica de negócio (não precisa do servidor rodando)
npx tsx test-multi-host-routes.ts
```

### 4️⃣ Iniciar Servidor Next.js

```bash
npm run dev
```

---

## 🧪 TESTES MANUAIS (via curl)

### A) Listar Servidores

```bash
curl -s -X GET "http://localhost:3000/api/servers" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN_AQUI"
```

### B) Criar Novo Servidor

```bash
curl -s -X POST "http://localhost:3000/api/servers" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN_AQUI" \
  -d '{
    "name": "Sala Teste Multi-Host",
    "maxPlayers": 10
  }' | jq .
```

**Esperado:**
- `hostName` = "azzura" (ou sv1/sv2, dependendo do load)
- `pm2ProcessName` = "haxball-server-XXXXXXXX"

### C) Controlar Servidor (Dry-Run)

```bash
# Substitua {SERVER_ID} pelo ID retornado no passo B
curl -s -X POST "http://localhost:3000/api/servers/{SERVER_ID}/control" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN_AQUI" \
  -d '{
    "action": "restart",
    "dryRun": true
  }' | jq .
```

**Esperado:**
```json
{
  "success": true,
  "dryRun": true,
  "command": "ssh -i ~/.ssh/haxhost.pem ubuntu@18.231.184.163 \"pm2 restart haxball-server-abc123\"",
  "host": "azzura"
}
```

### D) Adicionar Admin

```bash
curl -s -X POST "http://localhost:3000/api/servers/{SERVER_ID}/admins" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN_AQUI" \
  -d '{
    "label": "Admin Principal",
    "adminHash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
  }' | jq .
```

---

## 🔍 COMO OBTER O SESSION TOKEN

### Método 1: Via Navegador (Chrome DevTools)

1. Acesse `http://localhost:3000/login`
2. Faça login
3. Abra DevTools (F12)
4. Vá em **Application → Cookies → http://localhost:3000**
5. Copie o valor de `next-auth.session-token`

### Método 2: Via Código (Prisma Studio)

```bash
npx prisma studio
```

1. Abra a tabela `Session`
2. Copie o valor de `sessionToken`
3. Use como: `Cookie: next-auth.session-token=VALOR_AQUI`

---

## 📊 VERIFICAR LOAD BALANCING

### Teste de Distribuição

```bash
# Criar 3 servidores sequencialmente
for i in {1..3}; do
  curl -s -X POST "http://localhost:3000/api/servers" \
    -H "Content-Type: application/json" \
    -H "Cookie: next-auth.session-token=SEU_TOKEN" \
    -d "{\"name\":\"Sala $i\",\"maxPlayers\":10}" | jq '.server.hostName'
done
```

**Esperado:**
```
"azzura"
"sv1"
"sv2"
```

### Verificar Estatísticas de Hosts

```bash
# Adicionar endpoint GET /api/admin/hosts/stats (se não existir)
curl -s http://localhost:3000/api/admin/hosts/stats | jq .
```

**Esperado:**
```json
[
  {
    "name": "azzura",
    "ip": "18.231.184.163",
    "activeServers": 1,
    "maxServers": 2,
    "usage": 50.0
  },
  {
    "name": "sv1",
    "ip": "18.230.17.55",
    "activeServers": 1,
    "maxServers": 2,
    "usage": 50.0
  },
  {
    "name": "sv2",
    "ip": "18.230.122.222",
    "activeServers": 1,
    "maxServers": 2,
    "usage": 50.0
  }
]
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Antes de Commitar

- [ ] `config/hosts.json` existe e tem 3 hosts
- [ ] Chaves SSH têm permissão 400
- [ ] `test-multi-host-routes.ts` passa (5/5 testes)
- [ ] POST /api/servers retorna `hostName` e `pm2ProcessName`
- [ ] Control route dry-run retorna comando SSH completo
- [ ] Nenhum endpoint retorna HTML

### Antes de Deploy em Produção

- [ ] Testar SSH real (sem dry-run) em ambiente staging
- [ ] Validar que PM2 realmente inicia/para/reinicia
- [ ] Testar failover (se 1 EC2 estiver offline)
- [ ] Monitorar logs de SSH (arquivo ou CloudWatch)
- [ ] Testar provisioning completo (upload do script JS)

---

## 🐛 TROUBLESHOOTING

### Problema: "Chave SSH não encontrada"

```bash
# Verificar se a chave existe
ls -la ~/.ssh/billyhax.pem
ls -la ~/.ssh/haxhost.pem

# Se não existir, solicitar ao admin do projeto
```

### Problema: "Permission denied (publickey)"

```bash
# Ajustar permissões
chmod 400 ~/.ssh/billyhax.pem
chmod 400 ~/.ssh/haxhost.pem

# Verificar
ls -la ~/.ssh/*.pem
```

### Problema: "Unexpected token '<'" (HTML em vez de JSON)

- ✅ Corrigido: Todos os endpoints agora retornam `NextResponse.json()`
- Se persistir, verificar logs do Next.js (erro de compilação)

### Problema: "pm2ProcessName is null"

- ✅ Corrigido: Agora gerado automaticamente em `POST /api/servers`
- Formato: `haxball-server-{uuid-8-chars}`

### Problema: "hostName is null"

- ✅ Corrigido: `getAvailableHost()` sempre atribui um host
- Se todos estiverem cheios, retorna 503

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- [MULTI_HOST_SETUP.md](./MULTI_HOST_SETUP.md) - Guia completo de arquitetura
- [EVIDENCIAS_FINAIS_TESTES.md](./EVIDENCIAS_FINAIS_TESTES.md) - Relatório de testes
- [TESTE_VALIDACAO_MULTI_HOST.md](./TESTE_VALIDACAO_MULTI_HOST.md) - Documentação técnica

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Testar localmente com dry-run
2. ⏳ Testar SSH real em staging
3. ⏳ Implementar monitoramento de saúde das EC2s
4. ⏳ Adicionar endpoint `/api/admin/hosts/stats`
5. ⏳ Configurar alertas de falha de SSH
6. ⏳ Deploy em produção

---

## 🎯 CONTATO

Se encontrar problemas:

1. Verifique os logs: `test-output.log`, `.dev-next.log`
2. Cole os erros no chat do projeto
3. Mencione qual passo falhou (A, B, C ou D)

**Status:** ✅ Sistema validado e pronto para testes!

