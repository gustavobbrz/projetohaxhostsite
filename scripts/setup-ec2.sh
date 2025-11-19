#!/bin/bash
# ============================================
# SCRIPT DE SETUP PARA EC2s HAXHOST
# ============================================
#
# Execute este script em cada EC2 para preparar
# para receber servidores Haxball via HaxHost
#
# Uso:
#   bash setup-ec2.sh
#

set -e

echo "============================================"
echo "🚀 SETUP EC2 PARA HAXHOST"
echo "============================================"
echo ""

# Detectar IP da EC2
IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "DESCONHECIDO")
echo "📍 IP desta EC2: $IP"
echo ""

# ============================================
# 1) ATUALIZAR SISTEMA
# ============================================
echo "1️⃣ Atualizando sistema..."
sudo apt-get update -qq
echo "   ✅ Sistema atualizado"
echo ""

# ============================================
# 2) INSTALAR NODE.JS 20.x
# ============================================
echo "2️⃣ Verificando Node.js..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js já instalado: $NODE_VERSION"
else
    echo "   📦 Instalando Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "   ✅ Node.js instalado: $(node -v)"
fi
echo ""

# ============================================
# 3) INSTALAR PM2 GLOBALMENTE
# ============================================
echo "3️⃣ Verificando PM2..."

if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    echo "   ✅ PM2 já instalado: v$PM2_VERSION"
else
    echo "   📦 Instalando PM2..."
    sudo npm install -g pm2
    echo "   ✅ PM2 instalado: v$(pm2 -v)"
fi
echo ""

# ============================================
# 4) CONFIGURAR PM2 STARTUP
# ============================================
echo "4️⃣ Configurando PM2 startup..."

# Gerar script de startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Salvar configuração
pm2 save

echo "   ✅ PM2 configurado para iniciar no boot"
echo ""

# ============================================
# 5) CRIAR ESTRUTURA DE PASTAS
# ============================================
echo "5️⃣ Criando estrutura de pastas..."

BASE_PATH="/home/ubuntu/meu-servidor-haxball"

mkdir -p "$BASE_PATH"
mkdir -p "$BASE_PATH/logs"

echo "   ✅ Pasta criada: $BASE_PATH"
echo ""

# ============================================
# 6) INSTALAR DEPENDÊNCIAS DO HAXBALL
# ============================================
echo "6️⃣ Instalando dependências do Haxball..."

cd "$BASE_PATH"

# Criar package.json se não existir
if [ ! -f "package.json" ]; then
    cat > package.json << 'PACKAGE_JSON'
{
  "name": "haxball-servers",
  "version": "1.0.0",
  "description": "Servidores Haxball gerenciados pelo HaxHost",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["haxball"],
  "author": "HaxHost",
  "license": "ISC",
  "dependencies": {
    "haxball.js": "^3.0.0",
    "node-fetch": "^2.7.0",
    "express": "^5.1.0",
    "form-data": "^4.0.2",
    "buffer": "^6.0.3"
  }
}
PACKAGE_JSON
    echo "   ✅ package.json criado"
fi

# Instalar dependências
npm install --production

echo "   ✅ Dependências instaladas:"
npm list --depth=0 | grep -E "haxball|node-fetch|express|form-data|buffer" || true
echo ""

# ============================================
# 7) CRIAR SCRIPT DE TESTE
# ============================================
echo "7️⃣ Criando script de teste..."

cat > "$BASE_PATH/test-haxball.js" << 'TEST_SCRIPT'
// Script de teste simples
console.log("✅ Node.js funciona!");
console.log("✅ Pasta base:", __dirname);

// Testar dependências
try {
  require("haxball.js");
  console.log("✅ haxball.js OK");
} catch (e) {
  console.error("❌ haxball.js não encontrado:", e.message);
}

try {
  require("node-fetch");
  console.log("✅ node-fetch OK");
} catch (e) {
  console.error("❌ node-fetch não encontrado:", e.message);
}

try {
  require("express");
  console.log("✅ express OK");
} catch (e) {
  console.error("❌ express não encontrado:", e.message);
}

console.log("\n✅ Setup completo! EC2 pronta para receber servidores.");
process.exit(0);
TEST_SCRIPT

# Executar teste
node "$BASE_PATH/test-haxball.js"
echo ""

# ============================================
# 8) CONFIGURAR FIREWALL (se necessário)
# ============================================
echo "8️⃣ Verificando firewall..."

if command -v ufw &> /dev/null; then
    sudo ufw status | grep -q "Status: active" && {
        echo "   📝 UFW ativo - certifique-se de que portas necessárias estão abertas"
        echo "   Portas recomendadas: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (webhook)"
    } || {
        echo "   ℹ️  UFW não está ativo"
    }
else
    echo "   ℹ️  UFW não instalado"
fi
echo ""

# ============================================
# 9) RESUMO FINAL
# ============================================
echo "============================================"
echo "✅ SETUP CONCLUÍDO COM SUCESSO!"
echo "============================================"
echo ""
echo "📊 Resumo:"
echo "   • IP: $IP"
echo "   • Node.js: $(node -v)"
echo "   • NPM: $(npm -v)"
echo "   • PM2: v$(pm2 -v)"
echo "   • Pasta base: $BASE_PATH"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Configure Security Group (AWS) para permitir:"
echo "      - SSH (22) do seu IP"
echo "      - Webhook (3000) do HaxHost (se necessário)"
echo ""
echo "   2. No HaxHost, verifique config/hosts.json:"
echo "      - IP desta EC2: $IP"
echo "      - Caminho base: $BASE_PATH"
echo ""
echo "   3. Crie um servidor via Dashboard:"
echo "      - Sistema vai escolher esta EC2 automaticamente"
echo "      - Provisionar vai enviar o script via SSH"
echo "      - PM2 vai iniciar a sala"
echo ""
echo "📋 Verificar setup:"
echo "   pm2 list          # ver processos PM2"
echo "   pm2 logs          # ver logs de todos"
echo "   cd $BASE_PATH && ls -la  # ver arquivos"
echo ""
echo "✅ EC2 pronta para receber servidores Haxball!"
echo "============================================"

