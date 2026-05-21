import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
    BuildMatrix,
    CommandIndexItem,
    FeatureGraphItem,
    SampleIndexItem,
} from "../types.js";

export interface RegisterIndexItem {
    name: string;
    kind: string;
    value: string;
    summary: string;
    source_file: string;
    related_features?: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../../data");

function readJsonFile<T>(filename: string): T {
    const fullPath = path.join(dataDir, filename);
    const raw = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(raw) as T;
}

export function loadCommands(): CommandIndexItem[] {
    return readJsonFile<CommandIndexItem[]>("commands.json");
}

export function loadSamples(): SampleIndexItem[] {
    return readJsonFile<SampleIndexItem[]>("samples.json");
}

export function loadBuildMatrix(): BuildMatrix {
    return readJsonFile<BuildMatrix>("build_matrix.json");
}

export function loadFeatureGraph(): Record<string, FeatureGraphItem> {
    return readJsonFile<Record<string, FeatureGraphItem>>("feature_graph.json");
}

export function loadRegisters(): RegisterIndexItem[] {
    return readJsonFile<RegisterIndexItem[]>("registers.json");
}