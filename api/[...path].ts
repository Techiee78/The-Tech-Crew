// @ts-ignore - the bundled server entry is generated during the Vercel build and has no declaration file.
import app, { appReady } from "../dist/vercel.js";

export default async function handler(req: any, res: any) {
  try {
    await appReady;
    return app(req, res);
  } catch (error) {
    console.error("API initialization failed", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "API initialization failed" });
    }
  }
}
