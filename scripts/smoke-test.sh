#!/bin/bash

# =================================================================
# SMOKE TEST - Provisionamento Automático HaxHost
# =================================================================
# Testa o fluxo completo de criação, provisionamento e controle
# de servidores Haxball

set -e

# Configuração
BASE_URL="${HAXHOST_URL:-http://localhost:3000}"
AUTH_TOKEN="${TEST_AUTH_TOKEN:-}"

if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ ERROR: TEST_AUTH_TOKEN não configurado"
  echo "Export seu token JWT: export TEST_AUTH_TOKEN='seu-token-aqui'"
  exit 1
fi

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🧪 SMOKE TEST - Provisionamento      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}URL:${NC} $BASE_URL"
echo -e "${BLUE}Token:${NC} ${AUTH_TOKEN:0:20}..."
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Função de teste
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  local description=$5
  
  echo -n "[$method] $description... "
  
  response=$(curl -s -w "\n%{http_code}" \
    -X "$method" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    ${data:+-d "$data"} \
    "$BASE_URL$endpoint" 2>&1)
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$status_code" == "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "$body"
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
    echo -e "${RED}Response: $body${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

# =================================================================
# TEST 1: Criar Servidor
# =================================================================
echo -e "${YELLOW}📝 TEST 1: Criando servidor de teste${NC}"
echo ""

SERVER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "name":"⚽ Smoke Test Server",
    "map":"Big",
    "maxPlayers":16,
    "isPublic":true
  }' \
  "$BASE_URL/api/servers")

SERVER_ID=$(echo "$SERVER_RESPONSE" | jq -r '.server.id // empty')

if [ -z "$SERVER_ID" ] || [ "$SERVER_ID" == "null" ]; then
  echo -e "${RED}✗ Falha ao criar servidor${NC}"
  echo "Response: $SERVER_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Servidor criado com sucesso!${NC}"
echo -e "${BLUE}Server ID:${NC} $SERVER_ID"
echo ""

# =================================================================
# TEST 2: Adicionar Admins
# =================================================================
echo -e "${YELLOW}👑 TEST 2: Adicionando admins${NC}"
echo ""

test_endpoint POST "/api/servers/$SERVER_ID/admins" \
  '{"password":"testadmin123","label":"Test Admin 1"}' \
  200 \
  "Adicionar admin 1"

test_endpoint POST "/api/servers/$SERVER_ID/admins" \
  '{"password":"superadmin456","label":"Super Admin"}' \
  200 \
  "Adicionar admin 2"

echo ""

# =================================================================
# TEST 3: Listar Admins
# =================================================================
echo -e "${YELLOW}📋 TEST 3: Listando admins${NC}"
echo ""

test_endpoint GET "/api/servers/$SERVER_ID/admins" \
  "" \
  200 \
  "Listar admins"

echo ""

# =================================================================
# TEST 4: Atualizar Configuração (sem restart)
# =================================================================
echo -e "${YELLOW}⚙️  TEST 4: Atualizando configuração${NC}"
echo ""

test_endpoint PATCH "/api/servers/$SERVER_ID/config" \
  '{"name":"⚽🔥 Updated Smoke Test","maxPlayers":20,"map":"bazinga"}' \
  200 \
  "Atualizar config (sem restart)"

echo ""

# =================================================================
# TEST 5: Provisionamento
# =================================================================
echo -e "${YELLOW}🚀 TEST 5: Provisionando servidor (pode levar 30s)${NC}"
echo ""

PROVISION_START=$(date +%s)

test_endpoint POST "/api/servers/$SERVER_ID/provision" \
  '{"token":"thr1.TESTTOKEN123456789ABC.9876543210ABCDEF"}' \
  200 \
  "Provisionar servidor"

PROVISION_END=$(date +%s)
PROVISION_DURATION=$((PROVISION_END - PROVISION_START))

echo -e "${BLUE}⏱️  Provisionamento levou ${PROVISION_DURATION}s${NC}"
echo ""

# =================================================================
# TEST 6: Verificar Status do Servidor
# =================================================================
echo -e "${YELLOW}📊 TEST 6: Verificando status${NC}"
echo ""

sleep 3  # Aguardar PM2 estabilizar

test_endpoint GET "/api/servers/$SERVER_ID" \
  "" \
  200 \
  "Obter status do servidor"

