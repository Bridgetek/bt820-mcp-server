import { WorkspaceContext } from "../context.js";
import type { RetrievalResult } from "../router/types.js";
import { loadCommands, loadRegisters } from "../lib/loadIndex.js";

export function searchCore(context: WorkspaceContext, query: string): RetrievalResult {
    try {
        const commands = loadCommands();
        const registers = loadRegisters();
        const queryLower = query.toLowerCase();

        // Try to find exact command/register matches
        const matchedCommands = commands.filter(c =>
            c.name.toLowerCase().includes(queryLower) ||
            c.summary?.toLowerCase().includes(queryLower)
        ).slice(0, 5);

        const matchedRegisters = registers.filter(r =>
            r.name.toLowerCase().includes(queryLower) ||
            r.summary?.toLowerCase().includes(queryLower)
        ).slice(0, 5);

        const hasMatches = matchedCommands.length > 0 || matchedRegisters.length > 0;

        if (!hasMatches) {
            return {
                answer: {
                    message: `No BT820/EVE core references found for: "${query}"`,
                    tip: "Try searching for specific command names, register names, or features"
                },
                confidence: 0,
                source: "core",
                references: []
            };
        }

        const references: string[] = [];
        if (matchedCommands.length > 0) {
            references.push(`Commands: ${matchedCommands.map(c => c.name).join(", ")}`);
        }
        if (matchedRegisters.length > 0) {
            references.push(`Registers: ${matchedRegisters.map(r => r.name).join(", ")}`);
        }

        return {
            answer: {
                message: `Found ${matchedCommands.length} commands and ${matchedRegisters.length} registers for: "${query}"`,
                commands: matchedCommands.map(c => ({
                    name: c.name,
                    type: "command",
                    signature: c.signature,
                    summary: c.summary,
                    related_samples: c.related_samples || [],
                })),
                registers: matchedRegisters.map(r => ({
                    name: r.name,
                    type: r.kind,
                    value: r.value,
                    summary: r.summary,
                }))
            },
            confidence: hasMatches ? 0.7 : 0,
            source: "core",
            references
        };
    } catch (err) {
        return {
            answer: {
                error: `Error searching core data: ${err instanceof Error ? err.message : String(err)}`
            },
            confidence: 0,
            source: "core",
            references: []
        };
    }
}
