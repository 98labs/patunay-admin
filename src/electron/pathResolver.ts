import path from "path";
import { app } from "electron";
import { isDev } from "./util.js";
import { fileURLToPath } from "url";

// export const getPreloadPath = () => {
//   const preloadPath = path.join(
//     app.getAppPath(),
//     isDev() ? "." : "..",
//     "/dist-electron/preload.cjs"
//   );
//   console.log(`Preload script path: ${preloadPath}`); // Added logging for debugging
//   return preloadPath;
// };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getPreloadPath = () => {
  const preloadPath = isDev()
    ? path.resolve(__dirname, "../dist-electron/preload.cjs")
    : path.join(app.getAppPath(), "dist-electron", "preload.cjs");

  console.log(`Preload script path: ${preloadPath}`);
  return preloadPath;
};
