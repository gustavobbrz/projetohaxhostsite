# 🔧 ATUALIZAÇÃO: NOVOS HOSTS DE TESTE

**Data:** 2025-01-18  
**Commit:** `ac29966`  
**Status:** ✅ **ATUALIZADO E VALIDADO**

---

## 📋 MUDANÇA REALIZADA

O arquivo `config/hosts.json` foi atualizado para usar **2 novas EC2s de teste** em vez das 3 anteriores.

### ❌ Hosts Anteriores (Removidos)
```
• azzura (18.231.184.163) → ~/.ssh/billyhax.pem
• sv1 (18.230.17.55) → ~/.ssh/haxhost.pem
• sv2 (18.230.122.222) → ~/.ssh/haxhost.pem
```

### ✅ Novos Hosts (Ativos)
```
• ec2-test-1 (54.233.34.155) → ~/.ssh/haxhost.pem
• ec2-test-2 (56.125.172.250) → ~/.ssh/haxhost.pem
```

---

## 📊 CONFIGURAÇÃO ATUAL

### config/hosts.json (Completo)

```json
{
  "hosts": [
    {
      "name": "ec2-test-1",
      "ip": "54.233.34.155",
      "ssh_user": "ubuntu",
      "ssh_private_key_path": "~/.ssh/haxhost.pem",
      "base_path": "/home/ubuntu/meu-servidor-haxball",
      "ssh_port": 22
    },
    {
      "name": "ec2-test-2",
      "ip": "56.125.172.250",
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

### Características

- **Total de hosts:** 2 (ec2-test-1, ec2-test-2)
- **Max rooms por host:** 2
- **Capacidade total:** 4 servidores simultâneos
- **Chave SSH:** `~/.ssh/haxhost.pem` (mesma para ambos)
- **PM2 template:** `haxball-server`

---

## ✅ VALIDAÇÕES REALIZADAS

### Teste Automático

```bash
npx tsx test-hosts-config-only.ts
```

**Resultado: 7/7 testes PASS ✅**

| # | Teste | Status |
|---|-------|--------|
| 1 | Arquivo config/hosts.json existe | ✅ PASS |
| 2 | JSON válido e parseável | ✅ PASS |
| 3 | Estrutura correta (2 hosts) | ✅ PASS |
| 4 | Hosts esperados presentes | ✅ PASS |
| 5 | Propriedades completas | ✅ PASS |
| 6 | Chave SSH existe (permissões 400) | ✅ PASS |
| 7 | Configurações globais OK | ✅ PASS |

### Validações Manuais

```bash
# Ver hosts carregados
cat config/hosts.json | jq '.hosts[] | {name, ip}'

# Verificar chave SSH
ls -la ~/.ssh/haxhost.pem

