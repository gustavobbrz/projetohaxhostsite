/**
 * HaxHost Worker - Script para rodar nas EC2s
 *
 * Este script verifica o status dos processos PM2 e envia para a API do site.
 *
 * Instalação na EC2:
 * 1. npm install pm2 axios
 * 2. Configure as variáveis abaixo (JÁ CONFIGURADO!)
 * 3. Execute: node worker.js
 * 4. Para rodar em background: pm2 start worker.js --name "haxhost-worker"
 */

const pm2 = require('pm2');
const axios = require('axios');

// ========== CONFIGURAÇÃO ==========
// <--- MUDANÇA 1: URL DO SEU NGROK
const API_URL = 'https://pa-municipal-margherita.ngrok-free.dev/api/update-status';

// <--- MUDANÇA 2: CHAVE SECRETA (CONFIRME SE É A MESMA DO SEU .env.local)
const API_SECRET_KEY = 'sua-chave-secreta-super-segura;

// <--- MUDANÇA 3: NOME DO SEU SERVIDOR
const SERVER_ID = 'EC2-Principal';

const INTERVAL_MINUTES = 1; // Intervalo de atualização em minutos
// ==================================

// Função para obter lista de processos PM2
function getPM2Processes() {
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) {
                console.error('Erro ao conectar no PM2:', err);
                reject(err);
                return;
            }

            pm2.list((err, processes) => {
                pm2.disconnect();

                if (err) {
                    console.error('Erro ao listar processos:', err);
                    reject(err);
                    return;
                }

                resolve(processes);
            });
        });
    });
}

// Função para enviar status para a API
async function sendStatusToAPI(rooms) {
    try {
        const response = await axios.post(
            API_URL,
            {
                rooms: rooms,
                serverId: SERVER_ID,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${API_SECRET_KEY}`,
                },
                timeout: 10000, // 10 segundos
            }
        );

        console.log('✅ Status enviado com sucesso:', response.data);
        return true;
    } catch (error) {
        if (error.response) {
            console.error('❌ Erro na API:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('❌ Erro de conexão:', error.message);
        } else {
            console.error('❌ Erro:', error.message);
        }
        return false;
    }
}

// Função principal
async function updateStatus() {
    try {
        console.log(`\n[${new Date().toLocaleString()}] Verificando status do PM2...`);

        // Obter processos do PM2
        const processes = await getPM2Processes();

        // Converter para formato da API
        const rooms = processes.map((proc) => ({
            name: proc.name,
            status: proc.pm2_env.status === 'online' ? 'online' : 'offline',
        }));

        console.log(`📊 Encontradas ${rooms.length} sala(s):`);
        rooms.forEach((room) => {
            const emoji = room.status === 'online' ? '🟢' : '🔴';
            console.log(`   ${emoji} ${room.name}: ${room.status}`);
        });

        // Enviar para API
        if (rooms.length > 0) {
            await sendStatusToAPI(rooms);
        } else {
            console.log('⚠️  Nenhuma sala encontrada no PM2');
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error.message);
    }
}

// Verificar configuração
function checkConfig() {
    if (API_URL.includes('seu-site.vercel.app')) {
        console.error('❌ ERRO: Configure a variável API_URL com a URL do seu site!');
        process.exit(1);
    }

    if (API_SECRET_KEY === 'haxhost-secret-key-2024-change-me') {
        console.warn('⚠️  ATENÇÃO: Você está usando a chave secreta padrão. Recomenda-se alterá-la!');
    }

    console.log('✅ Configuração:');
    console.log(`   API URL: ${API_URL}`);
    console.log(`   Servidor: ${SERVER_ID}`);
    console.log(`   Intervalo: ${INTERVAL_MINUTES} minuto(s)`);
}

// Iniciar worker
console.log('🚀 HaxHost Worker iniciado!');
checkConfig();

// Executar imediatamente
updateStatus();

// Executar a cada X minutos
const intervalMs = INTERVAL_MINUTES * 60 * 1000;
setInterval(updateStatus, intervalMs);

console.log(`⏰ Próxima verificação em ${INTERVAL_MINUTES} minuto(s)...\n`);

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Promise rejeitada:', error);
});