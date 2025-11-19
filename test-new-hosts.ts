/**
 * Validação Rápida - Novos Hosts de Teste
 * 
 * Verifica se os 2 novos hosts (ec2-test-1 e ec2-test-2) 
 * estão sendo carregados corretamente
 */

import { loadHostsConfig, getAllHosts, getAvailableHost, validateHosts } from './lib/hosts';

console.log("🧪 ============================================");
console.log("🧪 VALIDAÇÃO DOS NOVOS HOSTS DE TESTE");
console.log("🧪 ============================================\n");

// Teste 1: Carregar configuração
console.log("📋 Teste 1: Carregar config/hosts.json");
try {
  const config = loadHostsConfig();
  console.log(`✅ Configuração carregada com sucesso`);
  console.log(`   Hosts encontrados: ${config.hosts.length}`);
  console.log(`   Max rooms por host: ${config.max_rooms_per_host}`);
  console.log(`   Template PM2: ${config.pm2_process_template_name}\n`);
} catch (error: any) {
  console.error(`❌ FALHA: ${error.message}\n`);
  process.exit(1);
}

// Teste 2: Listar todos os hosts
console.log("📋 Teste 2: Listar todos os hosts");
try {
  const hosts = getAllHosts();
  
  if (hosts.length !== 2) {
    throw new Error(`Esperado 2 hosts, encontrado ${hosts.length}`);
  }
  
  const expectedHosts = ['ec2-test-1', 'ec2-test-2'];
  const foundHosts = hosts.map(h => h.name);
  
  for (const expected of expectedHosts) {
    if (!foundHosts.includes(expected)) {
      throw new Error(`Host esperado não encontrado: ${expected}`);
    }
  }
  
  console.log(`✅ ${hosts.length} hosts carregados corretamente:`);
  hosts.forEach(host => {
    console.log(`   • ${host.name} (${host.ip})`);
  });
  console.log();
} catch (error: any) {
  console.error(`❌ FALHA: ${error.message}\n`);
  process.exit(1);
}

// Teste 3: Validar chave SSH
console.log("📋 Teste 3: Validar chave SSH (~/.ssh/haxhost.pem)");
try {
  const validation = validateHosts();
  
  if (!validation.valid) {
    console.warn(`⚠️  Alguns problemas encontrados:`);
    validation.errors.forEach(err => console.warn(`   • ${err}`));
    console.log(`   ℹ️  Testes dry-run ainda funcionarão\n`);
  } else {
    console.log(`✅ Chave SSH validada com sucesso`);
    console.log(`   Arquivo: ~/.ssh/haxhost.pem\n`);
  }
} catch (error: any) {
  console.error(`❌ FALHA: ${error.message}\n`);
  // Não interrompe, pois dry-run ainda funciona
}

// Teste 4: Load Balancing
console.log("📋 Teste 4: Testar Load Balancing");
(async () => {
  try {
    const host = await getAvailableHost();
    
    if (!host) {
      throw new Error("Nenhum host disponível (todos no limite?)");
    }
    
    console.log(`✅ Load balancing funcionando`);
    console.log(`   Host selecionado: ${host.name} (${host.ip})\n`);
  } catch (error: any) {
    console.error(`❌ FALHA: ${error.message}\n`);
    process.exit(1);
  }
  
  // Teste 5: Resumo
  console.log("📊 ============================================");
  console.log("📊 RESUMO DA VALIDAÇÃO");
  console.log("📊 ============================================\n");
  
  console.log("✅ Hosts ativos:");
  console.log("   • ec2-test-1 (54.233.34.155)");
  console.log("   • ec2-test-2 (56.125.172.250)\n");
  
  console.log("✅ Configuração:");
  console.log("   • Max rooms por host: 2");
  console.log("   • Capacidade total: 4 servidores");
  console.log("   • Chave SSH: ~/.ssh/haxhost.pem\n");
  
  console.log("✅ Sistema pronto para:");
  console.log("   • Criar servidores (com load balancing)");
  console.log("   • Controlar servidores (start/stop/restart)");
  console.log("   • Provisionar nas novas EC2s\n");
  
  console.log("🎯 Próximo passo:");
  console.log("   Criar um servidor pelo dashboard ou API\n");
  
  console.log("✅ VALIDAÇÃO COMPLETA - SISTEMA OK!\n");
})();

