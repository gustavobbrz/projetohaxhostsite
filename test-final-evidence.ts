/**
 * TESTES FINAIS COM EVIDÊNCIAS COMPLETAS
 * Executa 4 testes simulados e captura requests/responses
 */

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Mock de auth() para simular usuário autenticado
const mockSession = {
  user: {
    id: "test-user-final-123",
    email: "test-final@haxhost.com",
    name: "Test User Final",
  },
};

// Sobrescrever auth temporariamente
process.env.NODE_ENV = "test";

interface TestLog {
  testName: string;
  curlEquivalent: string;
  requestBody: any;
  responseStatus: number;
  responseBody: any;
  backendLogs: string[];
  pass: boolean;
  failReason?: string;
}

const testLogs: TestLog[] = [];

function log(message: string, logs: string[]) {
  console.log(message);
  logs.push(message);
}

async function runTest(
  testName: string,
  testFn: () => Promise<{
    status: number;
    body: any;
    logs: string[];
    curlEquivalent: string;
    requestBody?: any;
  }>
): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🧪 ${testName}`);
  console.log(`${"=".repeat(60)}\n`);

  try {
    const result = await testFn();

    const pass = result.status < 400;

    testLogs.push({
      testName,
      curlEquivalent: result.curlEquivalent,
      requestBody: result.requestBody || null,
      responseStatus: result.status,
      responseBody: result.body,
      backendLogs: result.logs,
      pass,
      failReason: pass ? undefined : `Status ${result.status}`,
    });

    console.log(`\n📝 CURL EQUIVALENTE:`);
    console.log(result.curlEquivalent);

    if (result.requestBody) {
      console.log(`\n📨 REQUEST BODY:`);
      console.log(JSON.stringify(result.requestBody, null, 2));
    }

    console.log(`\n📊 RESPONSE STATUS: ${result.status}`);
    console.log(`\n📦 RESPONSE BODY:`);
    console.log(JSON.stringify(result.body, null, 2));

    console.log(`\n📋 BACKEND LOGS:`);
    result.logs.forEach((line) => console.log(`   ${line}`));

    console.log(
      `\n${pass ? "✅ PASS" : "❌ FAIL"}: ${testName}`
    );
  } catch (error: any) {
    console.error(`\n❌ ERRO FATAL: ${error.message}`);
    console.error(error.stack);

    testLogs.push({
      testName,
      curlEquivalent: "N/A",
      requestBody: null,
      responseStatus: 500,
      responseBody: { error: error.message },
      backendLogs: [error.stack],
      pass: false,
      failReason: error.message,
    });
  }
}

// ==========================================
// TEST A: GET /api/servers
// ==========================================
async function testA_GetServers() {
  const logs: string[] = [];

  return runTest("TEST A: GET /api/servers", async () => {
    log("[TEST A] Importing handler...", logs);

    // Importar handler dinamicamente
    const { GET } = await import("./app/api/servers/route");

    // Mock request
    const mockRequest = new Request("http://localhost:3000/api/servers", {
      method: "GET",
    });

    log("[TEST A] Calling GET handler...", logs);

    // Mock auth() para retornar sessão
    const authModule = await import("./lib/auth");
    authModule.auth = async () => mockSession as any;

    const response = await GET(mockRequest as any);
    const body = await response.json();

    log(`[TEST A] Response status: ${response.status}`, logs);
    log(`[TEST A] Found ${body.servers?.length || 0} servers`, logs);

    return {
      status: response.status,
      body,
      logs,
      curlEquivalent: 'curl -X GET "http://localhost:3000/api/servers" -H "Cookie: session=..."',
    };
  });
}

// ==========================================
// TEST B: POST /api/servers
// ==========================================
async function testB_CreateServer() {
  const logs: string[] = [];
  const requestBody = {
    name: "Sala Teste Cursor",
    maxPlayers: 10,
  };

  return runTest("TEST B: POST /api/servers (Criar Servidor)", async () => {
    log("[TEST B] Importing handler...", logs);

    const { POST } = await import("./app/api/servers/route");

    const mockRequest = new Request("http://localhost:3000/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    log("[TEST B] Calling POST handler...", logs);
    log(`[TEST B] Request body: ${JSON.stringify(requestBody)}`, logs);

    // Mock auth
    const authModule = await import("./lib/auth");
    authModule.auth = async () => mockSession as any;

    const response = await POST(mockRequest as any);
    const body = await response.json();

    log(`[TEST B] Response status: ${response.status}`, logs);

    if (body.server) {
      log(`[TEST B] Server created with ID: ${body.server.id}`, logs);
      log(`[TEST B] hostName: ${body.server.hostName}`, logs);
      log(`[TEST B] pm2ProcessName: ${body.server.pm2ProcessName}`, logs);
    }

    // Validações
    if (body.success && body.server) {
      if (!body.server.hostName) {
        log("[TEST B] ❌ hostName is NULL!", logs);
      }
      if (!body.server.pm2ProcessName) {
        log("[TEST B] ❌ pm2ProcessName is NULL!", logs);
      }
    }

    return {
      status: response.status,
      body,
      logs,
      curlEquivalent: `curl -X POST "http://localhost:3000/api/servers" -H "Content-Type: application/json" -H "Cookie: session=..." -d '${JSON.stringify(requestBody)}'`,
      requestBody,
    };
  });
}

// ==========================================
// TEST C: POST /api/servers/:id/admins
// ==========================================
async function testC_AddAdmin() {
  const logs: string[] = [];

  return runTest("TEST C: POST /api/servers/:id/admins (Adicionar Admin)", async () => {
    log("[TEST C] Creating test server first...", logs);

    // Criar servidor de teste
    const testServerId = crypto.randomUUID();
    const testServer = await prisma.server.create({
      data: {
        id: testServerId,
        userId: mockSession.user.id,
        name: "Test Server for Admin",
        hostName: "azzura",
        pm2ProcessName: `haxball-server-${testServerId.substring(0, 8)}`,
        status: "pending",
        needsProvision: true,
        updatedAt: new Date(),
      },
    });

    log(`[TEST C] Test server created: ${testServerId}`, logs);

    const requestBody = {
      label: "Admin Principal",
      adminHash: crypto.createHash("sha256").update("test123").digest("hex"),
    };

    log("[TEST C] Importing admins handler...", logs);

    const { POST } = await import("./app/api/servers/[serverId]/admins/route");

    const mockRequest = new Request(
      `http://localhost:3000/api/servers/${testServerId}/admins`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    log("[TEST C] Calling POST handler...", logs);

    // Mock auth
    const authModule = await import("./lib/auth");
    authModule.auth = async () => mockSession as any;

    const response = await POST(mockRequest as any, {
      params: Promise.resolve({ serverId: testServerId }),
    } as any);

    const body = await response.json();

    log(`[TEST C] Response status: ${response.status}`, logs);

    if (body.admin) {
      log(`[TEST C] Admin created with ID: ${body.admin.id}`, logs);
      log(`[TEST C] Admin label: ${body.admin.label}`, logs);
      log(`[TEST C] Password in response? ${body.admin.password ? "YES (BAD)" : "NO (GOOD)"}`, logs);
    }

    // Cleanup
    await prisma.server.delete({ where: { id: testServerId } });

    return {
      status: response.status,
      body,
      logs,
      curlEquivalent: `curl -X POST "http://localhost:3000/api/servers/${testServerId}/admins" -H "Content-Type: application/json" -H "Cookie: session=..." -d '${JSON.stringify({ label: "Admin Principal", adminHash: "HASH_HERE" })}'`,
      requestBody: { ...requestBody, adminHash: "HASH_HERE (truncated)" },
    };
  });
}

