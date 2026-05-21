export function normalizeText(input: string): string {
    return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function tokenize(input: string): string[] {
    return normalizeText(input)
        .split(/[^a-z0-9_+.-]+/i)
        .map((s) => s.trim())
        .filter(Boolean);
}