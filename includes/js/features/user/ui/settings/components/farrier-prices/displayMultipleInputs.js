import { addListener } from "../../../../../../core/utils/dom/listeners.js";
import buildInputBlocks from "./buildInputBlocks.js";
import makeInputsGreen from "./makeInputsGreen.js";

// Configuration for accessory inputs that can have multiple values
export default async function displayMultipleInputs(form, componentId) {
    try {
        const eventHandlers = {
            'input:num-pads': async (evt) => {
                buildInputBlocks({ numBlocks: evt.target.value, inputName: 'pads', display: 'display-pads' });
                await makeInputsGreen(form, componentId);
            },
            'input:num-packing': async (evt) => {
                buildInputBlocks({ numBlocks: evt.target.value, inputName: 'packing', display: 'display-packing' });
                await makeInputsGreen(form, componentId);
            },
            'input:num-wedges': async (evt) => {
                buildInputBlocks({ numBlocks: evt.target.value, inputName: 'wedges', display: 'display-wedges' });
                await makeInputsGreen(form, componentId);
            },
        };

        addListener({
            elementOrId: form,
            eventType: 'input',
            handler: async (evt) => {
                try {
                    const keyPath = `${evt.type}:${evt.target.id}`;
                    console.log('KeyPath:', keyPath);
                    if (eventHandlers[keyPath]) {
                        console.log('we have the handler keypath.')
                        eventHandlers[keyPath](evt);
                    }
                }
                catch (err) {
                    const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
                    AppError.handleError(err, {
                        errorCode: AppError.Types.RENDER_ERROR,
                        userMessage: 'Error building accessory inputs',
                        displayTarget: evt.target,
                    });
                }
            },
            componentId,
        });
    }
    catch (err) {
        const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.INITIALIZATION_ERROR,
            userMessage: AppError.BaseMessages.system.initialization,
        });
    }
}