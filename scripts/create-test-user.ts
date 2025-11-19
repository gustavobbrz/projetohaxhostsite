/**
 * Script para criar usuário de teste com servidor pré-configurado
 * 
 * Uso: npx tsx scripts/create-test-user.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function createTestUser() {
  console.log("\n🚀 ========== CRIANDO USUÁRIO DE TESTE ==========\n");

  try {
    const email = `teste${Date.now()}@haxhost.com`;
    const password = "senha123";
    const name = "Usuário Teste";

    console.log("📧 Email:", email);
    console.log("🔑 Senha:", password);
    console.log("👤 Nome:", name);

    // 1. Criar usuário
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: email,
        password: hashedPassword,
        name: name,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("\n✅ Usuário criado:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);

    // 2. Criar servidor básico (opcional)
    const createServer = process.argv.includes("--with-server");

    if (createServer) {
      const server = await prisma.server.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          name: `🎮 Sala de Teste de ${name}`,
          status: "pending",
          maxPlayers: 16,
          map: "Big",
          isPublic: true,
          subscriptionStatus: "active",
          planType: "premium",
          needsProvision: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log("\n✅ Servidor criado:");
      console.log(`   ID: ${server.id}`);
      console.log(`   Nome: ${server.name}`);
      console.log(`   Status: ${server.status}`);
    }

    // 3. Instruções
    console.log("\n📋 ========== PRÓXIMOS PASSOS ==========\n");
    console.log("1. Acesse: http://localhost:3000/login");
    console.log(`2. Faça login com:`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Senha: ${password}`);
    console.log("3. Vá para: http://localhost:3000/dashboard");
    
    if (createServer) {
      console.log("4. Configure o servidor:");
      console.log("   - Adicione um token Haxball válido");
      console.log("   - Clique em 'Salvar'");
      console.log("   - Clique em 'Provisionar'");
    } else {
      console.log("4. Crie um novo servidor:");
      console.log("   - Preencha o formulário");
      console.log("   - Adicione um token Haxball válido");
      console.log("   - Clique em 'Salvar' e depois 'Provisionar'");
    }

    console.log("\n✅ USUÁRIO PRONTO PARA TESTES!\n");

  } catch (error: any) {
    console.error("\n❌ ERRO AO CRIAR USUÁRIO:");
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();

