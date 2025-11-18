import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { getAvailableHost } from "@/lib/hosts";
import crypto from "crypto";

const prisma = new PrismaClient();

// GET /api/servers - Lista todos os servidores do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const servers = await prisma.server.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      servers,
    });
  } catch (error) {
    console.error("Erro ao buscar servidores:", error);
    return NextResponse.json(
      { error: "Erro ao buscar servidores" },
      { status: 500 }
    );
  }
}

// POST /api/servers - Cria um novo servidor
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, maxPlayers, password, isPublic, map } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nome do servidor é obrigatório" },
        { status: 400 }
      );
    }

    // NOVO: Buscar host disponível automaticamente
    const availableHost = await getAvailableHost();

    if (!availableHost) {
      return NextResponse.json(
        {
          error:
            "Todos os hosts estão no limite de capacidade. Tente novamente mais tarde.",
        },
        { status: 503 }
      );
    }

    console.log(`[API] Servidor será criado no host: ${availableHost.name}`);

    // Gerar ID e pm2ProcessName
    const serverId = crypto.randomUUID();
    const pm2ProcessName = `haxball-server-${serverId.substring(0, 8)}`;

    const server = await prisma.server.create({
      data: {
        id: serverId,
        userId: session.user.id,
        name: name.trim(),
        hostName: availableHost.name, // NOVO: Atribui host automaticamente
        pm2ProcessName: pm2ProcessName, // CORREÇÃO: Gerar pm2ProcessName
        maxPlayers: maxPlayers || 20,
        password: password || null,
        isPublic: isPublic !== false,
        map: map || "Big",
        status: "pending",
        needsProvision: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      server,
      host: {
        name: availableHost.name,
        ip: availableHost.ip,
      },
    });
  } catch (error) {
    console.error("Erro ao criar servidor:", error);
    return NextResponse.json(
      { error: "Erro ao criar servidor" },
      { status: 500 }
    );
  }
}

