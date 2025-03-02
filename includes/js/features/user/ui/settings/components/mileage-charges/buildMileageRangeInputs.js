import { AppError } from "../../../../../../core/errors/models/AppError.js";
import buildFuelRangeSection from "./buildFuelRangeSection.js";

/**
 * Builds fuel range input sections based on user input
 * @param {InputEvent} evt - Event from number input
 * @param {HTMLElement} rangeContainer - Container to hold the range sections
 * @param {Array|null} values - Existing values to populate inputs
 * @param {string} componentId - Component ID for event listener tracking
 * @returns {Promise<void>}
 */
export default function buildMileageRangeInputs({ evt, rangeContainer, fuelRangeContainer, values = null, componentId }) {
    try {
        const rangeInput = parseInt(evt.target.value, 10);
        const currentChildren = fuelRangeContainer.children.length;

        if (rangeInput === 0) {
            fuelRangeContainer.innerHTML = '';
            return;
        }

        if (rangeInput > currentChildren) {
            // Add new range sections
            for (let i = currentChildren; i < rangeInput; i++) {
                const valueData = values ? values[i] : {};
                const rangeSection = buildFuelRangeSection(i + 1, valueData, componentId);
                if (rangeSection) {
                    fuelRangeContainer.append(rangeSection);
                }
            }
        }
        else if (rangeInput < currentChildren && rangeInput !== 0) {
            // Remove excess range sections
            for (let i = currentChildren; i > rangeInput; i--) {
                fuelRangeContainer.removeChild(fuelRangeContainer.lastChild);
            }
        }
    }
    catch (err) {
        import("../../../../../../core/errors/models/AppError.js")
            .then(({ AppError }) => {
                new AppError('Error building mileage range inputs: ', {
                    originalError: err,
                    shouldLog: true,
                    userMessage: 'Could not build mileage range inputs.',
                    errorCode: 'RENDER_ERROR',
                    displayTarget: rangeContainer,
                }).handle();
            })
            .catch(err => console.warn('Failed handling error in buildMileageRangeInputs: ', err));
    }
}