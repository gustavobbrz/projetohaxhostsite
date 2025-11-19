/**
 * Script de teste para verificar endpoints necessários para o ServerConfigForm
 * 
 * Uso:
 *   node scripts/test-frontend-endpoints.js
 */

const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

// Mock Server ID (ajuste conforme necessário)
const testServerId = "test-server-id";
const testAdminId = "test-admin-id";

// Endpoints a serem testados
const endpoints = [
  {
    name: "GET /api/servers",
    method: "GET",
    url: `${baseUrl}/api/servers`,
    expectedStatuses: [200, 401, 403], // 401/403 se não autenticado
  },
  {
    name: "POST /api/servers",
    method: "POST",
    url: `${baseUrl}/api/servers`,
    expectedStatuses: [200, 201, 401, 403, 400],
    body: {
      name: "Test Server",
      map: "bazinga (futsal)",
      maxPlayers: 16,
      isPublic: true,
    },
  },
  {
    name: "PUT /api/servers/:id",
    method: "PUT",
    url: `${baseUrl}/api/servers/${testServerId}`,
    expectedStatuses: [200, 404, 401, 403],
    body: {
      name: "Updated Server",
      map: "big",
      maxPlayers: 20,
      isPublic: false,
    },
  },
  {
    name: "POST /api/servers/:id/provision",
    method: "POST",
    url: `${baseUrl}/api/servers/${testServerId}/provision`,
    expectedStatuses: [200, 404, 401, 403, 400],
    body: {},
  },
  {
    name: "PATCH /api/servers/:id/config",
    method: "PATCH",
    url: `${baseUrl}/api/servers/${testServerId}/config`,
    expectedStatuses: [200, 404, 401, 403, 400],
    body: {
      name: "Updated via Config",
      restart: true,
    },
  },
  {
    name: "GET /api/servers/:id/admins",
    method: "GET",
    url: `${baseUrl}/api/servers/${testServerId}/admins`,
    expectedStatuses: [200, 404, 401, 403],
  },
  {
    name: "POST /api/servers/:id/admins",
    method: "POST",
    url: `${baseUrl}/api/servers/${testServerId}/admins`,
    expectedStatuses: [200, 201, 404, 401, 403, 400],
    body: {
      password: "test123456",
      label: "Test Admin",
    },
  },
  {
    name: "DELETE /api/servers/:id/admins/:adminId",
    method: "DELETE",
    url: `${baseUrl}/api/servers/${testServerId}/admins/${testAdminId}`,
    expectedStatuses: [200, 204, 404, 401, 403],
  },
];

async function testEndpoint(endpoint) {
  try {
    const options = {
      method: endpoint.method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }

    const response = await fetch(endpoint.url, options);
    const status = response.status;

    const exists = status !== 404;
    const statusOk = endpoint.expectedStatuses.includes(status);

    return {
      name: endpoint.name,
      exists,
      status,
      statusOk,
      expectedStatuses: endpoint.expectedStatuses,
    };
  } catch (error) {
    return {
      name: endpoint.name,
      exists: false,
      status: "ERROR",
      error: error.message,
    };
  }
}

async function main() {
  console.log("🧪 TESTANDO ENDPOINTS DO FRONTEND\n");
  console.log(`Base URL: ${baseUrl}\n`);

  const results = [];

  for (const endpoint of endpoints) {
    console.log(`Testando: ${endpoint.name}...`);
    const result = await testEndpoint(endpoint);
    results.push(result);

    if (result.exists) {
      console.log(`  ✅ Endpoint existe (Status: ${result.status})`);
    } else {
      console.log(`  ❌ Endpoint NÃO existe (Status: ${result.status})`);
    }
  }

  console.log("\n📊 RESUMO:\n");

  const existingEndpoints = results.filter((r) => r.exists);
  const missingEndpoints = results.filter((r) => !r.exists);

  console.log(`✅ Endpoints existentes: ${existingEndpoints.length}/${endpoints.length}`);
  console.log(`❌ Endpoints faltantes: ${missingEndpoints.length}/${endpoints.length}\n`);

  if (missingEndpoints.length > 0) {
    console.log("🔴 Endpoints que precisam ser implementados:");
    missingEndpoints.forEach((r) => {
      console.log(`   - ${r.name}`);
    });
    console.log("\n⚠️  O frontend tentará chamar esses endpoints e falhará!");
    console.log("📚 Veja FASE_6_7_IMPLEMENTACAO.md para código completo.\n");
  } else {
    console.log("🎉 Todos os endpoints necessários estão implementados!\n");
  }

  // Exit code
  process.exit(missingEndpoints.length > 0 ? 1 : 0);
}

main();

