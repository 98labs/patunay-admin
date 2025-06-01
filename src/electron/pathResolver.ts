import path from "path";
import { app } from "electron";
import { isDev } from "./util.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getPreloadPath = () => {
  const preloadPath = isDev()
    ? path.resolve(__dirname, "../dist-electron/preload.js") // Updated to use .js extension
    : path.join(app.getAppPath(), "dist-electron", "preload.js");

  console.log(`Preload script path: ${preloadPath}`);
  return preloadPath;
};
