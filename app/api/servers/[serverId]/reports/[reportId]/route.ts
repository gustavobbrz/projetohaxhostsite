import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * PATCH /api/servers/[serverId]/reports/[reportId]
 * 
 * Atualiza o status de uma denúncia
 * 
 * Body: { status: "resolved" | "ignored" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string; reportId: string }> }
) {
  const { serverId, reportId } = await params;
  try {
    // 1. Verifica autenticação
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Busca o servidor
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Servidor não encontrado" },
        { status: 404 }
      );
    }

    // 3. Verifica permissão
    if (server.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para moderar este servidor" },
        { status: 403 }
      );
    }

    // 4. Valida o body
    const body = await request.json();
    const { status } = body;

    if (!status || !["resolved", "ignored", "pending"].includes(status)) {
      return NextResponse.json(
        {
          error: 'Status inválido. Use: "resolved", "ignored" ou "pending"',
        },
        { status: 400 }
      );
    }

    // 5. Busca a denúncia
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Denúncia não encontrada" },
        { status: 404 }
      );
    }

    if (report.serverId !== serverId) {
      return NextResponse.json(
        { error: "Esta denúncia não pertence a este servidor" },
        { status: 403 }
      );
    }

    // 6. Atualiza o status
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: { status: status },
    });

    // 7. Registra a ação no log
    await prisma.adminLog.create({
      data: {
        id: crypto.randomUUID(),
        serverId: server.id,
        action: "REPORT_STATUS_UPDATED",
        adminName: session.user.name || session.user.email || "Admin",
        reason: `Denúncia #${report.id.slice(0, 8)} contra ${
          report.reportedName
        } marcada como: ${status}`,
      },
    });

    console.log(
      `[REPORTS] ${session.user.name} marcou denúncia contra ${report.reportedName} como ${status}`
    );

    return NextResponse.json({
      success: true,
      message: `Denúncia marcada como ${status}`,
      report: {
        id: updatedReport.id,
        status: updatedReport.status,
        reportedName: updatedReport.reportedName,
      },
    });
  } catch (error: any) {
    console.error("[REPORTS] Erro ao atualizar denúncia:", error);
    return NextResponse.json(
      {
        error: "Erro ao atualizar denúncia",
        reason: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

