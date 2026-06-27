import { closePool, pool } from "../src/db.js";

const todos = [
  "Start the Docker dev container",
  "Connect Orca over SSH",
  "Forward the Hono dev server port",
];

async function seed() {
  for (const title of todos) {
    await pool.query(
      `insert into todos (title)
       select $1
       where not exists (select 1 from todos where title = $1)`,
      [title],
    );
  }

  console.log(`Seeded ${todos.length} todos`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closePool);
