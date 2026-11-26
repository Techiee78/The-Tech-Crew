import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

export const appReady = (async () => {
  await registerRoutes(app);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });
})();

export default app;
