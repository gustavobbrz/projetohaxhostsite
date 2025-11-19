/**
 * TESTE DE PROVISIONAMENTO (DRY-RUN)
 * 
 * Simula o provisionamento de um servidor sem executar SSH real.
 * Útil para verificar se toda a lógica de geração de scripts está funcionando.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs/promises";

const prisma = new PrismaClient();

interface TestServer {
  id: string;
  name: string;
  hostName: string | null;
  pm2ProcessName: string | null;
  token: string | null;
}

async function testProvision() {
  console.log("\n🧪 ========== TESTE DE PROVISIONAMENTO (DRY-RUN) ==========\n");

  try {
    // 1. Buscar um servidor existente (mais recente com hostName)
    const server = await prisma.server.findFirst({
      where: {
        hostName: { not: null },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        ServerAdmin: true,
      },
    }) as any;

    if (!server) {
      console.error("❌ Nenhum servidor encontrado no banco de dados!");
      console.log("💡 Crie um servidor pelo dashboard primeiro.");
      process.exit(1);
    }

    console.log("✅ Servidor encontrado:");
    console.log(`   📛 Nome: ${server.name}`);
    console.log(`   🆔 ID: ${server.id}`);
    console.log(`   🖥️  Host: ${server.hostName || "⚠️  NÃO ATRIBUÍDO"}`);
    console.log(`   📦 PM2: ${server.pm2ProcessName || "⚠️  NÃO CONFIGURADO"}`);
    console.log(`   🗺️  Mapa: ${server.map}`);
    console.log(`   👥 Max Players: ${server.maxPlayers}`);
    console.log(`   🔒 Senha: ${server.password || "Nenhuma"}`);
    console.log(`   🌐 Público: ${server.isPublic ? "Sim" : "Não"}`);
    console.log(`   🔑 Token: ${server.token || server.tokenEncrypted ? "✅ Configurado" : "⚠️  FALTANDO"}`);
    console.log(`   👑 Admins: ${server.ServerAdmin.length}`);

    // 2. Verificar pré-requisitos
    console.log("\n🔍 Verificando pré-requisitos...");

    const issues: string[] = [];

    if (!server.hostName) issues.push("❌ hostName não atribuído (clique em Salvar primeiro)");
    if (!server.pm2ProcessName) issues.push("❌ pm2ProcessName não configurado (clique em Salvar primeiro)");
    if (!server.token && !server.tokenEncrypted) issues.push("⚠️  Token Haxball não configurado (opcional)");

    if (issues.length > 0) {
      console.log("\n⚠️  PROBLEMAS ENCONTRADOS:");
      issues.forEach(i => console.log(`   ${i}`));
      
      if (!server.hostName || !server.pm2ProcessName) {
        console.log("\n💡 SOLUÇÃO: No dashboard, clique em \"Salvar\" para atribuir EC2 e PM2 process.");
        process.exit(1);
      }
    } else {
      console.log("   ✅ Todos os pré-requisitos OK!");
    }

    // 3. Simular geração do script
    console.log("\n📝 Simulando geração do ecosystem.config.js...");

    const templatePath = path.join(process.cwd(), "templates", "ecosystem.config.template.js");
    let template = await fs.readFile(templatePath, "utf8");

    // Preparar admins
    const adminsJson = JSON.stringify(
      server.ServerAdmin.filter((a: any) => a.isActive).map((a: any) => ({
        hash: a.adminHash,
        label: a.label || "Admin",
      }))
    );

    // Substituir placeholders
    const replacements: Record<string, string> = {
      "<SERVER_ID>": server.id,
      "<TOKEN>": server.token || "thr1.EXEMPLO",
      "<ROOM_NAME>": server.name,
      "<MAP>": server.map || "Big",
      "<MAX_PLAYERS>": server.maxPlayers.toString(),
      "<PASSWORD>": server.password || "",
      "<IS_PUBLIC>": server.isPublic ? "true" : "false",
      "<ADMINS_JSON>": adminsJson.replace(/"/g, '\\"'),
      "<HAXHOST_API_URL>": process.env.HAXHOST_API_URL || "http://localhost:3000",
      "<HAXHOST_WEBHOOK_SECRET>": process.env.HAXBALL_WEBHOOK_SECRET || "",
      "<PM2_PROCESS_NAME>": server.pm2ProcessName || `haxball-server-${server.id}`,
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      template = template.replaceAll(placeholder, value);
    }

    console.log("   ✅ ecosystem.config.js gerado!");
    console.log(`   📏 Tamanho: ${template.length} bytes`);

    // 4. Mostrar preview do script gerado
    console.log("\n📄 PREVIEW DO SCRIPT GERADO:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(template.substring(0, 800));
    console.log("...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // 5. Simular ações SSH (sem executar)
    console.log("\n🔗 PRÓXIMOS PASSOS (não executados):");
    console.log(`   1. SSH para ${server.hostName} (IP não resolvido aqui)`);
    console.log(`   2. Criar diretório: /home/ubuntu/haxhost/${server.pm2ProcessName}`);
    console.log(`   3. Enviar ecosystem.config.js e index.js`);
    console.log(`   4. Executar: npm install`);
    console.log(`   5. Executar: pm2 start ecosystem.config.js`);

    console.log("\n✅ TESTE CONCLUÍDO! O provisionamento está pronto para ser executado.");
    console.log("💡 Vá ao dashboard e clique em \"Provisionar\" para executar de verdade.");

  } catch (error: any) {
    console.error("\n❌ ERRO NO TESTE:");
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testProvision();

