#!/bin/bash

# Script de teste para webhook ROOM_OPEN
# Envia um roomLink de teste para o endpoint local

API_URL="${API_URL:-http://localhost:3000}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-haxhost-secret-2024}"
PM2_PROCESS_NAME="${PM2_PROCESS_NAME:-haxball-server}"
TEST_ROOM_LINK="https://www.haxball.com/play?c=TEST_ABCD123"

echo "🧪 Testando webhook ROOM_OPEN..."
echo "URL: $API_URL/api/webhook/game-event"
echo "PM2 Process: $PM2_PROCESS_NAME"
echo "Room Link: $TEST_ROOM_LINK"
echo ""

# Enviar evento ROOM_OPEN
curl -X POST "$API_URL/api/webhook/game-event" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -d "{
    \"eventType\": \"ROOM_OPEN\",
    \"pm2ProcessName\": \"$PM2_PROCESS_NAME\",
    \"data\": {
      \"roomLink\": \"$TEST_ROOM_LINK\"
    }
  }" \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Teste concluído!"
echo ""
echo "📊 Verifique o banco de dados:"
echo "   npx prisma studio"
echo ""
echo "🔍 Ou consulte via SQL:"
echo "   SELECT id, name, pm2ProcessName, roomLink, status FROM Server WHERE pm2ProcessName='$PM2_PROCESS_NAME';"

