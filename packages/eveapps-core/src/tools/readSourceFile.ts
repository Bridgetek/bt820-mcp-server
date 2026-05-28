import fs from "fs";
import path from "path";
import { z } from "zod";

import type { WorkspaceContext } from "../context.js";

export const readSourceFileInput = z.object({
    relative_path: z
        .string()
        .min(1)
        .describe("Path to a source file under the local EveApps repo, for example: SampleApp/Widget/Src/Widget.c"),
});

export type ReadSourceFileInput = z.infer<typeof readSourceFileInput>;

export function readSourceFile(
    args: ReadSourceFileInput,
    context: WorkspaceContext
) {
    const repoRoot = path.resolve(context.eveappsRoot ?? context.workspaceRoot);
    const fullPath = path.resolve(repoRoot, args.relative_path);
    const relativePath = path.relative(repoRoot, fullPath);

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        throw new Error("relative_path must stay inside the local EveApps repository root.");
    }

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
        throw new Error(`File not found: ${args.relative_path}`);
    }

    return {
        path: relativePath.split(path.sep).join("/"),
        size_bytes: fs.statSync(fullPath).size,
        content: fs.readFileSync(fullPath, "utf-8"),
    };
}
