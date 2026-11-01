import fs from "node:fs";
import path from "path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function preferTypeScriptSource(): Plugin {
  return {
    name: "prefer-typescript-source",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer || source.includes("\0")) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved || resolved.external) return null;
      const [file, query] = resolved.id.split("?");
      if (!file || !/[\\/]src[\\/]/.test(file)) return null;
      if (!file.endsWith(".js") && !file.endsWith(".jsx")) return null;
      const stem = file.replace(/\.jsx?$/, "");
      const candidates = file.endsWith(".jsx") ? [`${stem}.tsx`] : [`${stem}.tsx`, `${stem}.ts`];
      const match = candidates.find((candidate) => fs.existsSync(candidate));
      if (!match) return null;
      return query ? `${match}?${query}` : match;
    },
  };
}

export default defineConfig({
  plugins: [preferTypeScriptSource(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
