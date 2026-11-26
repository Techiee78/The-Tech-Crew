// Explicit Vercel route for session lookup; share the same Express app/session store.
import app, { appReady } from "../../dist/vercel.js";
export default async function handler(req: any, res: any) {
  try { await appReady; return app(req, res); }
  catch (error) { console.error("Auth API initialization failed", error); if (!res.headersSent) res.status(500).json({ message: "API initialization failed" }); }
}
