import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgres://postgres:postgres@postgres:5432/hono_todo",
});

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export async function closePool() {
  await pool.end();
}
