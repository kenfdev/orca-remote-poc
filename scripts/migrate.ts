import { closePool, pool } from "../src/db.js";

async function migrate() {
  await pool.query(`
    create table if not exists todos (
      id serial primary key,
      title text not null check (char_length(trim(title)) > 0),
      completed boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await pool.query(`
    create index if not exists todos_created_at_idx on todos (created_at desc);
  `);

  console.log("Database migration complete");
}

migrate()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closePool);
