import fs from "fs";
import path from "path";

export interface SourceFileMatch {
    file: string;
    relativePath: string;
    matchedLines: string[];
}

const SOURCE_EXTENSIONS = [
    ".c",
    ".h",
    ".txt",
    ".md"
];

function collectFiles(dir: string, out: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            collectFiles(fullPath, out);
            continue;
        }

        const ext = path.extname(entry.name).toLowerCase();

        if (SOURCE_EXTENSIONS.includes(ext)) {
            out.push(fullPath);
        }
    }

    return out;
}

export function searchSourceFiles(
    eveappsRoot: string,
    query: string
): SourceFileMatch[] {

    const files = collectFiles(eveappsRoot);
    const q = query.toLowerCase();

    const results: SourceFileMatch[] = [];

    for (const file of files) {

        try {
            const text = fs.readFileSync(file, "utf-8");

            const lines = text.split(/\r?\n/);

            const matchedLines = lines
                .filter(line => line.toLowerCase().includes(q))
                .slice(0, 5);

            if (matchedLines.length > 0) {
                results.push({
                    file,
                    relativePath: path.relative(eveappsRoot, file),
                    matchedLines
                });
            }

        } catch {
            // ignore unreadable files
        }
    }

    return results.slice(0, 10);
}