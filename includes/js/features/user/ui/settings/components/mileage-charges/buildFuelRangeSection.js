import { buildEle } from "../../../../../../core/utils/dom/elements.min.js";
import { addListener } from "../../../../../../core/utils/dom/listeners.min.js";
import { clearMsg } from "../../../../../../core/utils/dom/messages.min.js";

/**
 * Builds a fuel range section with inputs for mileage range and cost
 * @param {number} iteration - Current range iteration number
 * @param {Object} values - Existing values to populate inputs
 * @param {string} values.range - Mileage range value
 * @param {string} values.cost - Cost value
 * @param {string} componentId - Component ID for event listener tracking
 * @returns {<HTMLElement|null>} The constructed range section or null if error
 */
export default function buildFuelRangeSection(iteration, values = {}, componentId) {
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
                build: () => buildMileageRangeInput(iteration, values.range, componentId)
            },
            costInput: {
                build: () => buildCostInput(iteration, values.cost, componentId)
            }
        };

        // Build elements
        const elements = buildElements(structure);
        
        if (!elements) return null;

        // Assemble structure
        elements.colTwo.append(elements.mileageRange, elements.costInput);
        elements.row.append(elements.colOne, elements.colTwo);

        return elements.row;
    }
    catch (err) {
        throw err;
    }
}

/**
 * Builds elements from configuration structure
 * @private
 * @param {Object} structure - Element configuration
 * @returns {Object} Built elements
 */
function buildElements(structure) {
    const elements = {};

    try {
        Object.entries(structure).map(([key, config]) => {
            elements[key] = config.build
                ? config.build()
                : buildEle(config);

            if (!elements[key]) throw new Error(`Failed to build ${key}`);
        })
        return elements;
    } catch (err) {
       throw new Error(`Error building elements: ${err}`);
    }
}

/**
 * Builds a mileage range input section with label, input, and error container
 * @param {number} iteration - The iteration number for the range input
 * @param {string} value - Existing value to populate the input
 * @param {string} componentId - Component ID for event listener tracking
 * @returns {<HTMLElement|null>} The constructed paragraph element containing the range input or null if error
 */
function buildMileageRangeInput(iteration, value, componentId) {
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
        addListener({
            elementOrId: rangeInput,
            eventType: 'focus',
            handler: async () => clearMsg({ container: rangeInputError, input: rangeInput }),
            componentId
        });

        return p1;
    }
    catch (err) {
        import("../../../../../../core/errors/models/AppError.min.js")
            .then(({ AppError }) => {
                throw new AppError('Error building mileage range inputs: ', {
                    originalError: err,
                    shouldLog: true,
                    userMessage: null,
                    errorCode: 'RENDER_ERROR',
                    displayTarget: 'fuel-range-container',
                }).handle();
            })
            .catch(err => console.error('Error handling failed for building mileage range inputs: ', err));
    }
}

/**
 * Builds a cost input section with label, input, and error container
 * @param {number} iteration - The iteration number for the cost input
 * @param {string} value - Existing value to populate the input
 * @param {string} componentId - Component ID for event listener tracking
 * @returns {<HTMLElement|null>} The constructed paragraph element containing the cost input or null if error
 */
function buildCostInput(iteration, value, componentId) {
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
        addListener({
            elementOrId: rangeInput,
            eventType: 'focus',
            handler: () => clearMsg({ container: rangeInputError, input: rangeInput }),
            componentId
        });

        return p1;
    }
    catch (err) {
        import("../../../../../../core/errors/models/AppError.min.js")
            .then(({ AppError }) => {
                throw new AppError('Error building cost inputs: ', {
                    originalError: err,
                    shouldLog: true,
                    userMessage: null,
                    errorCode: 'RENDER_ERROR',
                    displayTarget: 'fuel-range-container',
                }).handle();
            })
            .catch(err => console.error('Error handling failed for building cost inputs: ', err));
    }
}