import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/servers/find-by-pm2?name=haxball-server
export async function GET(request: NextRequest) {
  try {
    // Verificar secret key
    const authHeader = request.headers.get("authorization");
    const secretKey =
      process.env.HAXBALL_WEBHOOK_SECRET || "haxhost-secret-2024";

    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const pm2Name = searchParams.get("name");

    if (!pm2Name) {
      return NextResponse.json(
        { error: "Parâmetro 'name' é obrigatório" },
        { status: 400 }
      );
    }

    const server = await prisma.server.findFirst({
      where: {
        pm2ProcessName: pm2Name,
      },
      select: {
        id: true,
        name: true,
        status: true,
        pm2ProcessName: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: `Servidor com PM2 name '${pm2Name}' não encontrado` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      serverId: server.id,
      serverName: server.name,
      status: server.status,
    });
  } catch (error: any) {
    console.error("Erro ao buscar servidor:", error);
    return NextResponse.json(
      { error: "Erro ao buscar servidor", details: error.message },
      { status: 500 }
    );
  }
}
