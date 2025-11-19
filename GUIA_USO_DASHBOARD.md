# 📘 GUIA DE USO DO DASHBOARD - HaxHost

**Versão:** 1.0  
**Data:** 13 de Novembro de 2025

---

## 🚀 COMO USAR O DASHBOARD

### 1️⃣ Acesso ao Dashboard

```bash
# 1. Inicie o Next.js (se ainda não estiver rodando)
npm run dev

# 2. Abra no navegador
http://localhost:3000/dashboard

# 3. Faça login
#    - Discord OAuth OU
#    - Email/senha (se configurado)
```

---

## 🆕 CRIAR NOVO SERVIDOR

### Se você não tem servidor ainda:

1. **Acesse o dashboard** → Você verá o formulário de criação
2. **Preencha os campos:**
   - 📝 **Nome:** Digite o nome da sua sala (pode usar emoji! 🎮⚽)
   - 🗺️ **Mapa:** Escolha entre Bazinga, Big ou Real Soccer
   - 👥 **Max Jogadores:** De 2 a 50
   - 🔒 **Senha (opcional):** Deixe vazio para sala sem senha
   - 🔐 **Sala Privada:** Marque se não quiser aparecer na lista pública
3. **Clique em "💾 Salvar"**
4. **Aguarde a confirmação** → "✅ Servidor salvo com sucesso!"

---

## 🚀 PROVISIONAR SERVIDOR (Primeira vez)

Após criar o servidor, você precisa **provisioná-lo** (iniciar na EC2):

1. **Clique em "🚀 Provisionar"**
2. **Confirme a ação** no popup
3. **Aguarde 10-30 segundos** → Você verá "⏳ Provisionando servidor..."
4. **Sucesso!** → Mensagem com:
   - Nome do processo PM2
   - Link da sala (quando disponível)

**⚠️ IMPORTANTE:**
- O provisionamento só funciona se o backend tiver acesso SSH à EC2
- Verifique as credenciais SSH em `.env.local`

---

## ⚙️ CONFIGURAR SERVIDOR EXISTENTE

### Aba "⚙️ Configuração"

1. **Acesse a aba "Configuração"** no dashboard
2. **Edite os campos** que desejar:
   - Nome da sala
   - Mapa
   - Max jogadores
   - Senha
   - Público/Privado
3. **Opções de ação:**

   **Opção A: Apenas Salvar (sem reiniciar)**
   - Clique "💾 Salvar"
   - As mudanças são salvas no banco
   - Servidor NÃO é reiniciado
   - Mudanças só valerão no próximo restart manual

   **Opção B: Salvar e Reiniciar**
   - Clique "💾🔄 Salvar e Reiniciar"
   - As mudanças são aplicadas imediatamente
   - Servidor é reiniciado via PM2
   - Jogadores serão desconectados temporariamente

---

## 🔑 ALTERAR TOKEN HAXBALL

Se você precisa trocar o token:

1. **Acesse a aba "⚙️ Configuração"**
2. **Role até a seção "🔑 Token Haxball"** (fundo amarelo)
3. **Cole o novo token** no campo
4. **Clique "💾🔄 Salvar e Reiniciar"** (token requer restart)
5. **Aguarde confirmação**

**⚠️ SEGURANÇA:**
- O token atual **nunca é exibido** (por segurança)
- Deixe vazio para manter o token atual
- Use o botão 👁️ para mostrar/ocultar o token digitado

---

## 👑 GERENCIAR ADMINS

### Ver Admins Atuais

1. **Acesse "⚙️ Configuração"**
2. **Role até "👑 Gerenciar Admins"**
3. Você verá a lista de todos os admins cadastrados

### Adicionar Admin

1. **Preencha os campos:**
   - **Label:** Nome/identificação do admin (ex: "Admin Principal", "Moderador João")
   - **Senha:** Mínimo 6 caracteres (será criptografada)
2. **Clique "➕ Adicionar"**
3. **Confirmação:** "✅ Admin adicionado!"

**Como usar no jogo:**
- O jogador digita no chat: `!{senha}` (ex: `!admin123`)
- O script reconhece e concede admin

### Remover Admin

1. **Encontre o admin na lista**
2. **Clique no botão "🗑️ Remover"**
3. **Confirme a ação** no popup
4. **Sucesso:** "✅ Admin removido!"

---

## 📊 ABAS DO DASHBOARD

### 📊 Visão Geral
- Resumo de mensagens recentes
- Denúncias pendentes
- Últimos replays
- Cards de estatísticas

### ⚙️ Configuração
- **Formulário completo** de edição
- Gerenciamento de admins
- Status do servidor

### 💬 Chat
- Histórico completo de mensagens
- Filtro por time (Red/Blue/Spec)
- Atualização automática

### 🎬 Replays
- Grid de replays
- Estatísticas (placar, posse, tempo)
- Botão de download (.hbr2)

### 👥 Jogadores
- Logs de entrada/saída
- Dados de conexão (IP, Auth, Conn)
- Histórico completo

### 🛡️ Moderação
- **Denúncias:** Aprovar ou ignorar
- **Banidos:** Ver lista e desbanir
- **Botão:** Limpar todos os bans

### 📜 Logs Admin
- Feed de ações administrativas
- Histórico de logins de admins

---

## 🔄 CONTROLES DO SERVIDOR

### Botões na Visão Geral

