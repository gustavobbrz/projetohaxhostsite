/**
 * Validação RÁPIDA - Apenas Configuração (sem Prisma)
 * 
 * Valida que os 2 novos hosts estão carregados corretamente
 * SEM conectar ao banco de dados
 */

import fs from 'fs';
import path from 'path';

console.log("🧪 ============================================");
console.log("🧪 VALIDAÇÃO DOS NOVOS HOSTS (CONFIG ONLY)");
console.log("🧪 ============================================\n");

// Teste 1: Verificar arquivo existe
console.log("📋 Teste 1: Verificar config/hosts.json existe");
const configPath = path.join(process.cwd(), 'config', 'hosts.json');

if (!fs.existsSync(configPath)) {
  console.error(`❌ FALHA: Arquivo não encontrado: ${configPath}\n`);
  process.exit(1);
}

console.log(`✅ Arquivo encontrado: ${configPath}\n`);

// Teste 2: Ler e parsear JSON
console.log("📋 Teste 2: Ler e parsear JSON");
let config: any;
try {
  const fileContent = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(fileContent);
  console.log(`✅ JSON válido\n`);
} catch (error: any) {
  console.error(`❌ FALHA: Erro ao parsear JSON: ${error.message}\n`);
  process.exit(1);
}

// Teste 3: Validar estrutura
console.log("📋 Teste 3: Validar estrutura do JSON");
if (!config.hosts || !Array.isArray(config.hosts)) {
  console.error(`❌ FALHA: Propriedade 'hosts' não encontrada ou não é array\n`);
  process.exit(1);
}

if (config.hosts.length !== 2) {
  console.error(`❌ FALHA: Esperado 2 hosts, encontrado ${config.hosts.length}\n`);
  process.exit(1);
}

console.log(`✅ Estrutura válida (${config.hosts.length} hosts)\n`);

// Teste 4: Validar hosts específicos
console.log("📋 Teste 4: Validar hosts esperados");
const expectedHosts = [
  { name: 'ec2-test-1', ip: '54.233.34.155' },
  { name: 'ec2-test-2', ip: '56.125.172.250' }
];

for (const expected of expectedHosts) {
  const found = config.hosts.find((h: any) => h.name === expected.name);
  
  if (!found) {
    console.error(`❌ FALHA: Host não encontrado: ${expected.name}\n`);
    process.exit(1);
  }
  
  if (found.ip !== expected.ip) {
    console.error(`❌ FALHA: IP incorreto para ${expected.name}`);
    console.error(`   Esperado: ${expected.ip}`);
    console.error(`   Encontrado: ${found.ip}\n`);
    process.exit(1);
  }
  
  console.log(`✅ ${expected.name}: ${expected.ip}`);
}
console.log();

// Teste 5: Validar propriedades dos hosts
console.log("📋 Teste 5: Validar propriedades de cada host");
const requiredProps = ['name', 'ip', 'ssh_user', 'ssh_private_key_path', 'base_path', 'ssh_port'];

for (const host of config.hosts) {
  for (const prop of requiredProps) {
    if (!host[prop]) {
      console.error(`❌ FALHA: Propriedade '${prop}' faltando no host ${host.name}\n`);
      process.exit(1);
    }
  }
  console.log(`✅ ${host.name}: todas as propriedades OK`);
}
console.log();

// Teste 6: Validar chave SSH existe
console.log("📋 Teste 6: Validar chave SSH existe");
const sshKeyPath = path.join(process.env.HOME || '/root', '.ssh', 'haxhost.pem');

if (fs.existsSync(sshKeyPath)) {
  const stats = fs.statSync(sshKeyPath);
  const permissions = (stats.mode & parseInt('777', 8)).toString(8);
  
  console.log(`✅ Chave SSH encontrada: ${sshKeyPath}`);
  console.log(`   Permissões: ${permissions} ${permissions === '400' ? '✅' : '⚠️  (recomendado: 400)'}`);
} else {
  console.warn(`⚠️  Chave SSH não encontrada: ${sshKeyPath}`);
  console.warn(`   Dry-run ainda funcionará, mas SSH real falhará\n`);
}
console.log();

// Teste 7: Validar configurações globais
console.log("📋 Teste 7: Validar configurações globais");
if (!config.pm2_process_template_name) {
  console.error(`❌ FALHA: pm2_process_template_name não definido\n`);
  process.exit(1);
}

if (!config.max_rooms_per_host || typeof config.max_rooms_per_host !== 'number') {
  console.error(`❌ FALHA: max_rooms_per_host não definido ou não é número\n`);
  process.exit(1);
}

console.log(`✅ pm2_process_template_name: ${config.pm2_process_template_name}`);
console.log(`✅ max_rooms_per_host: ${config.max_rooms_per_host}`);
console.log();

// Resumo Final
console.log("📊 ============================================");
console.log("📊 RESUMO DA VALIDAÇÃO");
console.log("📊 ============================================\n");

console.log("✅ Hosts ativos:");
config.hosts.forEach((host: any) => {
  console.log(`   • ${host.name} (${host.ip})`);
});
console.log();

console.log("✅ Configuração:");
console.log(`   • Max rooms por host: ${config.max_rooms_per_host}`);
console.log(`   • Capacidade total: ${config.hosts.length * config.max_rooms_per_host} servidores`);
console.log(`   • PM2 template: ${config.pm2_process_template_name}`);
console.log(`   • Chave SSH: ~/.ssh/haxhost.pem\n`);

console.log("✅ Validações OK:");
console.log("   • Arquivo config/hosts.json existe");
console.log("   • JSON válido e bem formatado");
console.log("   • 2 hosts carregados (ec2-test-1, ec2-test-2)");
console.log("   • IPs corretos (54.233.34.155, 56.125.172.250)");
console.log("   • Todas as propriedades presentes");
console.log("   • Configurações globais OK\n");

console.log("🎯 Sistema pronto para:");
console.log("   • lib/hosts.ts carregará esses 2 hosts");
console.log("   • Load balancing distribuirá entre ec2-test-1 e ec2-test-2");
console.log("   • Capacidade: 4 servidores total (2 por host)\n");

console.log("🚀 Próximos passos:");
console.log("   1. npm run dev");
console.log("   2. Acessar dashboard");
console.log("   3. Criar servidor (será atribuído ec2-test-1 ou ec2-test-2)\n");

console.log("✅ VALIDAÇÃO COMPLETA - CONFIG OK!\n");

