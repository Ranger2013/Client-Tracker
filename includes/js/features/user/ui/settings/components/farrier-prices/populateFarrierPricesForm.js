import getAllFormIdElements from "../../../../../../core/utils/dom/forms/getAllFormIDElements.js";
import buildInputBlocks from "./buildInputBlocks.js";
import makeInputsGreen from './makeInputsGreen.js';

// Set up debug mode
const COMPONENT = 'Farrier Prices';
const DEBUG = false;
const debugLog = (...args) => {
    if (DEBUG) {
        console.log(COMPONENT, ...args);
    }
};

/**
 * Populates the farrier prices form with saved pricing data
 * @async
 * @param {Object} params - The parameters object
 * @param {HTMLFormElement} params.formEle - The form element to populate
 * @param {Object} params.manageUser - The user management interface
 * @param {Function} params.manageUser.getFarrierPrices - Method to retrieve farrier prices
 * @throws {AppError} If there's an error populating the form
 * @returns {Promise<void>}
 */
export default async function populateFarrierPricesForm({form, manageUser, componentId}) {
    try {
        debugLog('populateFarrierPricesForm: formEle', form);
        const farrierPrices = await manageUser.getFarrierPrices();

        if(Object.keys(farrierPrices).length === 0) return;
        
        if(farrierPrices){
            handleFarrierPrices({form, farrierPrices});
            handleAccessories({form, accessoryPrices: farrierPrices.accessories});
            await makeInputsGreen({form, componentId});
        }
    }
    catch (err) {
        // Terminal - fails silently
        const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.FORM_POPULATION_ERROR,
            userMessage: null,
        });
    }
}

/**
 * Populates the basic farrier price fields in the form
 * @private
 * @param {HTMLFormElement} formEle - The form element containing price inputs
 * @param {Object} farrierPrices - Object containing farrier pricing data
 * @param {Object} farrierPrices[key] - Price values keyed by input name
 * @throws {Error} If there's an error handling the farrier prices
 */
function handleFarrierPrices({form, farrierPrices}) {
    try {
        const elements = getAllFormIdElements(form);
        
        // Populate the farrier prices
        Object.entries(elements).forEach(([_, ele]) => {
            if(farrierPrices[ele.name] === undefined) return;

            debugLog(`ele.value: ${ele.value} === farrierPrices[${ele.name}]: ${farrierPrices[ele.name]}`);
            // If values match, do nothing.
            if(ele.value === farrierPrices[ele.name]) return;

            const newValue = farrierPrices[ele.name] || '';
            const currentValue = ele.removeAttribute('value');

            ele.value = newValue;
        });
    }
    catch (err) {
        throw err;
    }
}

/**
 * Populates the accessory-related price fields in the form
 * @private
 * @param {HTMLFormElement} form - The form element containing accessory inputs
 * @param {Object} accessoryPrices - Object containing pricing for accessories
 * @param {Array<Object>} [accessoryPrices.pads] - Array of pad pricing objects
 * @param {Array<Object>} [accessoryPrices.packing] - Array of packing pricing objects
 * @param {Array<Object>} [accessoryPrices.wedges] - Array of wedge pricing objects
 * @param {Array<Object>} [accessoryPrices.rockers] - Array of rocker pricing objects
 * @param {Array<Object>} [accessoryPrices.clips] - Array of clip pricing objects
 * @param {Array<Object>} [accessoryPrices.casting] - Array of casting pricing objects
 * @param {Array<Object>} [accessoryPrices.sedation] - Array of sedation pricing objects
 * @throws {Error} If there's an error handling the accessories
 */
function handleAccessories({form, accessoryPrices}) {
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
                        buildInputBlocks({
                            numBlocks: valueLength,
                            inputName: accessory,
                            display: displayElement,
                            value: accessoryValues
                        });
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