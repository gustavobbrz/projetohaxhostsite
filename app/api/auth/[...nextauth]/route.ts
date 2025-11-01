import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";
import { compare } from "bcryptjs";
import { sql } from "@vercel/postgres";

// Configuração do Pool (necessária para o Adapter do Discord)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessário para Vercel/Neon
  },
});

// Define o tipo do usuário do banco
interface DbUser {
  id: string;
  name: string | null;
  email: string;
  password: string | null;
  emailVerified: Date | null;
  image: string | null;
}

// Estende o tipo da Sessão
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  // 1. ADAPTER (Ainda necessário para o Discord criar/procurar utilizadores)
  adapter: PostgresAdapter(pool),

  // --- A MUDANÇA PRINCIPAL ESTÁ AQUI ---
  // 2. ESTRATÉGIA DE SESSÃO
  session: {
    strategy: "jwt", // MUDAMOS DE "database" PARA "jwt"
  },
  // --- FIM DA MUDANÇA ---

  // 3. PÁGINAS CUSTOMIZADAS
  pages: {
    signIn: "/login",
  },

  // 4. PROVEDORES (Sem alteração)
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        try {
          const result = await sql`
            SELECT * FROM "users" WHERE email = ${credentials.email} LIMIT 1;
          `;
          // @ts-ignore
          const user = result.rows[0] as DbUser;
          if (!user || !user.password) {
            return null;
          }
          const passwordsMatch = await compare(
            credentials.password,
            user.password
          );
          if (passwordsMatch) {
            // @ts-ignore
            delete user.password;
            return user; // Retorna o utilizador para o callback 'jwt'
          } else {
            return null;
          }
        } catch (e) {
          console.error("Erro no Authorize:", e);
          return null;
        }
      },
    }),
  ],

  // 5. CALLBACKS (Modificados para JWT)
  callbacks: {
    // O callback 'jwt' é chamado PRIMEIRO
    async jwt({ token, user }) {
      // 'user' só está disponível no PRIMEIRO login (após authorize ou Discord)
      if (user) {
        token.id = user.id; // Passa o ID do utilizador para o token
      }
      return token;
    },
    // O callback 'session' é chamado DEPOIS, com o 'token' do 'jwt'
    async session({ session, token }) {
      // 'token.id' vem do callback 'jwt'
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
