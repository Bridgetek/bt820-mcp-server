import type { FeatureGraphItem, SampleIndexItem } from "../types.js";
import { tokenize, normalizeText } from "./normalize.js";

export function rankSamples(
    query: string,
    samples: SampleIndexItem[],
    featureGraph: Record<string, FeatureGraphItem>,
    platform?: string
) {
    const q = normalizeText(query);
    const qTokens = new Set(tokenize(query));

    return samples
        .map((sample) => {
            let score = 0;

            const haystack = normalizeText([
                sample.name,
                sample.summary,
                ...(sample.categories ?? []),
                ...(sample.keywords ?? []),
                ...(sample.commands_used ?? []),
            ].join(" "));

            for (const token of qTokens) {
                if (haystack.includes(token)) score += 2;
            }

            for (const [feature, meta] of Object.entries(featureGraph)) {
                if (q.includes(feature) || meta.keywords.some((k) => q.includes(k.toLowerCase()))) {
                    if (meta.samples.includes(sample.id)) score += 5;
                    const overlap = sample.commands_used.filter((c) => meta.commands.some((cmd) => cmd.name === c)).length;
                    score += overlap;
                }
            }

            if (platform && sample.platform_notes?.includes(platform)) {
                score += 2;
            }

            if (sample.difficulty === "beginner") {
                score += 0.5;
            }

            return { sample, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
}