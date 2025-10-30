import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Chave secreta para autenticação (use variável de ambiente em produção)
const API_SECRET_KEY = process.env.API_SECRET_KEY || 'sua-chave-secreta-aqui';

// Caminho para armazenar o status
const DATA_FILE = path.join(process.cwd(), 'data', 'rooms-status.json');

// Interface para o status das salas
interface RoomStatus {
  name: string;
  status: 'online' | 'offline';
  playerCount?: number;
  maxPlayers?: number;
  roomLink?: string;
  lastUpdate?: string;
  serverId?: string;
}

// Garantir que o diretório data existe
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Ler dados do arquivo
function readData(): RoomStatus[] {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Erro ao ler dados:', error);
    return [];
  }
}

// Salvar dados no arquivo
function saveData(data: RoomStatus[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey || apiKey !== API_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter dados do body
    const body = await request.json();
    const { rooms, serverId } = body;

    if (!Array.isArray(rooms)) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um array de salas.' },
        { status: 400 }
      );
    }

    // Validar estrutura dos dados
    const isValid = rooms.every(
      (room) =>
        typeof room.name === 'string' &&
        (room.status === 'online' || room.status === 'offline')
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Dados inválidos. Cada sala deve ter name e status.' },
        { status: 400 }
      );
    }

    // Ler dados existentes
    const existingData = readData();

    // Atualizar com novos dados
    const timestamp = new Date().toISOString();
    const currentServerId = serverId || 'unknown';

    const updatedRooms: RoomStatus[] = rooms.map((room) => ({
      name: room.name,
      status: room.status,
      playerCount: room.playerCount ?? undefined,
      maxPlayers: room.maxPlayers ?? undefined,
      roomLink: room.roomLink ?? undefined,
      lastUpdate: timestamp,
      serverId: currentServerId,
    }));

    // Criar Set com as combinações (name + serverId) que serão atualizadas
    const updatingKeys = new Set(
      updatedRooms.map(room => `${room.name}|${room.serverId}`)
    );

    // Manter apenas salas que NÃO estão sendo atualizadas
    const otherRooms = existingData.filter((room) => {
      const key = `${room.name}|${room.serverId || 'unknown'}`;
      return !updatingKeys.has(key);
    });

    const finalData = [...otherRooms, ...updatedRooms];

    // Salvar
    saveData(finalData);

    return NextResponse.json({
      success: true,
      message: `${rooms.length} sala(s) atualizada(s)`,
      timestamp,
    });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (opcional para GET, você pode remover se quiser público)
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey || apiKey !== API_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const data = readData();

    return NextResponse.json({
      success: true,
      rooms: data,
      total: data.length,
    });
  } catch (error) {
    console.error('Erro ao obter status:', error);
    return NextResponse.json(
      { error: 'Erro ao obter status' },
      { status: 500 }
    );
  }
}