echo ""

# =================================================================
# TEST 7: Controles PM2
# =================================================================
echo -e "${YELLOW}🎮 TEST 7: Testando controles PM2${NC}"
echo ""

# Stop
test_endpoint POST "/api/servers/$SERVER_ID/control" \
  '{"action":"stop"}' \
  200 \
  "Parar servidor"

sleep 2

# Start
test_endpoint POST "/api/servers/$SERVER_ID/control" \
  '{"action":"start"}' \
  200 \
  "Iniciar servidor"

sleep 2

# Restart
test_endpoint POST "/api/servers/$SERVER_ID/control" \
  '{"action":"restart"}' \
  200 \
  "Reiniciar servidor"

echo ""

# =================================================================
# TEST 8: Restart com Novo Token
# =================================================================
echo -e "${YELLOW}🔑 TEST 8: Restart com novo token${NC}"
echo ""

test_endpoint POST "/api/servers/$SERVER_ID/control" \
  '{"action":"restart","token":"thr1.NEWTOKEN987654321XYZ.FEDCBA0123456789"}' \
  200 \
  "Restart com token dinâmico"

echo ""

# =================================================================
# TEST 9: Atualizar e Reiniciar
# =================================================================
echo -e "${YELLOW}💾🔄 TEST 9: Atualizar config e reiniciar${NC}"
echo ""

test_endpoint PATCH "/api/servers/$SERVER_ID/config" \
  '{"name":"⚽ Final Config","maxPlayers":24,"password":"testpass","restart":true}' \
  200 \
  "Atualizar config com restart"

echo ""

# =================================================================
# TEST 10: Remover Admin
# =================================================================
echo -e "${YELLOW}🗑️  TEST 10: Removendo admin${NC}"
echo ""

# Obter ID do primeiro admin
ADMINS_RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  "$BASE_URL/api/servers/$SERVER_ID/admins")

FIRST_ADMIN_ID=$(echo "$ADMINS_RESPONSE" | jq -r '.admins[0].id // empty')

if [ -n "$FIRST_ADMIN_ID" ] && [ "$FIRST_ADMIN_ID" != "null" ]; then
  test_endpoint DELETE "/api/servers/$SERVER_ID/admins/$FIRST_ADMIN_ID" \
    "" \
    200 \
    "Remover admin"
else
  echo -e "${YELLOW}⚠️  SKIP - Nenhum admin encontrado para remover${NC}"
fi

echo ""

# =================================================================
# TEST 11: Verificar Replays (se houver)
# =================================================================
echo -e "${YELLOW}🎬 TEST 11: Verificando replays${NC}"
echo ""

test_endpoint GET "/api/servers/$SERVER_ID/replays" \
  "" \
  200 \
  "Listar replays"

echo ""

# =================================================================
# TEST 12: Verificar Chat Messages
# =================================================================
echo -e "${YELLOW}💬 TEST 12: Verificando mensagens${NC}"
echo ""

test_endpoint GET "/api/servers/$SERVER_ID/chat" \
  "" \
  200 \
  "Listar mensagens de chat"

echo ""

# =================================================================
# CLEANUP (OPCIONAL)
# =================================================================
echo -e "${YELLOW}🧹 CLEANUP${NC}"
echo ""
echo -e "${BLUE}Servidor de teste: $SERVER_ID${NC}"
echo -e "${YELLOW}Para deletar manualmente:${NC}"
echo "curl -X DELETE -H \"Authorization: Bearer \$TEST_AUTH_TOKEN\" $BASE_URL/api/servers/$SERVER_ID"
echo ""

# Descomente para auto-cleanup:
# test_endpoint DELETE "/api/servers/$SERVER_ID" "" 200 "Deletar servidor de teste"

# =================================================================
# RESULTADOS
# =================================================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          RESULTADOS DO TESTE           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Testes Passou:${NC} $TESTS_PASSED"
echo -e "${RED}✗ Testes Falhou:${NC} $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}════════════════════════════════════════${NC}"
  echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM! 🎉${NC}"
  echo -e "${GREEN}════════════════════════════════════════${NC}"
  exit 0
else
  echo -e "${RED}════════════════════════════════════════${NC}"
  echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
  echo -e "${RED}════════════════════════════════════════${NC}"
  exit 1
fi