**🟢 Ligar (Start)**
- Inicia o servidor se estiver parado
- Comando PM2: `pm2 start`

**🔴 Desligar (Stop)**
- Para o servidor
- Comando PM2: `pm2 stop`

**🔄 Reiniciar (Restart)**
- Reinicia o servidor
- Comando PM2: `pm2 restart`

**⚠️ NOTA:**
- Esses botões só funcionam se o servidor já foi provisionado
- Requer acesso SSH à EC2

---

## 🎨 ESTADOS DO SERVIDOR

### 🟢 Ativo
- Servidor está rodando
- Jogadores podem entrar
- Dados sendo coletados

### 🟡 Inativo
- Servidor parado
- Precisa de restart

### ⚪ Pendente
- Servidor criado mas não provisionado
- Use "🚀 Provisionar"

### ❌ Necessário Provisionar
- Servidor novo ou com problemas
- Clique em "Provisionar"

---

## ⚠️ TROUBLESHOOTING

### Erro ao Salvar

**Mensagem:** "❌ Erro ao salvar"

**Soluções:**
1. Verifique se está logado
2. Confira se o nome tem 1-64 caracteres
3. MaxPlayers deve estar entre 2-50
4. Veja o console do navegador (F12) para detalhes

### Erro ao Provisionar

**Mensagem:** "❌ Erro ao provisionar"

**Causas comuns:**
1. Credenciais SSH incorretas
2. EC2 inacessível
3. PM2 não instalado na EC2
4. Porta já em uso

**Como verificar:**
```bash
# Teste SSH manualmente
ssh ubuntu@seu-host "pm2 list"

# Veja logs do Next.js
# Terminal onde está rodando `npm run dev`
```

### Botões não funcionam

**Problema:** Cliquei mas nada acontece

**Soluções:**
1. Veja mensagens de erro no topo da página
2. Abra o console do navegador (F12)
3. Verifique se o Next.js está rodando
4. Teste os endpoints:
   ```bash
   node scripts/test-frontend-endpoints.js
   ```

### Admins não aparecem

**Problema:** Lista de admins vazia

**Soluções:**
1. Recarregue a página (F5)
2. Verifique console do navegador
3. Teste endpoint:
   ```bash
   curl http://localhost:3000/api/servers/SEU_SERVER_ID/admins
   ```

---

## 🧪 TESTAR ENDPOINTS

Antes de usar o dashboard em produção, teste se todos os endpoints estão funcionando:

```bash
# Rode o script de teste
node scripts/test-frontend-endpoints.js

# Resultado esperado:
# ✅ Endpoints existentes: 8/8
# ❌ Endpoints faltantes: 0/8
```

Se houver endpoints faltantes, veja `FASE_6_7_IMPLEMENTACAO.md` para implementá-los.

---

## 📱 MOBILE

O dashboard é **totalmente responsivo**!

- 📱 **Mobile (<640px):** Layout em coluna, campos empilhados
- 📱 **Tablet (640-1024px):** Layout misto
- 💻 **Desktop (>1024px):** Layout completo em grid

---

## 🔒 SEGURANÇA

### Boas Práticas

1. **Nunca compartilhe:** Token Haxball, senhas de admin
2. **Use senhas fortes:** Mínimo 8 caracteres com mix de tipos
3. **Revise admins:** Remova admins inativos regularmente
4. **Monitore logs:** Cheque aba "Logs Admin" frequentemente

### O que é criptografado

- ✅ Senhas de admin (bcrypt)
- ✅ Credenciais SSH (AES-256-GCM)
- ✅ Token Haxball (armazenado de forma segura)

### O que NÃO é exibido

- 🔒 Token atual (só novo token)
- 🔒 Senhas de admin (só hash)
- 🔒 Credenciais SSH

---

## 🆘 SUPORTE

### Logs para Debug

**Frontend (Navegador):**
```javascript
// Abra console (F12) e veja:
// - Requisições de rede
// - Erros em vermelho
// - Avisos em amarelo
```

**Backend (Terminal):**
```bash
# Logs do Next.js
# Aparecem no terminal onde você rodou `npm run dev`

# Formato:
# [PROVISION] Criando diretório...
# [SSH] Conectando...
# [PM2] Processo iniciado
```

**EC2 (Logs do Servidor Haxball):**
```bash
# SSH na EC2
ssh ubuntu@seu-host

# Ver logs do PM2
pm2 logs haxball-server

# Ver processos
pm2 list
```

---

## 🎓 PRÓXIMOS PASSOS

Após dominar o básico:

1. **Customize sua sala:** Teste diferentes mapas e configurações
2. **Adicione admins:** Monte sua equipe de moderação
3. **Monitore estatísticas:** Veja a aba Visão Geral diariamente
4. **Gerencie denúncias:** Aba Moderação
5. **Baixe replays:** Aba Replays → Compartilhe as melhores partidas

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- `FRONTEND_IMPLEMENTADO.md` - Detalhes técnicos do frontend
- `FASE_6_7_IMPLEMENTACAO.md` - Implementação completa do backend
- `RELATORIO_COMPLETO_PROJETO.md` - Visão geral do projeto
- `README.md` - Setup e instalação

---

**Desenvolvido por:** HaxHost Team  
**Data:** 13 de Novembro de 2025  
**Versão:** 1.0

**Dúvidas?** Abra uma issue no GitHub ou contate o suporte! 🚀

