import { rmSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// root dist
rmSync(path.join(__dirname, "../dist"), {
    recursive: true,
    force: true
});

// packages dist
const packagesDir = path.join(__dirname, "../packages");

if (existsSync(packagesDir)) {
    for (const pkg of readdirSync(packagesDir)) {
        rmSync(path.join(packagesDir, pkg, "dist"), {
            recursive: true,
            force: true
        });
    }
}