import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log(
      "--- EXECUTANDO SCRIPT DE SETUP-DB-ADAPTER (VERSÃO CASCADE v2) ---"
    );

    // 1. Habilita a extensão de UUID
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
    console.log('Extensão "uuid-ossp" verificada/criada.');

    // 2. Apaga tabelas na ordem inversa com CASCADE
    await sql`DROP TABLE IF EXISTS verification_tokens CASCADE;`;
    console.log('Tabela "verification_tokens" dropada.');
    await sql`DROP TABLE IF EXISTS sessions CASCADE;`;
    console.log('Tabela "sessions" dropada.');
    await sql`DROP TABLE IF EXISTS accounts CASCADE;`;
    console.log('Tabela "accounts" dropada.');
    await sql`DROP TABLE IF EXISTS users CASCADE;`;
    console.log('Tabela "users" dropada.');

    // 3. Cria Tabela "users"
    await sql`
      CREATE TABLE "users" (
        id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT,
        email TEXT UNIQUE,
        "emailVerified" TIMESTAMPTZ,
        image TEXT,
        password TEXT
      );
    `;
    console.log('Tabela "users" (camelCase com UUID) criada.');

    // 4. Cria Tabela "accounts"
    await sql`
      CREATE TABLE "accounts" (
        id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, "providerAccountId")
      );
    `;
    console.log('Tabela "accounts" (camelCase) criada.');

    // 5. Cria Tabela "sessions"
    await sql`
      CREATE TABLE "sessions" (
        id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
        "sessionToken" TEXT NOT NULL UNIQUE,
        "userId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
        expires TIMESTAMPTZ NOT NULL
      );
    `;
    console.log('Tabela "sessions" (camelCase) criada.');

    // 6. Cria Tabela "verification_tokens"
    await sql`
      CREATE TABLE "verification_tokens" (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires TIMESTAMPTZ NOT NULL,
        UNIQUE(identifier, token)
      );
    `;
    console.log('Tabela "verification_tokens" criada.');

    console.log("--- SCRIPT DE SETUP-DB-ADAPTER CONCLUÍDO COM SUCESSO ---");
    return NextResponse.json(
      {
        message:
          "Tabelas (v4 camelCase com UUIDs) recriadas com SUCESSO via CASCADE!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("--- ERRO FATAL NO SCRIPT DE SETUP-DB-ADAPTER ---:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Um erro desconhecido ocorreu";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
