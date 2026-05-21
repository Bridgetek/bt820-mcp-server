import fs from "fs";
import path from "path";

export interface WorkspaceContextOptions {
    workspaceRoot: string;
    eveappsRoot?: string;
}

export interface WorkspaceContext {
    workspaceRoot: string;
    eveappsRoot?: string;

    dataRoot: string;

    resolveDataPath(file: string): string;

    readJsonFile<T>(file: string): T;
}

export function createWorkspaceContext(
    options: WorkspaceContextOptions
): WorkspaceContext {
    const workspaceRoot = path.resolve(options.workspaceRoot);

    const dataRoot = path.join(workspaceRoot, "data");

    function resolveDataPath(file: string): string {
        const candidates = [
            path.join(workspaceRoot, "data", file),
            path.join(workspaceRoot, "dist", "data", file)
        ];

        for (const p of candidates) {
            if (fs.existsSync(p)) return p;
        }

        throw new Error(
            `Missing data file: ${file}\nChecked:\n${candidates.join("\n")}`
        );
    }

    function readJsonFile<T>(file: string): T {
        const fullPath = resolveDataPath(file);

        if (!fs.existsSync(fullPath)) {
            throw new Error(
                `Required data file not found: ${fullPath}`
            );
        }

        const content = fs.readFileSync(fullPath, "utf-8");

        return JSON.parse(content) as T;
    }

    return {
        workspaceRoot,
        eveappsRoot: options.eveappsRoot ? path.resolve(options.eveappsRoot) : undefined,
        dataRoot,
        resolveDataPath,
        readJsonFile,
    };
}