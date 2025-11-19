#!/bin/bash
# ============================================
# SCRIPT DE SETUP E TESTE - SISTEMA MULTI-HOST
# ============================================
# 
# Este script configura e testa o sistema multi-host do HaxHost
# Execute no diretório raiz do projeto:
#   bash setup-and-test-multi-host.sh
#

set -e

REPO_DIR="${1:-$(pwd)}"
cd "$REPO_DIR"

echo "============================================"
echo "🚀 SETUP E TESTE - SISTEMA MULTI-HOST"
echo "============================================"
echo ""
echo "📂 Diretório: $REPO_DIR"
echo ""

# ============================================
# 1) BACKUP DO hosts.json ATUAL
# ============================================
echo "1️⃣ Backup do hosts.json atual (se existir)..."

mkdir -p config/backup

if [ -f config/hosts.json ]; then
  BACKUP_FILE="config/backup/hosts.json.$(date +%s)"
  cp config/hosts.json "$BACKUP_FILE"
  echo "   ✅ Backup criado: $BACKUP_FILE"
else
  echo "   ℹ️  Nenhum hosts.json anterior encontrado"
fi

# ============================================
# 2) CRIAR NOVO config/hosts.json
# ============================================
echo ""
echo "2️⃣ Criando novo config/hosts.json..."

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

echo "   ✅ config/hosts.json criado com 3 EC2s"

# ============================================
# 3) VALIDAR CHAVES SSH
# ============================================
echo ""
echo "3️⃣ Validando chaves SSH..."

KEYS_OK=true

# Verificar billyhax.pem
if [ -f ~/.ssh/billyhax.pem ]; then
  echo "   ✅ ~/.ssh/billyhax.pem existe"
  chmod 400 ~/.ssh/billyhax.pem 2>/dev/null || true
  echo "   ✅ Permissões ajustadas (400)"
else
  echo "   ⚠️  ~/.ssh/billyhax.pem NÃO ENCONTRADA"
  KEYS_OK=false
fi

# Verificar haxhost.pem
if [ -f ~/.ssh/haxhost.pem ]; then
  echo "   ✅ ~/.ssh/haxhost.pem existe"
  chmod 400 ~/.ssh/haxhost.pem 2>/dev/null || true
  echo "   ✅ Permissões ajustadas (400)"
else
  echo "   ⚠️  ~/.ssh/haxhost.pem NÃO ENCONTRADA"
  KEYS_OK=false
fi

if [ "$KEYS_OK" = false ]; then
  echo ""
  echo "   ⚠️  AVISO: Algumas chaves SSH não foram encontradas."
  echo "   ℹ️  Testes SSH reais falharão, mas dry-run funcionará."
fi

# ============================================
# 4) ATUALIZAR .env.local (se necessário)
# ============================================
echo ""
echo "4️⃣ Verificando .env.local..."

if [ ! -f .env.local ]; then
  echo "   ⚠️  .env.local não existe!"
  echo "   ℹ️  Execute o setup do banco de dados primeiro."
else
  echo "   ✅ .env.local existe"
  
  # Garantir que NODE_ENV não está setado como production
  if grep -q '^NODE_ENV=production' .env.local; then
    echo "   ⚠️  NODE_ENV=production detectado, removendo..."
    sed -i '/^NODE_ENV=production/d' .env.local
  fi
fi

# ============================================
# 5) VERIFICAR/MATAR PROCESSOS NA PORTA 3000
# ============================================
echo ""
echo "5️⃣ Verificando porta 3000..."

PIDS=$(lsof -iTCP:3000 -sTCP:LISTEN -t 2>/dev/null || true)

if [ -n "$PIDS" ]; then
  echo "   ⚠️  Processos encontrados na porta 3000: $PIDS"
  echo "   🔪 Encerrando processos..."
  kill -9 $PIDS 2>/dev/null || true
  sleep 2
  echo "   ✅ Porta 3000 liberada"
else
  echo "   ✅ Porta 3000 já está livre"
fi

# ============================================
# 6) RODAR TESTES SIMULADOS
# ============================================
echo ""
echo "6️⃣ Executando testes simulados..."
echo ""

# Exportar variáveis de ambiente
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs) 2>/dev/null || true
fi

# Rodar teste principal
if [ -f test-multi-host-routes.ts ]; then
  echo "   🧪 Rodando test-multi-host-routes.ts..."
  npx tsx test-multi-host-routes.ts 2>&1 | tee test-output.log
  
  if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo "   ✅ Testes passaram com sucesso!"
  else
    echo ""
    echo "   ❌ Alguns testes falharam. Veja test-output.log"
  fi
else
  echo "   ⚠️  test-multi-host-routes.ts não encontrado"
fi

# ============================================
# 7) INSTRUÇÕES PARA TESTES MANUAIS
# ============================================
echo ""
echo "============================================"
echo "📋 PRÓXIMOS PASSOS"
echo "============================================"
echo ""
echo "✅ Setup concluído! Agora você pode:"
echo ""
echo "1️⃣ Iniciar o servidor Next.js:"
echo "   npm run dev"
echo ""
echo "2️⃣ Testar criação de servidor (via curl):"
echo "   curl -X POST \"http://localhost:3000/api/servers\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -H \"Cookie: next-auth.session-token=SEU_TOKEN\" \\"
echo "     -d '{\"name\":\"Sala Teste\",\"maxPlayers\":10}'"
echo ""
echo "3️⃣ Testar controle (dry-run):"
echo "   curl -X POST \"http://localhost:3000/api/servers/{SERVER_ID}/control\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -H \"Cookie: next-auth.session-token=SEU_TOKEN\" \\"
echo "     -d '{\"action\":\"restart\",\"dryRun\":true}'"
echo ""
echo "4️⃣ Acessar dashboard:"
echo "   http://localhost:3000/dashboard"
echo ""
echo "============================================"
echo "📊 RESUMO DA CONFIGURAÇÃO"
echo "============================================"
echo ""
echo "📁 Arquivos:"
echo "   • config/hosts.json (3 EC2s configuradas)"
echo "   • test-output.log (resultado dos testes)"
echo ""
echo "🔑 Chaves SSH:"
echo "   • ~/.ssh/billyhax.pem (azzura)"
echo "   • ~/.ssh/haxhost.pem (sv1, sv2)"
echo ""
echo "🧪 Testes:"
echo "   • test-multi-host-routes.ts (lógica de negócio)"
echo ""
echo "🚀 Para iniciar o servidor:"
echo "   npm run dev"
echo ""
echo "============================================"
echo "✅ SETUP COMPLETO!"
echo "============================================"

