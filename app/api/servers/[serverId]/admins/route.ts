import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * GET /api/servers/[serverId]/admins
 * 
 * Lista todos os admins de um servidor
 */
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

    // Verificar se servidor existe e pertence ao usuário
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { userId: true },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    // Buscar admins
    const admins = await prisma.serverAdmin.findMany({
      where: { serverId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      admins,
    });
  } catch (error: any) {
    console.error("[ADMINS GET] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar admins" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/servers/[serverId]/admins
 * 
 * Adiciona um novo admin ao servidor
 * 
 * Body: { label: "Admin Principal", adminHash: "senha_hash" }
 */
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
    const { label, adminHash } = body;

    if (!adminHash || !adminHash.trim()) {
      return NextResponse.json(
        { error: "Hash do admin é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se servidor existe e pertence ao usuário
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { userId: true },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    // Criar admin
    const admin = await prisma.serverAdmin.create({
      data: {
        id: crypto.randomUUID(),
        serverId,
        label: label || "Admin",
        adminHash: adminHash.trim(),
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      admin,
    });
  } catch (error: any) {
    console.error("[ADMINS POST] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao criar admin" },
      { status: 500 }
    );
  }
}

