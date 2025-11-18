import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// GET /api/servers/[serverId]/chat - Busca mensagens do chat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verifica se o servidor pertence ao usuário
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        userId: session.user.id,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    // Busca as últimas 100 mensagens
    const messages = await prisma.chatMessage.findMany({
      where: {
        serverId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      messages: messages.reverse(), // Inverte para mostrar mais antigas primeiro
    });
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return NextResponse.json(
      { error: "Erro ao buscar mensagens" },
      { status: 500 }
    );
  }
}

// POST /api/servers/[serverId]/chat - Envia mensagem para o jogo (via Discord)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Mensagem vazia" },
        { status: 400 }
      );
    }

    // Verifica se o servidor pertence ao usuário
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        userId: session.user.id,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    // Salva a mensagem
    const chatMessage = await prisma.chatMessage.create({
      data: {
        id: crypto.randomUUID(),
        serverId,
        playerName: session.user.name || "Admin",
        message: message.trim(),
        source: "discord",
      },
    });

    // TODO: Enviar mensagem para o Discord bot que envia para o jogo
    // await sendMessageToGame(server, message);

    return NextResponse.json({
      success: true,
      message: chatMessage,
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return NextResponse.json(
      { error: "Erro ao enviar mensagem" },
      { status: 500 }
    );
  }
}

