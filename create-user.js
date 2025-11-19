const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

function generateId() {
  return 'cm' + crypto.randomBytes(12).toString('base64url');
}

async function main() {
  try {
    console.log('Criando usuário Azzurashin...');
    
    const hashedPassword = await bcrypt.hash('azzurashin123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'azzurashin@haxhost.com' },
      update: {},
      create: {
        id: generateId(),
        email: 'azzurashin@haxhost.com',
        name: 'Azzurashin HC',
        password: hashedPassword,
      },
    });
    
    console.log('✅ Usuário criado:', user.email);
    
    const server = await prisma.server.upsert({
      where: { id: 'azzurashin-server' },
      update: {
        status: 'active',
        subscriptionStatus: 'active',
      },
      create: {
        id: 'azzurashin-server',
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
    
    console.log('✅ Servidor criado:', server.name);
    console.log('');
    console.log('🎉 Login criado com sucesso!');
    console.log('   Email: azzurashin@haxhost.com');
    console.log('   Senha: azzurashin123');
    console.log('   Status: ' + server.status);
    console.log('   Plano: ' + server.subscriptionStatus);
    console.log('');
    console.log('Acesse: http://localhost:3000/login');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
