#!/bin/bash

# Script para corrigir params em Next.js 15
# No Next.js 15, params é Promise<{ key: value }>

echo "🔧 Corrigindo params do Next.js 15..."

# Lista de arquivos a corrigir
FILES=(
  "app/api/servers/[serverId]/chat/route.ts"
  "app/api/servers/[serverId]/replays/route.ts"
  "app/api/servers/[serverId]/entries/route.ts"
  "app/api/servers/[serverId]/bans/route.ts"
  "app/api/servers/[serverId]/reports/route.ts"
  "app/api/servers/[serverId]/bans/clear/route.ts"
  "app/api/servers/[serverId]/bans/remove/route.ts"
  "app/api/servers/[serverId]/reports/[reportId]/route.ts"
  "app/api/servers/[serverId]/control/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  Corrigindo: $file"
    
    # Substituir { params }: { params: { serverId: string } }
    # por { params }: { params: Promise<{ serverId: string }> }
    sed -i 's/{ params }: { params: { serverId: string } }/{ params }: { params: Promise<{ serverId: string }> }/g' "$file"
    
    # Substituir { params }: { params: { serverId: string; reportId: string } }
    # por { params }: { params: Promise<{ serverId: string; reportId: string }> }
    sed -i 's/{ params }: { params: { serverId: string; reportId: string } }/{ params }: { params: Promise<{ serverId: string; reportId: string }> }/g' "$file"
  fi
done

echo "✅ Correção concluída!"