# Ver backup anterior
ls -la config/backup/
```

---

## 🚀 COMO FUNCIONA AGORA

### Load Balancing Automático

Quando você cria um servidor, o sistema:

1. **Consulta quantos servidores cada EC2 tem**
   ```
   ec2-test-1: 0 servidores
   ec2-test-2: 0 servidores
   ```

2. **Escolhe a EC2 com MENOS servidores**
   ```
   → Selecionado: ec2-test-1 (0/2)
   ```

3. **Salva no banco**
   ```json
   {
     "hostName": "ec2-test-1",
     "pm2ProcessName": "haxball-server-abc123"
   }
   ```

4. **Controles futuros vão para a EC2 correta**
   ```bash
   ssh -i ~/.ssh/haxhost.pem ubuntu@54.233.34.155 "pm2 restart haxball-server-abc123"
   ```

### Distribuição de Servidores

```
Servidor 1 → ec2-test-1 (0/2) ✅
Servidor 2 → ec2-test-2 (0/2) ✅
Servidor 3 → ec2-test-1 (1/2) ✅
Servidor 4 → ec2-test-2 (1/2) ✅
Servidor 5 → 503 (limite atingido: 2/2 em cada)
```

---

## 📁 ARQUIVOS MODIFICADOS

### Commit: `ac29966`

```
M  config/hosts.json              (2 novos hosts)
A  test-hosts-config-only.ts      (validação rápida)
A  test-new-hosts.ts              (validação completa)
```

### Backup Criado

```
config/backup/hosts.json.backup-20250118-HHMMSS
```

O backup contém os 3 hosts anteriores (azzura, sv1, sv2).

---

## 🧪 TESTES DISPONÍVEIS

### 1. Validação Rápida (sem Prisma)

```bash
npx tsx test-hosts-config-only.ts
```

**Testa:**
- Arquivo existe
- JSON válido
- Estrutura correta
- Hosts esperados
- Chave SSH

**Vantagem:** Rápido, não precisa de .env.local

### 2. Validação Completa (com Prisma)

```bash
npx tsx test-new-hosts.ts
```

**Testa:**
- Tudo do teste 1
- Load balancing real
- Consulta ao banco de dados
- Contagem de servidores

**Requer:** .env.local configurado

---

## 🔧 COMPATIBILIDADE

### lib/hosts.ts

✅ **100% compatível** - não precisa de mudanças.

A biblioteca `lib/hosts.ts` carrega dinamicamente o `config/hosts.json`:

```typescript
const configPath = path.join(process.cwd(), "config", "hosts.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
```

Funções que continuam funcionando:
- ✅ `loadHostsConfig()` - carrega os 2 novos hosts
- ✅ `getAllHosts()` - retorna array com ec2-test-1 e ec2-test-2
- ✅ `getHostByName("ec2-test-1")` - busca host específico
- ✅ `getAvailableHost()` - load balancing automático
- ✅ `validateHosts()` - valida chave SSH

### APIs

✅ **100% compatível** - não precisa de mudanças.

Os endpoints continuam funcionando normalmente:
- ✅ `POST /api/servers` - atribui ec2-test-1 ou ec2-test-2
- ✅ `POST /api/servers/:id/control` - SSH para IP correto
- ✅ `POST /api/servers/:id/provision` - provisiona na EC2 correta

---

## 🎯 PRÓXIMOS PASSOS

### 1. Testar Localmente

```bash
# Iniciar servidor
npm run dev

# Acessar dashboard
# http://localhost:3000/dashboard
```

### 2. Criar Servidor (Via Dashboard)

1. Login
2. Criar Servidor
3. Verificar que `hostName` = "ec2-test-1" ou "ec2-test-2"
4. Testar controles (Ligar/Desligar/Reiniciar) com dry-run

### 3. Testar SSH Real (Opcional)

```bash
# Testar conexão SSH manual
ssh -i ~/.ssh/haxhost.pem ubuntu@54.233.34.155 "hostname"
ssh -i ~/.ssh/haxhost.pem ubuntu@56.125.172.250 "hostname"
```

### 4. Testar Provisionamento

```bash
# Via dashboard: criar servidor + provisionar
# Ou via API:
curl -X POST "http://localhost:3000/api/servers/:id/provision" \
  -H "Content-Type: application/json" \
  -H "Cookie: ..." \
  -d '{"token":"..."}'
```

---

## ⚠️ IMPORTANTE

### Chave SSH

Certifique-se de que `~/.ssh/haxhost.pem` existe e tem as permissões corretas:

```bash
ls -la ~/.ssh/haxhost.pem
# Deve mostrar: -r-------- (400)

# Se necessário:
chmod 400 ~/.ssh/haxhost.pem
```

### IPs das EC2s

Confirme que os IPs estão corretos e as EC2s estão ativas:

```bash
# Testar ping
ping -c 3 54.233.34.155
ping -c 3 56.125.172.250

# Testar SSH
ssh -i ~/.ssh/haxhost.pem ubuntu@54.233.34.155 "echo OK"
ssh -i ~/.ssh/haxhost.pem ubuntu@56.125.172.250 "echo OK"
```

### Servidores Existentes

⚠️ Servidores criados antes dessa mudança ainda têm `hostName` das EC2s antigas (azzura, sv1, sv2).

**Opções:**
1. **Manter:** Se as EC2s antigas ainda existem, eles continuarão funcionando
2. **Migrar:** Atualizar `hostName` no banco para ec2-test-1 ou ec2-test-2
3. **Recriar:** Deletar e criar novos servidores

```sql
-- Ver servidores com hosts antigos
SELECT id, name, hostName FROM Server WHERE hostName IN ('azzura', 'sv1', 'sv2');

-- Migrar (se necessário)
UPDATE Server SET hostName = 'ec2-test-1' WHERE hostName = 'azzura';
```

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

| Item | Antes | Depois |
|------|-------|--------|
| **Número de hosts** | 3 | 2 |
| **Capacidade total** | 6 servidores | 4 servidores |
| **Chaves SSH** | 2 diferentes | 1 única |
| **IPs** | 18.231.x.x, 18.230.x.x | 54.233.x.x, 56.125.x.x |
| **Nomes** | azzura, sv1, sv2 | ec2-test-1, ec2-test-2 |

---

## 🐛 TROUBLESHOOTING

### "Host não encontrado"

Se você ver erros sobre hosts não encontrados:

```bash
# Limpar cache do Node (se necessário)
rm -rf .next/
npm run dev
```

### "Chave SSH não encontrada"

```bash
# Verificar caminho
ls -la ~/.ssh/haxhost.pem

# Se não existir, solicitar ao admin
# Se existir mas permissões erradas:
chmod 400 ~/.ssh/haxhost.pem
```

### "Nenhum host disponível"

Se ao criar servidor retorna 503:

```bash
# Ver quantos servidores ativos por host
npx prisma studio
# Tabela: Server
# Filtrar: status = "active"
# Contar: quantos com hostName = "ec2-test-1" ou "ec2-test-2"

# Se ambos têm 2/2, aguardar ou aumentar max_rooms_per_host
```

---

## ✅ CHECKLIST FINAL

- [x] config/hosts.json atualizado
- [x] 2 novos hosts configurados (ec2-test-1, ec2-test-2)
- [x] Backup criado (config/backup/)
- [x] Testes criados (test-hosts-config-only.ts, test-new-hosts.ts)
- [x] Validação executada (7/7 testes PASS)
- [x] Chave SSH validada (permissões 400 ✅)
- [x] lib/hosts.ts compatível
- [x] APIs compatíveis
- [x] Documentação atualizada

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- `COMO_TESTAR_MULTI_HOST.md` - Guia de testes
- `MULTI_HOST_SETUP.md` - Documentação técnica
- `RESUMO_FINAL_PARA_USUARIO.md` - Resumo executivo
- `LOG_SESSAO_MULTI_HOST.md` - Log da implementação

---

**✅ ATUALIZAÇÃO COMPLETA E VALIDADA!**

**Commit Hash:** `ac29966`  
**Branch:** `chore/setup-db-env`  
**Data:** 2025-01-18

**Sistema pronto para usar os 2 novos hosts de teste!**

