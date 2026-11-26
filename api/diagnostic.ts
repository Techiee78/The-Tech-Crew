import { Pool } from "pg";

export default async function handler(_req: any, res: any) {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const sessionSecretConfigured = Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  if (!databaseConfigured) return res.status(500).json({ databaseConfigured, sessionSecretConfigured, dbConnected: false });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 8000 });
  try {
    const result = await pool.query("SELECT (SELECT count(*)::int FROM cars) AS cars_count, (SELECT count(*)::int FROM properties) AS properties_count");
    return res.status(200).json({ databaseConfigured, sessionSecretConfigured, dbConnected: true, carsCount: result.rows[0].cars_count, propertiesCount: result.rows[0].properties_count });
  } catch (error: any) {
    return res.status(500).json({ databaseConfigured, sessionSecretConfigured, dbConnected: false, errorCode: error?.code ?? "unknown" });
  } finally {
    await pool.end();
  }
}
