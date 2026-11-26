import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = Number(process.env.PORT || 5000);
export const server = createServer(app);

// Preserve local/Replit behavior; Vercel functions must not open their own listener.
if (!process.env.VERCEL) {
  server.listen(PORT, "0.0.0.0", () => {
    log(`Health check ready: serving on port ${PORT}`);
  });
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

export const appReady = (async () => {
  await registerRoutes(app);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });
  // Vercel serves the Vite build as static output; the function only handles API requests.
  if (!process.env.VERCEL) {
    if (app.get("env") === "development") await setupVite(server, app);
    else serveStatic(app);
  }
  log("App initialized.");
})();

export default app;
