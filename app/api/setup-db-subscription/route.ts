import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("--- EXECUTANDO SCRIPT DE SETUP-DB-SUBSCRIPTION ---");

    // 1. Cria a tabela de Planos (ex: Básico, Pro, etc.)
    await sql`
      CREATE TABLE IF NOT EXISTS "plans" (
        id TEXT PRIMARY KEY, -- ex: 'price_123abc' (ID do Stripe/provedor)
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC(10, 2), -- ex: 29.99
        currency TEXT DEFAULT 'BRL',
        "interval" TEXT -- 'month' ou 'year'
      );
    `;
    console.log('Tabela "plans" criada.');

    // 2. Cria a tabela de Assinaturas dos usuários
    //    Conecta um usuário (da tabela "users") a um plano
    await sql`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
        "planId" TEXT NOT NULL REFERENCES "plans"(id),
        status TEXT NOT NULL, -- ex: 'active', 'canceled', 'past_due'
        "currentPeriodEnd" TIMESTAMPTZ NOT NULL,
        "customerId" TEXT, -- ID do cliente no Stripe, etc.
        "subscriptionId" TEXT UNIQUE -- ID da assinatura no Stripe, etc.
      );
    `;
    console.log('Tabela "subscriptions" criada.');

    console.log("--- SCRIPT DE SETUP-DB-SUBSCRIPTION CONCLUÍDO ---");
    return NextResponse.json(
      { message: "Tabelas de Planos e Assinaturas criadas com sucesso!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao criar tabelas de subscription:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Um erro desconhecido ocorreu";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
