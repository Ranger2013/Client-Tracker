import { addListener } from "../../../../../../core/utils/dom/listeners.js";
import buildInputBlocks from "./buildInputBlocks.js";
import makeInputsGreen from "./makeInputsGreen.js";

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

export default function displayMultipleInputs(form, componentId) {
    Object.entries(ACCESSORY_INPUTS).forEach(([accessory, config]) => {
        addListener({
            elementOrId: config.eleId,
            eventType: 'input',
            handler: async (evt) => {
                try {
                    buildInputBlocks(evt.target.value, accessory, form, config.displayEle);
                    makeInputsGreen(form, componentId);
                }
                catch (err) {
                    const { AppError } = await import("../../../../../../core/errors/models/AppError.js");

                    new AppError('Error building accessory input blocks: ', {
                        originalError: err,
                        shouldLog: true,
                        userMessage: 'Unable to create accessory inputs.',
                        errorCode: 'RENDER_ERROR',
                        displayTarget: config.displayEle,
                        autoHandle: true,
                    })
                }
            },
            componentId
        });
    });
}