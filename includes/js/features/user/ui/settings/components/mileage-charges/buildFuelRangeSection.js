import { buildEle, clearMsg } from "../../../../../../../../old-js-code/js/utils/dom/domUtils.js";
import { addListener } from "../../../../utils/event-listeners/listeners.js";

/**
 * Builds a fuel range section with inputs for mileage range and cost
 * @param {number} iteration - Current range iteration number
 * @param {Object} values - Existing values to populate inputs
 * @param {string} values.range - Mileage range value
 * @param {string} values.cost - Cost value
 * @param {string} componentID - Component ID for event listener tracking
 * @returns {Promise<HTMLElement|null>} The constructed range section or null if error
 */
export default async function buildFuelRangeSection(iteration, values = {}, componentID) {
    try {
        const structure = {
            row: {
                type: 'div',
                myClass: ['w3-row', 'w3-padding-small'],
                children: ['colOne', 'colTwo']
            },
            colOne: {
                type: 'div',
                myClass: ['w3-col', 'm6'],
                text: `Mileage Range ${iteration}`
            },
            colTwo: {
                type: 'div',
                myClass: ['w3-col', 'm6']
            },
            mileageRange: {
                build: () => buildMileageRangeInput(iteration, values.range, componentID)
            },
            costInput: {
                build: () => buildCostInput(iteration, values.cost, componentID)
            }
        };

        // Build elements
        const elements = await buildElements(structure);
        if (!elements) return null;

        // Assemble structure
        elements.colTwo.append(elements.mileageRange, elements.costInput);
        elements.row.append(elements.colOne, elements.colTwo);

        return elements.row;
    }
    catch (err) {
        const { handleError } = await import("../../../../../../../../old-js-code/js/utils/error-messages/handleError.js");
        await handleError({
            filename: 'buildFuelRangeSectionError',
            consoleMsg: 'Build fuel range section error: ',
            err,
            userMsg: 'Unable to create range section',
            errorEle: 'form-msg'
        });
    }
}

/**
 * Builds elements from configuration structure
 * @private
 * @param {Object} structure - Element configuration
 * @returns {Promise<Object>} Built elements
 */
async function buildElements(structure) {
    const elements = {};
    
    try {
        await Promise.all(
            Object.entries(structure).map(async ([key, config]) => {
                elements[key] = config.build 
                    ? await config.build()
                    : buildEle(config);
                    
                if (!elements[key]) throw new Error(`Failed to build ${key}`);
            })
        );
        return elements;
    } catch (err) {
        return null;
    }
}

/**
 * Builds a mileage range input section with label, input, and error container
 * @param {number} iteration - The iteration number for the range input
 * @param {string} value - Existing value to populate the input
 * @param {string} componentID - Component ID for event listener tracking
 * @returns {Promise<HTMLElement|null>} The constructed paragraph element containing the range input or null if error
 */
async function buildMileageRangeInput(iteration, value, componentID) {
    try {
        const p1 = buildEle({
            type: 'p',
        });

        const rangeLabel = buildEle({
            type: 'label',
            attributes: { for: `mileage-range-${iteration}` },
            text: 'Mileage Range'
        });

        const rangeSpan = buildEle({
            type: 'span',
            myClass: ['w3-small'],
            text: '(format: 50-59)',
        });

        const rangeInput = buildEle({
            type: 'input',
            attributes: {
                id: `mileage-range-${iteration}`,
                type: 'text',
                title: 'Mileage Range: e.g. 50-59',
                placeholder: 'Mileage Range: 50-59',
                name: `mileage_range_${iteration}`,
                required: 'required',
                value: value || ''
            },
            myClass: ['w3-input', 'w3-border'],
        });

        const rangeInputError = buildEle({
            type: 'div',
            attributes: { id: `mileage-range-${iteration}-error` }
        });

        p1.appendChild(rangeLabel);
        p1.appendChild(rangeSpan);
        p1.appendChild(rangeInput);
        p1.appendChild(rangeInputError);

        // Add an event listener to clear any error messages
        addListener(
            rangeInput, 
            'focus', 
            async () => {
                try {
                    clearMsg({ container: rangeInputError, input: rangeInput });
                }
					 catch (err) {
                    const { handleError } = await import("../../../../../../../../old-js-code/js/utils/error-messages/handleError.js");
                    await handleError({
                        filename: 'clearMileageRangeError',
                        consoleMsg: `Clear mileage range ${iteration} error: `,
                        err,
                        errorEle: rangeInputError
                    });
                }
            },
            componentID
        );

        return p1;
    }
	 catch (err) {
        const { handleError } = await import("../../../../../../../../old-js-code/js/utils/error-messages/handleError.js");
        await handleError({
            filename: 'buildMileageRangeInputError',
            consoleMsg: `Build mileage range ${iteration} error: `,
            err
        });
        throw err;
    }
}

/**
 * Builds a cost input section with label, input, and error container
 * @param {number} iteration - The iteration number for the cost input
 * @param {string} value - Existing value to populate the input
 * @param {string} componentID - Component ID for event listener tracking
 * @returns {Promise<HTMLElement|null>} The constructed paragraph element containing the cost input or null if error
 */
async function buildCostInput(iteration, value, componentID) {
    try {
        const p1 = buildEle({
            type: 'p',
        });

        const rangeLabel = buildEle({
            type: 'label',
            attributes: { for: `fuel-cost-${iteration}` },
            text: 'Fuel Cost'
        });

        const rangeInput = buildEle({
            type: 'input',
            attributes: {
                id: `fuel-cost-${iteration}`,
                type: 'number',
                title: 'Fuel Costs',
                placeholder: 'Fuel Costs',
                name: `fuel_cost_${iteration}`,
                required: 'required',
                value: value || ''
            },
            myClass: ['w3-input', 'w3-border'],
        });

        const rangeInputError = buildEle({
            type: 'div',
            attributes: { id: `fuel-cost-${iteration}-error` }
        });

        p1.appendChild(rangeLabel);
        p1.appendChild(rangeInput);
        p1.appendChild(rangeInputError);

        // Add an event listener to clear any error messages
        addListener(
            rangeInput, 
            'focus', 
            async () => {
                try {
                    clearMsg({ container: rangeInputError, input: rangeInput });
                }
					 catch (err) {
                    const { handleError } = await import("../../../../../../../../old-js-code/js/utils/error-messages/handleError.js");
                    await handleError({
                        filename: 'clearCostInputError',
                        consoleMsg: `Clear cost input ${iteration} error: `,
                        err,
                        errorEle: rangeInputError
                    });
                }
            },
            componentID
        );

        return p1;
    }
	 catch (err) {
        const { handleError } = await import("../../../../../../../../old-js-code/js/utils/error-messages/handleError.js");
        await handleError({
            filename: 'buildCostInputError',
            consoleMsg: `Build cost input ${iteration} error: `,
            err
        });
        throw err;
    }
}