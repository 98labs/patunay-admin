import path from "path";
import { app } from "electron";
import { isDev } from "./util.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getPreloadPath = () => {
  const preloadPath = path.join(
    app.getAppPath(),
    isDev() ? "." : "..",
    "/dist-electron/preload.cjs"
  );

  console.log(`Preload script paths: ${preloadPath}`);
  return preloadPath;
};
