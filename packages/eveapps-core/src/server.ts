import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
    findRelevantSample,
    findRelevantSampleInput,
} from "./tools/findRelevantSample.js";
import {
    explainEveSymbol,
    explainEveSymbolInput,
} from "./tools/explainEveSymbol.js";
import {
    generateBuildCommand,
    generateBuildCommandInput,
} from "./tools/generateBuildCommand.js";
import {
    traceFeatureToCommands,
    traceFeatureToCommandsInput,
} from "./tools/traceFeatureToCommands.js";
import {
    generateScreenScaffold,
    generateScreenScaffoldInput,
} from "./tools/generateScreenScaffold.js";
import {
    validateBt820Code,
    validateBt820CodeInput,
} from "./tools/validateBt820Code.js";

import { loadBuildMatrix, loadCommands, loadSamples, loadRegisters } from "./lib/loadIndex.js";

const server = new McpServer({
    name: "bt820-mcp-server",
    version: "0.1.0",
});

server.registerTool(
    "find_relevant_sample",
    {
        title: "Find Relevant BT820 Sample",
        description: "Find the most relevant sample in the BT820 repository for a user request.",
        inputSchema: findRelevantSampleInput.shape,
    },
    async (args) => ({
        content: [
            {
                type: "text",
                text: JSON.stringify(findRelevantSample(args), null, 2),
            },
        ],
    })
);

server.registerTool(
    "explain_eve_symbol",
    {
        title: "Explain EVE Symbol",
        description: "Explain a BT820/EVE command symbol from the indexed repository data.",
        inputSchema: explainEveSymbolInput.shape,
    },
    async (args) => ({
        content: [
            {
                type: "text",
                text: JSON.stringify(explainEveSymbol(args), null, 2),
            },
        ],
    })
);

server.registerTool(
    "generate_build_command",
    {
        title: "Generate Build Command",
        description: "Generate a valid build command from platform/graphics/display/SPI selections.",
        inputSchema: generateBuildCommandInput.shape,
    },
    async (args) => ({
        content: [
            {
                type: "text",
                text: JSON.stringify(generateBuildCommand(args), null, 2),
            },
        ],
    })
);

server.registerTool(
    "trace_feature_to_commands",
    {
        title: "Trace Feature to Commands",
        description: "Map a requested BT820 feature to related commands and samples.",
        inputSchema: traceFeatureToCommandsInput.shape,
    },
    async (args) => ({
        content: [
            {
                type: "text",
                text: JSON.stringify(traceFeatureToCommands(args), null, 2),
            },
        ],
    })
);

server.registerTool(
    "generate_screen_scaffold",
    {
        title: "Generate Screen Scaffold",
        description: `
Generate COMPLETE production-ready BT820 screen scaffold.

IMPORTANT:
- Preserve ALL initialization flow
- Preserve patch loading
- Preserve calibration flow
- Preserve display configuration
- Preserve cleanup/release flow
- Do NOT simplify or omit hardware initialization code

The generated scaffold should be treated as authoritative source code,
NOT as a partial example.
`,
        inputSchema: generateScreenScaffoldInput.shape,
    },
    async (args) => {
        const scaffold = generateScreenScaffold(args);

        if (!scaffold.files?.length) {
            throw new Error("No scaffold files generated");
        }

        const files = scaffold.files;
        const file = files[0]!;

        const artifact = {
            artifactType: "source_file",
            scaffoldType: "full_screen_template",

            language: "c",
            path: file.path,

            authoritative: true,

            preserveRuntimeInit: true,
            preservePatchLoading: true,
            preserveCalibration: true,
            preserveDisplayConfig: true,

            notes: scaffold.notes,

            content: file.content,
        };

        return {
            structuredContent: artifact,

            content: [
                {
                    type: "text",
                    text:
`AUTHORITATIVE GENERATED FILE

Path: ${file.path}

IMPORTANT:
Use this code EXACTLY as generated.

DO NOT remove:
- Gpu_Init
- Display_Config
- EVE_Load_Patch
- EVE_Calibrate
- Calibration_Save
- cleanup/release flow

This initialization sequence is REQUIRED for BT820 hardware bring-up.
`,
                },
                {
                    type: "text",
                    text: file.content,
                },
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            artifactType: artifact.artifactType,
                            scaffoldType: artifact.scaffoldType,
                            path: artifact.path,
                            authoritative: artifact.authoritative,
                            preserveRuntimeInit:
                                artifact.preserveRuntimeInit,
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }
);

server.registerTool(
    "validate_bt820_code",
    {
        title: "Validate BT820 Code",
        description: "Check BT820/EVE code for common structural issues.",
        inputSchema: validateBt820CodeInput.shape,
    },
    async (args) => ({
        content: [
            {
                type: "text",
                text: JSON.stringify(validateBt820Code(args), null, 2),
            },
        ],
    })
);

server.registerResource(
    "bt820_commands",
    "bt820://api/commands",
    {
        title: "BT820 Commands Index",
        description: "Indexed BT820/EVE command list",
        mimeType: "application/json",
    },
    async () => ({
        contents: [
            {
                uri: "bt820://api/commands",
                mimeType: "application/json",
                text: JSON.stringify(loadCommands(), null, 2),
            },
        ],
    })
);

server.registerResource(
    "bt820_registers",
    "bt820://api/registers",
    {
        title: "BT820 Registers Index",
        description: "Indexed BT820/EVE register and constant list",
        mimeType: "application/json",
    },
    async () => ({
        contents: [
            {
                uri: "bt820://api/registers",
                mimeType: "application/json",
                text: JSON.stringify(loadRegisters(), null, 2),
            },
        ],
    })
);

server.registerResource(
    "bt820_samples",
    "bt820://samples",
    {
        title: "BT820 Samples Index",
        description: "Indexed BT820 sample list",
        mimeType: "application/json",
    },
    async () => ({
        contents: [
            {
                uri: "bt820://samples",
                mimeType: "application/json",
                text: JSON.stringify(loadSamples(), null, 2),
            },
        ],
    })
);

server.registerResource(
    "bt820_build_matrix",
    "bt820://build/matrix",
    {
        title: "BT820 Build Matrix",
        description: "Allowed build combinations",
        mimeType: "application/json",
    },
    async () => ({
        contents: [
            {
                uri: "bt820://build/matrix",
                mimeType: "application/json",
                text: JSON.stringify(loadBuildMatrix(), null, 2),
            },
        ],
    })
);

async function main() {
    console.error("MCP SERVER STARTED");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP SERVER CONNECTED");
}

main().catch((err) => {
    console.error("BT820 MCP server failed:", err);
    process.exit(1);
});