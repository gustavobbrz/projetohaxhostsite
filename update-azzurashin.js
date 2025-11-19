const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Buscando usuário...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'azzurashin@haxhost.com' },
      include: { Server: true }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado!');
      return;
    }
    
    console.log('✅ Usuário encontrado:', user.email);
    console.log('📊 Servidores:', user.Server.length);
    
    if (user.Server.length > 0) {
      const server = user.Server[0];
      console.log('🔄 Atualizando servidor:', server.name);
      
      const updated = await prisma.server.update({
        where: { id: server.id },
        data: {
          name: '🔵⚫ FUTSAL DA AZZURASHIN HC 🔵⚫',
          status: 'active',
          subscriptionStatus: 'active',
          planType: 'premium',
          maxPlayers: 20,
          isPublic: true,
          roomLink: 'https://www.haxball.com/play?c=azzurashin',
          pm2ProcessName: 'haxball-server',
          discordServerId: '1342815750641156140',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      
      console.log('');
      console.log('🎉 SERVIDOR ATUALIZADO!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email: azzurashin@haxhost.com');
      console.log('🔑 Senha: azzurashin123');
      console.log('🎮 Servidor:', updated.name);
      console.log('✅ Status:', updated.status);
      console.log('💳 Plano:', updated.subscriptionStatus);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('👉 Faça login em: http://localhost:3000/login');
    } else {
      console.log('⚠️  Usuário não tem servidores. Será necessário criar manualmente.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
