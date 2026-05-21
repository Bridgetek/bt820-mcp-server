import { WorkspaceContext } from "../context.js";
import { analyzeQuery } from "./analyzeQuery.js";
import { routeQuery } from "./routeQuery.js";
import { mergeResults } from "./mergeResults.js";
import { RetrievalResult } from "./types.js";

// You already have these in eveapps-core
import { searchCore } from "../search/searchCore.js";
import { searchEveApps } from "../search/searchEveApps.js";
import { searchSourceFiles } from "../search/searchSourceFiles.js";

export async function retrieveAnswer(
    context: WorkspaceContext,
    query: string
): Promise<RetrievalResult> {

    // 1. Run core search first
    const coreResult = searchCore(context, query);

    // 2. Analyze query intent
    const analysis = analyzeQuery(query);

    // 3. Decide routing
    const decision = routeQuery(
        query,
        analysis,
        coreResult?.confidence ?? 0,
        !!context.eveappsRoot
    );

    // 4. Execute based on routing decision
    switch (decision.source) {

        case "core":
            return {
                answer: coreResult.answer,
                confidence: coreResult.confidence,
                source: "core",
                references: coreResult.references
            };

        case "eveapps": {
            const eveappsResult = await searchEveApps(
                context.eveappsRoot!,
                query
            );

            return {
                answer: eveappsResult.answer,
                confidence: eveappsResult.confidence,
                source: "eveapps",
                references: eveappsResult.references
            };
        }

        case "both": {
            const eveappsResult = await searchEveApps(
                context.eveappsRoot!,
                query
            );

            return mergeResults(coreResult, eveappsResult);
        }

        default:
            return coreResult;
    }
}