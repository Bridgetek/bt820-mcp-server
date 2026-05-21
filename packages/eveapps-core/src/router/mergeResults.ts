import type { RetrievalResult } from "./types.js";

export function mergeResults(coreResult: any, eveappsResult: any): RetrievalResult {
    return {
        answer: coreResult.answer ?? eveappsResult.answer,
        confidence: Math.max(
            coreResult.confidence ?? 0,
            eveappsResult.confidence ?? 0
        ),
        source: "both",
        references: [
            ...(coreResult.references ?? []),
            ...(eveappsResult.references ?? [])
        ]
    };
}