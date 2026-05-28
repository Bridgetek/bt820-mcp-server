import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
    createWorkspaceContext,
    generateBuildCommand,
    generateBuildCommandInput,

    findRelevantSample,
    findRelevantSampleInput,

    explainEveSymbol,
    explainEveSymbolInput,

    generateScreenScaffold,
    generateScreenScaffoldInput,

    validateBt820Code,
    validateBt820CodeInput,

    traceFeatureToCommands,
    traceFeatureToCommandsInput,

    readSourceFile,
    readSourceFileInput,

    retrieveAnswer
} from "@bridgetek/eveapps-core";

import path from "path";
import fs from "fs";

// -----------------------------
// Workspace handling
// -----------------------------
function getArg(name: string): string | undefined {

    for (let i = 0; i < process.argv.length; i++) {

        const arg = process.argv[i];
        if (arg === undefined) continue;

        // --eveapps=D:/path
        if (arg.startsWith(name + "=")) {
            return arg.substring(name.length + 1);
        }

        // --eveapps D:/path
        if (arg === name) {
            return process.argv[i + 1] ?? undefined;
        }
    }

    return undefined;
}

function printUsage(): void {
    console.log(`Usage: node server.js --core <path> [--eveapps <path>]

Options:
  --core <path>       Path to the eveapps-core package or workspace root
  --workspace <path>  Alias for --core
  --eveapps <path>    Path to the local EveApps repository
  --help, -h          Show this help message
`);
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printUsage();
    process.exit(0);
}

// Core + EveApps separation (future-proof)
const coreRoot = getArg("--core") || getArg("--workspace");
const eveappsRoot = getArg("--eveapps");

if (!coreRoot) {
    console.error("Error: missing required --core or --workspace argument.");
    printUsage();
    process.exit(1);
}

// Context object passed to core
const context = createWorkspaceContext({
    workspaceRoot: coreRoot,
    eveappsRoot
});

// -----------------------------
// MCP Server
// -----------------------------
const server = new McpServer(
    {
        name: "bt820-mcp-server",
        version: "1.0.0"
    },
    {
        capabilities: {
            tools: {}
        }
    }
);

// -----------------------------
// Helper wrapper (IMPORTANT)
// Prevents MCP crash propagation
// -----------------------------
type TextContentBlock = {
    type: "text";
    text: string;
    annotations?: {
        audience?: ("user" | "assistant")[];
        priority?: number;
        lastModified?: string;
    };
    _meta?: Record<string, unknown>;
};
type ToolResponse = {
    content: TextContentBlock[];
    _meta?: Record<string, unknown>;
};

function safeTool<Args extends unknown>(fn: (args: Args, extra?: unknown) => Promise<unknown> | unknown) {
    return async (args: Args, extra?: unknown): Promise<ToolResponse> => {
        try {
            const result = await fn(args, extra);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (err: any) {
            console.error("[BT820 MCP ERROR]", err);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: err.message ?? String(err)
                        }, null, 2)
                    }
                ]
            };
        }
    };
}

// -----------------------------
// Primary BT820 engineering AI tool
// -----------------------------
server.registerTool(
    "ask_bt820",
    {
        title: "Primary BT820 and EveApps Engineering Assistant",

        description:
            "Authoritative local BT820 engineering assistant. " +
            "Uses indexed BT820 knowledge plus direct source-code " +
            "search over the local EveApps repository configured " +
            "through --eveapps. " +

            "Use this tool FIRST for all BT820, EveApps, EVE graphics, " +
            "display pipeline, rendering, widget, command buffer, " +
            "register, sample project, build system, SPI, display timing, " +
            "platform porting, UI generation, API usage, and debugging questions. " +

            "This tool searches the user's LOCAL EveApps source tree and " +
            "returns concrete source file matches, sample references, " +
            "commands, and implementation details before external web search.",

        inputSchema: z.object({
            query: z.string().describe(
                "Natural language BT820/EveApps engineering question"
            )
        }).shape
    },

    safeTool(async (args: { query: string }) => {

        const result = await retrieveAnswer(
            context,
            args.query
        );

        // Strengthen Claude confidence with explicit wording
        return {
            ...result,

            retrieval_context: {
                local_repo_enabled: !!context.eveappsRoot,
                local_repo: context.eveappsRoot ?? null,

                retrieval_priority: [
                    "eveapps-core index",
                    "local EveApps source repository",
                    "metadata ranking"
                ],

                note:
                    "Results were generated from local BT820/EveApps " +
                    "engineering resources before considering external sources."
            }
        };
    })
);

// -----------------------------
// Legacy tools (unchanged behavior)
// -----------------------------

server.registerTool(
    "generate_build_command",
    {
        title: "Generate validated BT820 build command",
        description: "Generate a validated build command for BT820/EVE targets.",
        inputSchema: generateBuildCommandInput.shape,
    },
    safeTool(generateBuildCommand)
);

server.registerTool(
    "find_relevant_sample",
    {
        title: "Find relevant EveApps sample",
        description: "Find the most relevant EveApps sample for the provided request.",
        inputSchema: findRelevantSampleInput.shape,
    },
    safeTool(findRelevantSample)
);

server.registerTool(
    "explain_eve_symbol",
    {
        title: "Explain BT820/EVE symbol",
        description: "Explain a BT820/EVE command symbol using indexed data.",
        inputSchema: explainEveSymbolInput.shape,
    },
    safeTool(explainEveSymbol)
);

server.registerTool(
    "generate_screen_scaffold",
    {
        title: "Generate screen scaffold",
        description: "Generate a BT820 screen scaffold from inputs.",
        inputSchema: generateScreenScaffoldInput.shape,
    },
    safeTool(generateScreenScaffold)
);

server.registerTool(
    "validate_bt820_code",
    {
        title: "Validate BT820 code for issues",
        description: "Validate BT820/EVE code.",
        inputSchema: validateBt820CodeInput.shape,
    },
    safeTool(validateBt820Code)
);

server.registerTool(
    "trace_feature_to_commands",
    {
        title: "Trace feature to BT820 commands",
        description: "Trace feature usage to commands.",
        inputSchema: traceFeatureToCommandsInput.shape,
    },
    safeTool(traceFeatureToCommands)
);

server.registerTool(
    "bt820_read_file",
    {
        title: "Read raw source file",
        description: "Read the raw contents of a file from the local EveApps repository.",
        inputSchema: readSourceFileInput.shape,
    },
    safeTool(async (args: { relative_path: string }) => readSourceFile(args, context))
);

// -----------------------------
// Startup diagnostics (VERY IMPORTANT for EXE)
// -----------------------------
console.error("===================================");
console.error("BT820 MCP Server Starting...");
console.error("coreRoot:", coreRoot);
console.error("eveappsRoot:", eveappsRoot ?? "NOT SET");
console.error("Node:", process.version);
console.error("===================================");

// -----------------------------
// Start transport
// -----------------------------
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("BT820 MCP Server running...");