import app, { appReady } from "../server/index";

export default async function handler(req: any, res: any) {
  await appReady;
  return app(req, res);
}
