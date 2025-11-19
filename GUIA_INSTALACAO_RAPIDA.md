# 🚀 GUIA DE INSTALAÇÃO RÁPIDA - PASSO 1

## ✅ Como Aplicar o Script Integrado na EC2

### **1. Faça Backup do Script Atual**

```bash
ssh ubuntu@ip-172-31-11-176
cd ~/meu-servidor-haxball
cp azzurashin.js azzurashin-backup-$(date +%Y%m%d-%H%M%S).js
ls -lh azzurashin-backup* # Confirmar que o backup foi criado
```

### **2. Substitua o Script**

**Opção A: Via SCP (do seu computador local)**
```bash
scp /home/loy-operacao/WebstormProjects/projetohaxhostsite/azzurashin-integrado.js ubuntu@ip-172-31-11-176:~/meu-servidor-haxball/azzurashin.js
```

**Opção B: Copiar e colar manualmente**
```bash
ssh ubuntu@ip-172-31-11-176
nano ~/meu-servidor-haxball/azzurashin.js
# Apague TUDO (Ctrl+K várias vezes)
# Cole o conteúdo do azzurashin-integrado.js
# Salve: Ctrl+O, Enter, Ctrl+X
```

### **3. Configure a URL da API**

Edite o script:
```bash
nano ~/meu-servidor-haxball/azzurashin.js
```

Encontre estas linhas (no início do arquivo):
```javascript
const HAXHOST_API_URL = "http://localhost:3000"; // ← ALTERE AQUI!
const HAXHOST_WEBHOOK_SECRET = "haxhost-secret-2024"; // ← ALTERE SE NECESSÁRIO!
const PM2_PROCESS_NAME = "haxball-server"; // ← ALTERE SE NECESSÁRIO!
```

**Opções de configuração:**

1. **Se o Next.js está na MESMA EC2:**
   ```javascript
   const HAXHOST_API_URL = "http://localhost:3000";
   ```

2. **Se o Next.js está em OUTRA EC2:**
   ```javascript
   const HAXHOST_API_URL = "http://IP_PUBLICO_DA_EC2_NEXTJS:3000";
   ```
   ⚠️ Certifique-se que a porta 3000 está aberta no Security Group!

3. **Se já tem domínio em produção:**
   ```javascript
   const HAXHOST_API_URL = "https://haxhost.com.br";
   ```

### **4. Reinicie o Servidor Haxball**

```bash
pm2 restart haxball-server
pm2 logs haxball-server --lines 50
```

### **5. Verifique se Está Funcionando**

Você deve ver no log:
```
═══════════════════════════════════════════════════
🚀 INTEGRAÇÃO HAXHOST ATIVADA!
📡 API: http://localhost:3000
🔐 Secret configurado: ✅
📦 PM2 Process: haxball-server
═══════════════════════════════════════════════════
```

Quando alguém entrar na sala, você verá:
```
[HAXHOST] ✅ Evento PLAYER_JOIN enviado com sucesso!
```

Quando alguém enviar mensagem:
```
[HAXHOST] ✅ Evento CHAT enviado com sucesso!
```

### **6. Teste no Dashboard**

1. Acesse: `http://localhost:3000/dashboard` (ou IP do servidor)
2. Faça login como: `azzurashin` / `azzurashin123`
3. Entre na sala Haxball e envie uma mensagem
4. Verifique se a mensagem aparece no dashboard

---

## ❌ TROUBLESHOOTING

### **Erro: `[HAXHOST] ❌ Erro fatal ao enviar evento: connect ECONNREFUSED`**

**Causa:** O servidor Next.js não está acessível da EC2.

**Solução:**
1. Verifique se o Next.js está rodando:
   ```bash
   # Na EC2 do Next.js
   pm2 list
   # Ou
   lsof -i:3000
   ```

2. Teste a conectividade:
   ```bash
   # Na EC2 do Haxball
   curl http://localhost:3000/api/webhook/game-event
   # Deve retornar 405 ou "Method not allowed" (isso é bom!)
   ```

3. Se estiver em EC2s diferentes, abra a porta 3000:
   - AWS Console → EC2 → Security Groups
   - Adicione regra: TCP 3000, origem: IP da EC2 do Haxball

### **Erro: `[HAXHOST] ❌ Erro ao enviar evento: 401 Unauthorized`**

**Causa:** A chave `HAXHOST_WEBHOOK_SECRET` não está correta.

**Solução:**
1. Verifique a chave no `.env.local` do Next.js:
   ```bash
   cat /caminho/do/projeto/.env.local | grep HAXBALL_WEBHOOK_SECRET
   ```

2. Verifique a chave no script Haxball:
   ```bash
   cat ~/meu-servidor-haxball/azzurashin.js | grep HAXHOST_WEBHOOK_SECRET
   ```

3. Certifique-se que são **EXATAMENTE IGUAIS**.

### **Erro: `[HAXHOST] ❌ Erro ao enviar evento: 404 Not Found`**

**Causa:** A API não foi encontrada (Next.js não compilou ou rota não existe).

**Solução:**
1. Reinicie o Next.js:
   ```bash
   pm2 restart nextjs-app
   # Ou
   npm run dev
   ```

2. Verifique se a rota existe:
   ```bash
   ls -la app/api/webhook/game-event/route.ts
   ```

### **Eventos não aparecem no dashboard**

**Causa:** O servidor não está sendo encontrado no banco de dados.

**Solução:**
1. Execute o script de criação de usuário:
   ```bash
   cd /home/loy-operacao/WebstormProjects/projetohaxhostsite
   node create-user-simple.js
   ```

2. Verifique se o servidor foi criado:
   ```bash
   npx prisma studio
   # Procure por: pm2ProcessName = "haxball-server"
   ```

---

## ✅ CHECKLIST

- [ ] Backup do script original criado
- [ ] Script novo copiado para EC2
- [ ] URL da API configurada (HAXHOST_API_URL)
- [ ] Chave secreta verificada (HAXHOST_WEBHOOK_SECRET)
- [ ] Nome do processo PM2 correto (PM2_PROCESS_NAME)
- [ ] Servidor reiniciado com `pm2 restart`
- [ ] Log mostra "INTEGRAÇÃO HAXHOST ATIVADA!"
- [ ] Teste de entrada de jogador enviou evento com sucesso
- [ ] Teste de chat enviou evento com sucesso
- [ ] Eventos aparecem no dashboard do site

---

## 📋 PRÓXIMOS PASSOS

Depois que o PASSO 1 estiver funcionando:

✅ **PASSO 2:** Criar endpoint de controle (Start/Stop/Restart)  
✅ **PASSO 3:** Reconstruir o dashboard com todos os componentes

**Avise quando o PASSO 1 estiver OK para continuarmos! 🚀**

