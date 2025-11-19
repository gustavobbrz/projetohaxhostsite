const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Verificando usuário existente...');
    
    let user = await prisma.user.findUnique({
      where: { email: 'azzurashin@haxhost.com' }
    });
    
    if (!user) {
      console.log('📝 Criando novo usuário...');
      const hashedPassword = await bcrypt.hash('azzurashin123', 10);
      
      user = await prisma.user.create({
        data: {
          email: 'azzurashin@haxhost.com',
          name: 'Azzurashin HC',
          password: hashedPassword,
        },
      });
      console.log('✅ Usuário criado!');
    } else {
      console.log('✅ Usuário já existe!');
    }
    
    console.log('📝 Criando/atualizando servidor...');
    
    // Busca servidor existente
    const existingServer = await prisma.server.findFirst({
      where: { userId: user.id }
    });
    
    let server;
    if (existingServer) {
      server = await prisma.server.update({
        where: { id: existingServer.id },
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
      console.log('✅ Servidor atualizado!');
    } else {
      server = await prisma.server.create({
        data: {
          userId: user.id,
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
      console.log('✅ Servidor criado!');
    }
    
    console.log('');
    console.log('🎉 TUDO PRONTO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: azzurashin@haxhost.com');
    console.log('🔑 Senha: azzurashin123');
    console.log('🎮 Servidor:', server.name);
    console.log('✅ Status:', server.status);
    console.log('💳 Plano:', server.subscriptionStatus);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('👉 Acesse: http://localhost:3000/login');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
