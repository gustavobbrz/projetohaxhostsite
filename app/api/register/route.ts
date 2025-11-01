import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    // Criptografa a senha
    const hashedPassword = await hash(password, 10);

    // Insere o usuário no banco
    // CORREÇÃO AQUI: A tabela é "users" (plural)
    await sql`
            INSERT INTO "users" (name, email, password)
            VALUES (${name}, ${email}, ${hashedPassword})
        `;

    return NextResponse.json(
      { message: "Usuário criado com sucesso!" },
      { status: 201 }
    );
  } catch (error) {
    // Verifica se é um erro de email duplicado
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return NextResponse.json(
        { error: "Email já cadastrado." },
        { status: 409 }
      );
    }

    // Para outros tipos de erro
    console.error("ERRO NO REGISTRO:", error); // Adicionado log de erro
    return NextResponse.json(
      { error: "Erro ao criar usuário." },
      { status: 500 }
    );
  }
}
