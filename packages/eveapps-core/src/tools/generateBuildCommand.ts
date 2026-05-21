import { z } from "zod";
import { loadBuildMatrix } from "../lib/loadIndex.js";

export const generateBuildCommandInput = z.object({
    platform: z.string(),
    graphics: z.string(),
    display: z.string(),
    spi: z.string(),
    toolchain: z.enum(["cmake", "nmake"]).default("cmake"),
});

export type GenerateBuildCommandInput = z.infer<typeof generateBuildCommandInput>;

export function generateBuildCommand(
    args: GenerateBuildCommandInput
) {
    const matrix = loadBuildMatrix();
    const platformKey = args.platform.toLowerCase();
    const graphicsKey = args.graphics.toLowerCase();
    const displayKey = args.display.toLowerCase();
    const spiKey = args.spi.toLowerCase();

    const platform = matrix.platforms[platformKey];
    const errors: string[] = [];

    if (!platform) {
        errors.push(`Unknown platform: ${args.platform}`);
    } else {
        if (!platform.graphics.includes(graphicsKey)) {
            errors.push(`Platform ${args.platform} does not support graphics ${args.graphics}`);
        }
        if (!platform.spi.includes(spiKey)) {
            errors.push(`Platform ${args.platform} does not support SPI mode ${args.spi}`);
        }
    }

    if (!matrix.displays.includes(displayKey)) {
        errors.push(`Unsupported display: ${args.display}`);
    }

    if (errors.length > 0) {
        return {
            valid: false,
            errors,
            suggested_fixes: [
                "Check platform spelling in build_matrix.json",
                "Use a display/SPI combination allowed by the repo",
            ],
        };
    }

    const command =
        args.toolchain === "cmake"
            ? `cd build && cmake -G "NMake Makefiles" -DEVE_APPS_PLATFORM=EVE_PLATFORM_${args.platform.toUpperCase()} -DEVE_APPS_GRAPHICS=EVE_GRAPHICS_${args.graphics.toUpperCase()} -DEVE_APPS_DISPLAY=EVE_DISPLAY_${args.display.toUpperCase()} -DEVE_APPS_SPI=EVE_SPI_${args.spi.toUpperCase()}`
            : `nmake SampleApp`;

    return {
        valid: true,
        command,
        notes: [
            "Generated from local build_matrix.json",
            "Add board-specific prerequisites separately if needed",
        ],
    };
}