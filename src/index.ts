import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { z } from "zod";
import { pool, type Todo } from "./db.js";

const app = new Hono();

const createTodoSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    completed: z.boolean().optional(),
  })
  .refine((value) => value.title !== undefined || value.completed !== undefined, {
    message: "Provide at least one field to update",
  });

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "orca-hono-todo-poc",
  }),
);

app.get("/todos", async (c) => {
  const result = await pool.query<Todo>(
    "select id, title, completed, created_at, updated_at from todos order by id asc",
  );

  return c.json(result.rows);
});

app.post("/todos", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createTodoSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await pool.query<Todo>(
    "insert into todos (title) values ($1) returning id, title, completed, created_at, updated_at",
    [parsed.data.title],
  );

  return c.json(result.rows[0], 201);
});

app.patch("/todos/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: "Invalid todo id" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateTodoSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await pool.query<Todo>(
    `update todos
     set title = coalesce($2, title),
         completed = coalesce($3, completed),
         updated_at = now()
     where id = $1
     returning id, title, completed, created_at, updated_at`,
    [id, parsed.data.title ?? null, parsed.data.completed ?? null],
  );

  if (!result.rows[0]) {
    return c.json({ error: "Todo not found" }, 404);
  }

  return c.json(result.rows[0]);
});

app.delete("/todos/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: "Invalid todo id" }, 400);
  }

  const result = await pool.query("delete from todos where id = $1", [id]);

  if (result.rowCount === 0) {
    return c.json({ error: "Todo not found" }, 404);
  }

  return c.body(null, 204);
});

const port = Number(process.env.PORT ?? 3000);

serve(
  {
    fetch: app.fetch,
    port,
    // Bind inside the container so SSH local forwarding from Orca can reach it.
    hostname: "0.0.0.0",
  },
  (info) => {
    console.log(`Hono Todo API listening on http://${info.address}:${info.port}`);
  },
);
