/**
 * Updates the trim cost based on the total number of horses.
 * 
 * @param {Object} params - The parameters for the function.
 * @param {HTMLElement} params.blockElementNode - The HTML block element node.
 * @param {string} params.trimValue - The calculated trim value to set.
 * @returns {Promise<void>} - A promise that resolves when the trim cost is updated.
 */
export async function updateTrimCost({ blockElementNode, numberHorses, userFarrierPrices }) {
    try {
        const trimValue = calculateTrimValue(numberHorses, userFarrierPrices);

        // Service cost select elements
        const selectElements = blockElementNode.querySelectorAll('select[id^="service-cost-"]');

        // Loop through the select elements and update the trim value
        selectElements.forEach(select => {
            // Find the option that has trim in it
            const trimOptionArray = Array.from(select.options).find(() => 'trim');

            if (trimOptionArray) {
                trimOptionArray.value = trimValue;

                // Get the index, of the service cost
                const index = select.id.split('-').pop();

                // Get the change cost input element
                const changeCostInput = blockElementNode.querySelector(`#cost-change-${index}`);
                changeCostInput.value = trimValue.split(':')[1];
            }
        });
    }
    catch (err) {
        const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
        await handleError(
            'updateTrimCostError',
            'Update trim cost error: ',
            err,
            'We encountered an error. Unable to update the trim cost at this time.',
            'form-msg'
        );
    }
}

/**
 * Calculates the trim value based on the total number of horses.
 * 
 * @param {number} totalHorses - The total number of horses.
 * @param {Object} farrierPrices - The farrier prices object.
 * @returns {string} - The calculated trim value.
 */
export function calculateTrimValue(totalHorses, farrierPrices) {
    totalHorses = parseInt(totalHorses, 10);

    if (totalHorses >= 10) {
        return `trim:${farrierPrices.barn_trim}`;
    } else if (totalHorses >= 3 && totalHorses < 10) {
        return `trim:${farrierPrices.triple_horse_trim}`;
    } else if (totalHorses === 2) {
        return `trim:${farrierPrices.double_horse_trim}`;
    } else if (totalHorses === 1) {
        return `trim:${farrierPrices.single_horse_trim}`;
    }
    return '';
}
