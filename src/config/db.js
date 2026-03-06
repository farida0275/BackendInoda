import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const pool = new pg.Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT || 5432),
  ssl: { rejectUnauthorized: false },
});

export default pool;