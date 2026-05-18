import { z } from "zod";
import { loadCommands, loadRegisters } from "../lib/loadIndex.js";

export const explainEveSymbolInput = z.object({
    symbol: z.string().min(2),
});

export type ExplainEveSymbolInput = z.infer<typeof explainEveSymbolInput>;

export function explainEveSymbol(args: ExplainEveSymbolInput) {
    const commands = loadCommands();
    const registers = loadRegisters();
    const symbol = args.symbol.trim();

    const commandItem = commands.find(
        (c) => c.name.toLowerCase() == symbol.toLowerCase()
    );

    if (commandItem) {
        return {
            found: true,
            symbol: commandItem.name,
            type: "command",
            signature: commandItem.signature,
            summary: commandItem.summary,
            parameters: commandItem.params ?? [],
            related_samples: commandItem.related_samples ?? [],
            related_features: commandItem.related_features ?? [],
            source_file: commandItem.source_file,
            usage_notes: [
                "Prefer verifying usage against the closest sample in the repository.",
                "Check command ordering and display-list flow in surrounding code.",
            ],
            common_mistakes: [
                "Passing invalid coordinates or flags.",
                "Using the command outside the expected rendering flow.",
            ],
        };
    }

    const registerItem = registers.find(
        (r) => r.name.toLowerCase() === symbol.toLowerCase()
    );

    if (registerItem) {
        return {
            found: true,
            symbol: registerItem.name,
            type: registerItem.kind,
            value: registerItem.value,
            summary: registerItem.summary,
            related_features: registerItem.related_features ?? [],
            source_file: registerItem.source_file,
            usage_notes: [
                "Verify the exact semantics in the programming guide/datasheet.",
                "Check whether this symbol is read-only, write-only, or bitfield-based.",
            ],
        };
    }

    return {
        found: false,
        symbol,
        message: `No exact symbol match found for ${symbol}.`,
    };
}