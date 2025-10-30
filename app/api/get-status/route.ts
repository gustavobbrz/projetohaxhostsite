import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'rooms-status.json');

interface RoomStatus {
  name: string;
  status: 'online' | 'offline';
  playerCount?: number;
  maxPlayers?: number;
  roomLink?: string;
  lastUpdate?: string;
  serverId?: string;
}

export async function GET() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const rooms: RoomStatus[] = JSON.parse(data);

      return NextResponse.json({
        success: true,
        rooms: rooms,
        total: rooms.length,
        lastCheck: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      rooms: [],
      total: 0,
      lastCheck: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao ler status:', error);
    return NextResponse.json(
      { error: 'Erro ao obter status das salas' },
      { status: 500 }
    );
  }
}

// Habilitar revalidação a cada 30 segundos
export const revalidate = 30;
