import path from "path";
import { app } from "electron";
import { isDev } from "./util.js";

// export const getPreloadPath = () => {
//   const preloadPath = path.join(
//     app.getAppPath(),
//     isDev() ? "." : "..",
//     "/dist-electron/preload.cjs"
//   );
//   console.log(`Preload script path: ${preloadPath}`); // Added logging for debugging
//   return preloadPath;
// };

export const getPreloadPath = () => {
  const preloadPath = isDev()
    ? path.resolve(__dirname, "../dist-electron/preload.cjs") // Assuming dev output is one folder up from src
    : path.join(app.getAppPath(), "dist-electron", "preload.cjs");

  console.log(`Preload script path: ${preloadPath}`);
  return preloadPath;
};
