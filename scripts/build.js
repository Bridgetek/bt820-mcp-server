import { execSync } from "child_process";

console.log("Building...");

execSync("tsc -p tsconfig.json", { stdio: "inherit" });

console.log("Build done");