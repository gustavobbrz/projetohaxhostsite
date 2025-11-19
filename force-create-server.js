const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'azzurashin@haxhost.com' }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado!');
      return;
    }
    
    // Usa raw query para criar com ID customizado
    await prisma.$executeRaw`
      INSERT INTO "Server" (
        id, "userId", name, status, "subscriptionStatus", "planType",
        "maxPlayers", "isPublic", "roomLink", "pm2ProcessName",
        "discordServerId", "nextBillingDate", "createdAt", "updatedAt"
      ) VALUES (
        ${`srv-azzurashin-${Date.now()}`},
        ${user.id},
        ${'🔵⚫ FUTSAL DA AZZURASHIN HC 🔵⚫'},
        ${'active'},
        ${'active'},
        ${'premium'},
        ${20},
        ${true},
        ${'https://www.haxball.com/play?c=azzurashin'},
        ${'haxball-server'},
        ${'1342815750641156140'},
        ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)},
        ${new Date()},
        ${new Date()}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    
    console.log('✅ Servidor criado!');
    console.log('');
    console.log('🎉 PRONTO PARA USAR!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: azzurashin@haxhost.com');
    console.log('🔑 Senha: azzurashin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('👉 Acesse: http://localhost:3000/login');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
