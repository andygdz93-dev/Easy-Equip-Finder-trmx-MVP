// db.ts — PostgreSQL connection pool
// Uses env config. Falls back gracefully to demo data if DB is unavailable.

import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

export const pool = new Pool({
  user:     config.db.user     ?? "postgres",
  host:     config.db.host     ?? "localhost",
  database: config.db.name     ?? "easyfinder",
  password: config.db.password ?? "",
  port:     config.db.port     ?? 5432,
});

pool.connect((err, _client, release) => {
  if (err) {
    console.warn("⚠️  PostgreSQL unavailable — running in demo mode");
    return;
  }
  release();
  console.log("✅ PostgreSQL connected");
});

export async function getRealListings() {
  try {
    const result = await pool.query(`
      SELECT
        id::text,
        equipment,
        price::float,
        market_value::float,
        hours::float,
        score::float,
        state,
        source,
        operable,
        service_history,
        inspection_report,
        good_photos,
        url,
        scraped_at
      FROM listings
      ORDER BY score DESC
      LIMIT 50
    `);
    return result.rows.length > 0 ? result.rows : null;
  } catch {
    return null;
  }
}
