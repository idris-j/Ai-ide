import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "./db/schema";

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  console.log("Running migrations...");
  
  await migrate(db, { migrationsFolder: "./migrations" });
  
  console.log("Migrations completed!");
  
  await pool.end();
}

runMigrations().catch(console.error);
