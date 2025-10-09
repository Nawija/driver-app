import { sql } from "@vercel/postgres";

export async function initDb() {
    await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      client_name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      address TEXT NOT NULL,
      photo_urls TEXT[],
      completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP
    );
  `;
}
