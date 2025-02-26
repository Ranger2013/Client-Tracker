import { addListener } from "../../../../../../core/utils/dom/listeners.js";
import buildInputBlocks from "./buildInputBlocks.js";

const COMPONENT_ID = 'multiple-inputs';

// Configuration for accessory inputs that can have multiple values
const ACCESSORY_INPUTS = {
    pads: {
        eleId: 'num-pads',
        displayEle: 'display-pads'
    },
    packing: {
        eleId: 'num-packing',
        displayEle: 'display-packing'
    },
    wedges: {
        eleId: 'num-wedges',
        displayEle: 'display-wedges'
    }
};

export default function displayMultipleInputs(form) {
    Object.entries(ACCESSORY_INPUTS).forEach(([accessory, config]) => {
        addListener(
            config.eleId, 
            'input', 
            async evt => {
                try {
                    await buildInputBlocks(evt.target.value, accessory, form, config.displayEle);
                }
					 catch (err) {
                    const { handleError } = await import("../../../../../../../../old-js-code/js/utils/error-messages/handleError.js");
                    await handleError({
                        filename: `buildInputBlocksError_${accessory}`,
                        consoleMsg: `Build input blocks error for ${accessory}: `,
                        err,
                        userMsg: 'Unable to create accessory inputs',
                        errorEle: config.displayEle
                    });
                }
            },
            COMPONENT_ID
        );
    });
}