// ==========================================
// TEST D: POST /api/servers/:id/control (DRY-RUN)
// ==========================================
async function testD_ControlDryRun() {
  const logs: string[] = [];

  return runTest("TEST D: POST /api/servers/:id/control (DRY-RUN)", async () => {
    log("[TEST D] Creating test server first...", logs);

    // Criar servidor de teste
    const testServerId = crypto.randomUUID();
    const pm2Name = `haxball-server-${testServerId.substring(0, 8)}`;
    
    const testServer = await prisma.server.create({
      data: {
        id: testServerId,
        userId: mockSession.user.id,
        name: "Test Server for Control",
        hostName: "azzura",
        pm2ProcessName: pm2Name,
        status: "active",
        needsProvision: false,
        updatedAt: new Date(),
      },
    });

    log(`[TEST D] Test server created: ${testServerId}`, logs);
    log(`[TEST D] PM2 process name: ${pm2Name}`, logs);

    const requestBody = {
      action: "restart",
      dryRun: true,
    };

    log("[TEST D] Importing control handler...", logs);

    const { POST } = await import("./app/api/servers/[serverId]/control/route");

    const mockRequest = new Request(
      `http://localhost:3000/api/servers/${testServerId}/control`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    log("[TEST D] Calling POST handler (DRY-RUN mode)...", logs);

    // Mock auth
    const authModule = await import("./lib/auth");
    authModule.auth = async () => mockSession as any;

    const response = await POST(mockRequest as any, {
      params: Promise.resolve({ serverId: testServerId }),
    } as any);

    const body = await response.json();

    log(`[TEST D] Response status: ${response.status}`, logs);

    if (body.dryRun) {
      log(`[TEST D] ✅ DRY-RUN mode confirmed`, logs);
      log(`[TEST D] Command: ${body.command}`, logs);
    } else {
      log(`[TEST D] ❌ NOT in dry-run mode!`, logs);
    }

    // Cleanup
    await prisma.server.delete({ where: { id: testServerId } });

    return {
      status: response.status,
      body,
      logs,
      curlEquivalent: `curl -X POST "http://localhost:3000/api/servers/${testServerId}/control" -H "Content-Type: application/json" -H "Cookie: session=..." -d '${JSON.stringify(requestBody)}'`,
      requestBody,
    };
  });
}

// ==========================================
// MAIN
// ==========================================
async function main() {
  console.log("🧪 ============================================");
  console.log("🧪 TESTES FINAIS COM EVIDÊNCIAS COMPLETAS");
  console.log("🧪 ============================================");

  await testA_GetServers();
  await testB_CreateServer();
  await testC_AddAdmin();
  await testD_ControlDryRun();

  console.log("\n\n📊 ============================================");
  console.log("📊 RESUMO FINAL - CHECKLIST");
  console.log("📊 ============================================\n");

  testLogs.forEach((test, index) => {
    console.log(`${test.pass ? "✅ PASS" : "❌ FAIL"} | ${test.testName}`);
    if (!test.pass && test.failReason) {
      console.log(`         Razão: ${test.failReason}`);
    }
  });

  const passCount = testLogs.filter((t) => t.pass).length;
  const failCount = testLogs.filter((t) => !t.pass).length;

  console.log(`\n📈 ESTATÍSTICAS:`);
  console.log(`   ✅ Passaram: ${passCount}/${testLogs.length}`);
  console.log(`   ❌ Falharam: ${failCount}/${testLogs.length}`);

  console.log("\n📋 VALIDAÇÕES CRÍTICAS:");
  
  // Validar TEST B
  const testB = testLogs.find(t => t.testName.includes("TEST B"));
  if (testB && testB.responseBody.server) {
    console.log(`   ${testB.responseBody.server.hostName ? "✅" : "❌"} hostName presente: ${testB.responseBody.server.hostName || "NULL"}`);
    console.log(`   ${testB.responseBody.server.pm2ProcessName ? "✅" : "❌"} pm2ProcessName presente: ${testB.responseBody.server.pm2ProcessName || "NULL"}`);
  }

  // Validar TEST C
  const testC = testLogs.find(t => t.testName.includes("TEST C"));
  if (testC && testC.responseBody.admin) {
    console.log(`   ${!testC.responseBody.admin.password ? "✅" : "❌"} Password NOT in response: ${!testC.responseBody.admin.password ? "SIM" : "NÃO (BUG)"}`);
  }

  // Validar TEST D
  const testD = testLogs.find(t => t.testName.includes("TEST D"));
  if (testD && testD.responseBody.dryRun) {
    console.log(`   ${testD.responseBody.command ? "✅" : "❌"} DRY-RUN command presente: ${testD.responseBody.command ? "SIM" : "NÃO"}`);
    console.log(`   ${testD.responseBody.command?.includes("ssh") ? "✅" : "❌"} Command includes SSH: ${testD.responseBody.command?.includes("ssh") ? "SIM" : "NÃO"}`);
  }

  await prisma.$disconnect();

  const allPassed = failCount === 0;
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error("❌ ERRO FATAL:", error);
  process.exit(1);
});

