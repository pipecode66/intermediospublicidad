import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const dist = resolve(root, "dist");

if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}

mkdirSync(dist, { recursive: true });

const entries = ["index.html", "styles.css", "script.js", "assets"];

for (const entry of entries) {
  cpSync(resolve(root, entry), resolve(dist, entry), { recursive: true });
}

console.log("Build completed. Output folder: dist/");
