import getAllFormIdElements from "../../../../../../core/utils/dom/forms/getAllFormIDElements.js";
import buildInputBlocks from "./buildInputBlocks.js";

export default async function populateFarrierPricesForm({formEle, manageUser}) {
    try {
        const farrierPrices = await manageUser.getFarrierPrices();

        if(Object.keys(farrierPrices).length === 0) return;
        
        if(farrierPrices){
            handleFarrierPrices(formEle, farrierPrices);
            handleAccessories(formEle, farrierPrices.accessories);
        }
    }
    catch (err) {
        const { handleError } = await import("../../../../../../../../old-js-code/js/utils/error-messages/handleError.js");
        await handleError({
            filename: 'populateFarrierPricesFormError',
            consoleMsg: 'Populate farrier prices form error: ',
            err,
            userMsg: 'Unable to load saved pricing.',
            errorEle: fm
        });
    }
}

function handleFarrierPrices(formEle, farrierPrices) {
    try {
        const elements = getAllFormIdElements(formEle);
        
        // Populate the farrier prices
        Object.entries(elements).forEach(([_, ele]) => {
            if(farrierPrices[ele.name]){
                ele.value = farrierPrices[ele.name];
            }
        });
    }
    catch (err) {
        throw err;
    }
}

function handleAccessories(form, accessoryPrices) {
    try {
        // Set the accessory inputs
        const accessories = [
            'pads',
            'packing',
            'wedges',
            'rockers',
            'clips',
            'casting',
            'sedation',
        ];

        accessories.forEach(accessory => {
            const accessoryValues = accessoryPrices[accessory];
            // Check if the accessory has values
            if (accessoryValues && accessoryValues.length > 0) {
                const numberInputEle = document.getElementById(`num-${accessory}`);
                const displayElement = document.getElementById(`display-${accessory}`);
                const singleInputEle = document.getElementById(accessory);

                // Double check to make sure we have a num-accessory. E.G. num-pads
                if (numberInputEle) {
                    // Get the length of the accessory values and set the number
                    const valueLength = accessoryValues.length;
                    numberInputEle.value = valueLength > 0 ? valueLength : '';

                    if (valueLength > 0 && displayElement) {
                        buildInputBlocks(valueLength, accessory, form, displayElement, accessoryValues);
                    }
                } else if (singleInputEle && accessoryValues.length > 0) {
                    singleInputEle.value = accessoryValues[0].cost;
                }
            }
        });
    }
    catch (err) {
        throw err;
    }
}