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
                    // Handle error terminally here because:
                    // 1. It's isolated to this input section
                    // 2. Rest of form can still work
                    await AppError.handleError(err, {
                        errorCode: AppError.Types.RENDER_ERROR,
                        userMessage: `Unable to create ${accessory} inputs. ${AppError.BaseMessages.system.helpDesk}`,
                        displayTarget: config.displayEle,
                    });
                }
            },
            componentId
        });
    });
}