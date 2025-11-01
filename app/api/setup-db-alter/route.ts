import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await sql`ALTER TABLE users ALTER COLUMN password DROP NOT NULL;`;
    return NextResponse.json(
      { message: "Coluna 'password' alterada para opcional (NULL)!" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
