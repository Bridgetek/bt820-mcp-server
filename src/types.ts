export interface CommandIndexItem {
    name: string;
    category: string;
    signature: string;
    summary: string;
    params?: Array<{
        name: string;
        type: string;
        desc: string;
    }>;
    related_samples?: string[];
    related_features?: string[];
    source_file: string;
}

export interface SampleIndexItem {
    id: string;
    name: string;
    path: string;
    categories: string[];
    summary: string;
    commands_used: string[];
    platform_notes?: string[];
    assets_required?: string[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    keywords?: string[];
}

export type Command = {
    name: string;
    type: string;
    level: string;
    weight: number;
};

export interface FeatureGraphItem {
    commands: Command[];
    samples: string[];
    keywords: string[];
}

export interface BuildMatrix {
    platforms: Record<
        string,
        {
            graphics: string[];
            spi: string[];
        }
    >;
    displays: string[];
}