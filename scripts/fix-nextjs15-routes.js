const fs = require('fs');
const path = require('path');

const files = [
  'app/api/servers/[serverId]/replays/route.ts',
  'app/api/servers/[serverId]/entries/route.ts',
  'app/api/servers/[serverId]/bans/route.ts',
  'app/api/servers/[serverId]/reports/route.ts',
  'app/api/servers/[serverId]/bans/clear/route.ts',
  'app/api/servers/[serverId]/bans/remove/route.ts',
  'app/api/servers/[serverId]/reports/[reportId]/route.ts',
  'app/api/servers/[serverId]/control/route.ts',
];

console.log('🔧 Corrigindo params para Next.js 15...\n');

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Pulando ${file} (não encontrado)`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Pattern 1: serverId only
  const pattern1 = /\{ params \}: \{ params: \{ serverId: string \} \}/g;
  if (content.match(pattern1)) {
    content = content.replace(
      pattern1,
      '{ params }: { params: Promise<{ serverId: string }> }'
    );
    
    // Adicionar await params logo após a assinatura da função
    content = content.replace(
      /(\{ params \}: \{ params: Promise<\{ serverId: string \}> \}\s*\)\s*\{\s*)(try \{)/g,
      '$1const { serverId } = await params;\n  $2'
    );
    
    // Remover const { serverId } = params; duplicados
    content = content.replace(
      /const \{ serverId \} = params;\s*/g,
      ''
    );
    
    changed = true;
  }
  
  // Pattern 2: serverId + reportId
  const pattern2 = /\{ params \}: \{ params: \{ serverId: string; reportId: string \} \}/g;
  if (content.match(pattern2)) {
    content = content.replace(
      pattern2,
      '{ params }: { params: Promise<{ serverId: string; reportId: string }> }'
    );
    
    // Adicionar await params
    content = content.replace(
      /(\{ params \}: \{ params: Promise<\{ serverId: string; reportId: string \}> \}\s*\)\s*\{\s*)(try \{)/g,
      '$1const { serverId, reportId } = await params;\n  $2'
    );
    
    // Remover const { serverId, reportId } = params; duplicados
    content = content.replace(
      /const \{ serverId, reportId \} = params;\s*/g,
      ''
    );
    
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file}`);
  } else {
    console.log(`⏭️  ${file} (já corrigido)`);
  }
});

console.log('\n✅ Correção concluída!');

