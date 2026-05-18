import { z } from "zod";

export const validateBt820CodeInput = z.object({
    code: z.string().min(1),
    platform: z.string().optional(),
    display: z.string().optional(),
});

export type ValidateBt820CodeInput = z.infer<typeof validateBt820CodeInput>;

export function validateBt820Code(args: ValidateBt820CodeInput) {
    const code = args.code;
    const issues: Array<{
        severity: "high" | "medium" | "low";
        title: string;
        detail: string;
        suggestion: string;
    }> = [];

    if (!/EVE_CoCmd_text|EVE_CoCmd_button|EVE_CoCmd_/m.test(code)) {
        issues.push({
            severity: "low",
            title: "No obvious coprocessor commands detected",
            detail: "The snippet does not appear to use known EVE command helpers.",
            suggestion: "Check whether this is the intended rendering layer.",
        });
    }

    const tagMatches = [...code.matchAll(/\bTAG\s*\(\s*(\d+)\s*\)/g)].map((m) => m[1]);
    const duplicates = tagMatches.filter((tag, i) => tagMatches.indexOf(tag) !== i);
    if (duplicates.length > 0) {
        issues.push({
            severity: "medium",
            title: "Duplicate touch tag values",
            detail: `Repeated TAG ids found: ${[...new Set(duplicates)].join(", ")}`,
            suggestion: "Assign unique TAG values to each interactive control.",
        });
    }

    if (!/DISPLAY|swap|Swap|DL_DISPLAY/i.test(code)) {
        issues.push({
            severity: "medium",
            title: "Possible incomplete frame/display-list sequence",
            detail: "No obvious display termination or swap marker found.",
            suggestion: "Verify the display-list end and frame swap sequence.",
        });
    }

    return {
        issues,
        summary: {
            high: issues.filter((i) => i.severity === "high").length,
            medium: issues.filter((i) => i.severity === "medium").length,
            low: issues.filter((i) => i.severity === "low").length,
        },
    };
}