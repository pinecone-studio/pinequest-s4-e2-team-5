import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW()');
    console.log('Connected to database:', res.rows[0]);
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name));
    const count = await client.query('SELECT COUNT(*) FROM recordings');
    console.log('Recordings count:', count.rows[0].count);
  } finally {
    client.release();
  }
}

test().catch(console.error);