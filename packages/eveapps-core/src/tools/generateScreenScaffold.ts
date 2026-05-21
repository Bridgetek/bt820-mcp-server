import { z } from "zod";

export const generateScreenScaffoldInput = z.object({
    screen_type: z.string(),
    controls: z.array(z.string()).default([]),
    touch: z.boolean().default(true),
    platform: z.string().optional(),
    style: z.string().default("repo-native-c"),
    flash: z.boolean().default(false),
});

export type GenerateScreenScaffoldInput = z.infer<typeof generateScreenScaffoldInput>;

export function generateScreenScaffold(args: GenerateScreenScaffoldInput) {
    const functionName = `${args.screen_type.replace(/\s+/g, "_").toLowerCase()}_screen_draw`;

    const includes = `#include "Common.h"
#include "EvePatch.h"${args.flash ? `
#include "FlashHelper.h"` : ""}`;

    const displayMode = (() => {
        const platform = args.platform?.toLowerCase() ?? "";
        if (platform.includes("directvideo")) return "MODE_DIRECTVIDEO";
        if (platform.includes("video")) return "MODE_VIDEO";
        if (platform.includes("lvdsrx_sc")) return "MODE_LVDSRX_SC";
        if (platform.includes("lvdsrx")) return "MODE_LVDSRX";
        return "MODE_PICTURE";
    })();

    const content = `${includes}

void ${functionName}(EVE_HalContext* phost) {
    /* Initialize display and load patch */
    s_pHalContext = &s_halContext;
    Gpu_Init(s_pHalContext);
    Display_Config(s_pHalContext, YCBCR, ${displayMode});

    if (EVE_Load_Patch(s_pHalContext, PATCH_BASE) != 0)
        eve_printf_debug("load patch failed\n");
    else
        eve_printf_debug("load patch ok\n");

    // read and store calibration settings for later use
    EVE_Calibrate(s_pHalContext);
    Calibration_Save(s_pHalContext);

    EVE_Util_clearScreen(s_pHalContext);

    /* Title */
    EVE_CoCmd_text(phost, 40, 30, 30, 0, "${args.screen_type}"); 

    /* Controls */
    ${args.controls.map((c, i) => `/* TODO: control ${i + 1}: ${c} */`).join("\n    ")}

    ${args.touch ? "/* TODO: assign TAG values and handle touch routing */" : ""}

    EVE_Util_clearScreen(s_pHalContext);
    Gpu_Release(s_pHalContext);
}
`;

    return {
        based_on_sample: "to-be-selected-by-findRelevantSample",
        files: [
            {
                path: `generated/${functionName}.c`,
                content,
            },
        ],
        notes: [
            "Minimal scaffold only",
            "You still need to add the proper frame begin/end flow",
            "Use the nearest widget/touch sample as the implementation reference",
        ],
    };
}
