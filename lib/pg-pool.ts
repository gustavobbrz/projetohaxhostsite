import { Pool } from "pg";

declare global {
  var pool: Pool | undefined;
}

const poolConfig = {
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
};

export const pool = globalThis.pool || new Pool(poolConfig);

if (process.env.NODE_ENV !== "production") globalThis.pool = pool;
