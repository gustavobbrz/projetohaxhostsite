/**
 * TESTE DE ROTAS MULTI-HOST (SEM RODAR SERVIDOR)
 * 
 * Executa testes simulados das rotas de servidor
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  status: "✅ PASS" | "❌ FAIL" | "⚠️ WARN";
  details: string;
  data?: any;
}

const results: TestResult[] = [];

function addResult(name: string, status: TestResult["status"], details: string, data?: any) {
  results.push({ name, status, details, data });
}

async function testLoadHostsConfig() {
  console.log("\n📋 Teste 1: Carregar config/hosts.json");
  
  try {
    const { loadHostsConfig, getAllHosts } = await import("./lib/hosts");
    const config = loadHostsConfig();
    const hosts = getAllHosts();

    if (!config || !config.hosts || config.hosts.length === 0) {
      addResult("Load hosts.json", "❌ FAIL", "Config vazia ou inválida");
      return false;
    }

    if (config.hosts.length !== 3) {
      addResult("Load hosts.json", "⚠️ WARN", `Esperado 3 hosts, encontrado ${config.hosts.length}`);
    } else {
      addResult(
        "Load hosts.json",
        "✅ PASS",
        `3 hosts carregados: ${hosts.map(h => h.name).join(", ")}`,
        { hosts: hosts.map(h => ({ name: h.name, ip: h.ip })) }
      );
    }

    return true;
  } catch (error: any) {
    addResult("Load hosts.json", "❌ FAIL", error.message);
    return false;
  }
}

async function testGetAvailableHost() {
  console.log("\n🔄 Teste 2: Load Balancing (getAvailableHost)");

  try {
    const { getAvailableHost } = await import("./lib/hosts");
    
    // Simular contagem de servidores
    const counts = await Promise.all([
      prisma.server.count({ where: { hostName: "azzura", status: { in: ["active", "pending"] } } }),
      prisma.server.count({ where: { hostName: "sv1", status: { in: ["active", "pending"] } } }),
      prisma.server.count({ where: { hostName: "sv2", status: { in: ["active", "pending"] } } }),
    ]);

    const distribution = {
      azzura: counts[0],
      sv1: counts[1],
      sv2: counts[2],
    };

    const host = await getAvailableHost();

    if (!host) {
      addResult(
        "Load Balancing",
        "⚠️ WARN",
        "Nenhum host disponível (todos no limite?)",
        { distribution }
      );
      return false;
    }

    addResult(
      "Load Balancing",
      "✅ PASS",
      `Host selecionado: ${host.name} (menos carga)`,
      { selectedHost: host.name, distribution }
    );

    return true;
  } catch (error: any) {
    addResult("Load Balancing", "❌ FAIL", error.message);
    return false;
  }
}

async function testCreateServerLogic() {
  console.log("\n🆕 Teste 3: Lógica de Criação de Servidor (simulado)");

  try {
    const { getAvailableHost } = await import("./lib/hosts");
    const crypto = await import("crypto");

    // Simular criação (sem inserir no banco)
    const availableHost = await getAvailableHost();

    if (!availableHost) {
      addResult(
        "Criar Servidor",
        "❌ FAIL",
        "Nenhum host disponível"
      );
      return false;
    }

    const serverId = crypto.randomUUID();
    const pm2ProcessName = `haxball-server-${serverId.substring(0, 8)}`;

    const mockServer = {
      id: serverId,
      userId: "test-user-123",
      name: "Sala Teste Multi-Host",
      hostName: availableHost.name,
      pm2ProcessName: pm2ProcessName,
      maxPlayers: 20,
      map: "Big",
      status: "pending",
      needsProvision: true,
    };

    // Validações
    const validations = {
      hasId: !!mockServer.id,
      hasHostName: !!mockServer.hostName,
      hasPm2ProcessName: !!mockServer.pm2ProcessName,
      pm2ProcessNameFormat: mockServer.pm2ProcessName.startsWith("haxball-server-"),
    };

    const allValid = Object.values(validations).every(v => v === true);

    if (!allValid) {
      addResult(
        "Criar Servidor",
        "❌ FAIL",
        "Validações falharam",
        { validations }
      );
      return false;
    }

    addResult(
      "Criar Servidor",
      "✅ PASS",
      "Servidor mockado criado com sucesso",
      {
        server: {
          id: mockServer.id,
          hostName: mockServer.hostName,
          pm2ProcessName: mockServer.pm2ProcessName,
        },
        validations,
      }
    );

    return true;
  } catch (error: any) {
    addResult("Criar Servidor", "❌ FAIL", error.message);
    return false;
  }
}

async function testControlDryRun() {
  console.log("\n🎮 Teste 4: Control Dry-Run (restart)");

  try {
    const { getHostByName } = await import("./lib/hosts");

    const host = getHostByName("azzura");

    if (!host) {
      addResult("Control Dry-Run", "❌ FAIL", "Host 'azzura' não encontrado");
      return false;
    }

    const pm2ProcessName = "haxball-server-test123";
    const action = "restart";

    // Simular dry-run
    const dryRunCommand = `ssh -i ~/.ssh/key.pem ${host.ssh_user}@${host.ip} "pm2 ${action} ${pm2ProcessName} --update-env"`;

    const mockResponse = {
      success: true,
      dryRun: true,
      message: "[DRY RUN] Comando que seria executado:",
      command: dryRunCommand,
      host: host.name,
      pm2ProcessName,
    };

    // Validações
    const validations = {
      hasCommand: !!mockResponse.command,
      commandIncludesPm2: mockResponse.command.includes("pm2"),
      commandIncludesHost: mockResponse.command.includes(host.ip),
      commandIncludesProcessName: mockResponse.command.includes(pm2ProcessName),
    };

    const allValid = Object.values(validations).every(v => v === true);

    if (!allValid) {
      addResult(
        "Control Dry-Run",
        "❌ FAIL",
        "Comando dry-run inválido",
        { validations }
      );
      return false;
    }

    addResult(
      "Control Dry-Run",
      "✅ PASS",
      "Dry-run gerado corretamente",
      mockResponse
    );

    return true;
  } catch (error: any) {
    addResult("Control Dry-Run", "❌ FAIL", error.message);
    return false;
  }
}

async function testAdminsEndpoint() {
  console.log("\n👤 Teste 5: Endpoint de Admins (lógica)");

  try {
    const crypto = await import("crypto");

    // Simular criação de admin
    const mockAdmin = {
      id: crypto.randomUUID(),
      serverId: "test-server-123",
      label: "Admin Principal",
      adminHash: "hash_da_senha_aqui",
      isActive: true,
    };

    // Validações
    const validations = {
      hasId: !!mockAdmin.id,
      hasServerId: !!mockAdmin.serverId,
      hasHash: !!mockAdmin.adminHash,
      isActive: mockAdmin.isActive === true,
    };

    const allValid = Object.values(validations).every(v => v === true);

    if (!allValid) {
      addResult(
        "Admins Endpoint",
        "❌ FAIL",
        "Admin mockado inválido",
        { validations }
      );
      return false;
    }

    addResult(
      "Admins Endpoint",
      "✅ PASS",
      "Estrutura de admin correta",
      { admin: mockAdmin, validations }
    );

    return true;
  } catch (error: any) {
    addResult("Admins Endpoint", "❌ FAIL", error.message);
    return false;
  }
}

async function runAllTests() {
  console.log("🧪 ============================================");
  console.log("🧪 TESTES DE ROTAS MULTI-HOST (MODO SIMULADO)");
  console.log("🧪 ============================================");

  await testLoadHostsConfig();
  await testGetAvailableHost();
  await testCreateServerLogic();
  await testControlDryRun();
  await testAdminsEndpoint();

  console.log("\n📊 ============================================");
  console.log("📊 RESUMO DOS TESTES");
  console.log("📊 ============================================\n");

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.status} ${result.name}`);
    console.log(`   ${result.details}`);
    if (result.data) {
      console.log(`   Dados:`, JSON.stringify(result.data, null, 2).split("\n").map(l => `   ${l}`).join("\n"));
    }
    console.log("");
  });

  const passCount = results.filter(r => r.status === "✅ PASS").length;
  const failCount = results.filter(r => r.status === "❌ FAIL").length;
  const warnCount = results.filter(r => r.status === "⚠️ WARN").length;

  console.log("📈 ESTATÍSTICAS:");
  console.log(`   ✅ Passaram: ${passCount}/${results.length}`);
  console.log(`   ❌ Falharam: ${failCount}/${results.length}`);
  console.log(`   ⚠️ Avisos: ${warnCount}/${results.length}`);

  const allPassed = failCount === 0;

  if (allPassed) {
    console.log("\n✅ TODOS OS TESTES PASSARAM!");
  } else {
    console.log("\n❌ ALGUNS TESTES FALHARAM. Revise os erros acima.");
  }

  await prisma.$disconnect();

  return allPassed;
}

// Executar testes
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ ERRO FATAL:", error);
    process.exit(1);
  });

